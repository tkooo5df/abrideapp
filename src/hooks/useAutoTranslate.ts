import { useEffect, useRef } from "react";
import { Language } from "./translations";
import { useTranslation } from "./useTranslation";

const ARABIC_REGEX = /[\u0600-\u06FF]/;
const ATTRIBUTE_KEYS = ["placeholder", "title", "aria-label", "alt", "value"] as const;
const CACHE_STORAGE_KEY = "autoTranslationCache.ar-en.v1";

const translationCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();
let cacheInitialized = false;
const MAX_CONCURRENT_REQUESTS = 5;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

const scheduleRequest = <T>(task: () => Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      activeRequests += 1;
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeRequests = Math.max(0, activeRequests - 1);
          const next = requestQueue.shift();
          if (next) {
            next();
          }
        });
    };

    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      run();
    } else {
      requestQueue.push(run);
    }
  });
};

const ensureCacheLoaded = () => {
  if (cacheInitialized) return;
  cacheInitialized = true;

  if (typeof window === "undefined") return;

  try {
    const stored = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored) as [string, string][];
    for (const [key, value] of parsed) {
      translationCache.set(key, value);
    }
  } catch (error) {
  }
};

const persistCache = () => {
  if (typeof window === "undefined") return;

  try {
    const entries = Array.from(translationCache.entries());
    // Keep the cache at a reasonable size to avoid bloating localStorage
    const limitedEntries = entries.slice(-600);
    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(limitedEntries));
  } catch (error) {
  }
};

const fetchTranslation = async (text: string): Promise<string> => {
  ensureCacheLoaded();

  const trimmed = text.trim();
  if (!trimmed) return text;
  if (trimmed.length > 450) {
    translationCache.set(trimmed, trimmed);
    return text;
  }

  if (translationCache.has(trimmed)) {
    return translationCache.get(trimmed)!;
  }

  if (pendingRequests.has(trimmed)) {
    return pendingRequests.get(trimmed)!;
  }

  const requestPromise = scheduleRequest(async () => {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=ar|en`
      );
      if (!response.ok) {
        throw new Error(`Translation request failed with status ${response.status}`);
      }

      const data = await response.json();
      const translatedText = (data?.responseData?.translatedText as string | undefined)?.trim();
      const safeTranslation = translatedText && translatedText.length > 0 ? translatedText : trimmed;

      translationCache.set(trimmed, safeTranslation);
      persistCache();

      return safeTranslation;
    } catch (error) {
      translationCache.set(trimmed, trimmed);
      return trimmed;
    }
  });

  pendingRequests.set(trimmed, requestPromise);
  return requestPromise.finally(() => {
    pendingRequests.delete(trimmed);
  });
};

const getPreservedSpacing = (original: string, translated: string) => {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
};

interface AttributeSnapshot {
  [key: string]: string;
}

export const useAutoTranslate = (language: Language) => {
  const originalTextsRef = useRef<Map<Text, string>>(new Map());
  const originalAttributesRef = useRef<Map<Element, AttributeSnapshot>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const languageRef = useRef(language);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const originalTexts = originalTextsRef.current;
    const originalAttributes = originalAttributesRef.current;

    const restoreOriginals = () => {
      // Restore text nodes
      for (const [node, originalValue] of originalTexts.entries()) {
        if (node.textContent !== null) {
          node.textContent = originalValue;
        }
      }
      originalTexts.clear();

      // Restore attributes
      for (const [element, snapshot] of originalAttributes.entries()) {
        for (const [attr, value] of Object.entries(snapshot)) {
          if (value === null) {
            element.removeAttribute(attr);
          } else {
            element.setAttribute(attr, value);
          }
        }
      }
      originalAttributes.clear();
    };

    const translateTextNode = async (node: Text) => {
      if (!node.parentElement) return;
      const parentTag = node.parentElement.tagName;
      if (parentTag === "SCRIPT" || parentTag === "STYLE") return;
      const originalText = node.textContent ?? "";
      if (!originalText || !ARABIC_REGEX.test(originalText)) return;

      if (!originalTexts.has(node)) {
        originalTexts.set(node, originalText);
      }

      const translated = await fetchTranslation(originalText);
      if (languageRef.current !== "en") return;

      // Ensure the text hasn't been modified by other interactions before applying translation
      const currentContent = node.textContent ?? "";
      if (currentContent && ARABIC_REGEX.test(currentContent)) {
        node.textContent = getPreservedSpacing(originalText, translated);
      }
    };

    const translateElementAttributes = async (element: Element) => {
      for (const attr of ATTRIBUTE_KEYS) {
        const value = element.getAttribute(attr);
        if (!value || !ARABIC_REGEX.test(value)) continue;

        const snapshot = originalAttributes.get(element) ?? {};
        if (!(attr in snapshot)) {
          snapshot[attr] = value;
          originalAttributes.set(element, snapshot);
        }

        const translated = await fetchTranslation(value);
        if (languageRef.current !== "en") return;

        // Only set attribute if it still contains Arabic
        const current = element.getAttribute(attr);
        if (current && ARABIC_REGEX.test(current)) {
          element.setAttribute(attr, translated);
        }
      }
    };

    const processNode = (node: Node) => {
      if (languageRef.current !== "en") return;

      if (node.nodeType === Node.TEXT_NODE) {
        translateTextNode(node as Text);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        translateElementAttributes(node as Element);

        // Special handling for input elements with value attribute representing placeholders
        if ((node as HTMLInputElement).tagName === "INPUT") {
          const input = node as HTMLInputElement;
          if (input.type !== "password" && ARABIC_REGEX.test(input.value)) {
            const snapshot = originalAttributes.get(input) ?? {};
            if (!("value" in snapshot)) {
              snapshot.value = input.value;
              originalAttributes.set(input, snapshot);
            }
            fetchTranslation(input.value).then((translated) => {
              if (languageRef.current !== "en") return;
              if (ARABIC_REGEX.test(input.value)) {
                input.value = translated;
              }
            });
          }
        }

        node.childNodes.forEach(processNode);
      }
    };

    if (language === "en") {
      processNode(document.body);

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach(processNode);
          }
          if (mutation.type === "characterData" && mutation.target.nodeType === Node.TEXT_NODE) {
            processNode(mutation.target);
          }
          if (mutation.type === "attributes" && mutation.target instanceof Element) {
            translateElementAttributes(mutation.target);
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRIBUTE_KEYS.slice(),
      });

      observerRef.current = observer;
    } else {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      restoreOriginals();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (languageRef.current !== "en") {
        restoreOriginals();
      }
    };
  }, [language]);
};

export const AutoTranslationManager = () => {
  const { language } = useTranslation();
  useAutoTranslate(language);
  return null;
};
