export interface DisplayNameOptions {
  fallback?: string;
  email?: string | null;
  extraValues?: Array<string | null | undefined>;
}

type DisplaySource = Record<string, unknown> | null;

type CandidateInput = DisplaySource | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const sanitizeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  return '';
};

const extractEmailHandle = (email?: string | null): string => {
  if (!email) {
    return '';
  }

  const [handle] = email.split('@');
  return handle?.trim() ?? '';
};

const getNestedRecord = (source: CandidateInput, key: string): DisplaySource => {
  if (!source) {
    return null;
  }

  const value = source[key];
  return isRecord(value) ? (value as Record<string, unknown>) : null;
};

const getValue = (source: CandidateInput, key: string): string => {
  if (!source) {
    return '';
  }

  return sanitizeValue(source[key]);
};

const collectCandidates = (input: unknown): string[] => {
  if (!isRecord(input)) {
    return [];
  }

  const source = input as Record<string, unknown>;
  const profile = getNestedRecord(source, 'profile');
  const metadata = getNestedRecord(source, 'metadata');
  const userMetadata = getNestedRecord(source, 'user_metadata');

  const candidates: string[] = [
    getValue(source, 'displayName'),
    getValue(source, 'fullName'),
    getValue(source, 'full_name'),
    getValue(source, 'name'),
    getValue(profile, 'fullName'),
    getValue(profile, 'name'),
    getValue(userMetadata, 'full_name'),
    getValue(metadata, 'full_name'),
    getValue(userMetadata, 'name'),
    getValue(metadata, 'name'),
  ];

  const combinedName = `${getValue(source, 'firstName')} ${getValue(source, 'lastName')}`.trim();
  const combinedNameAlt = `${getValue(source, 'first_name')} ${getValue(source, 'last_name')}`.trim();

  if (combinedName) {
    candidates.push(combinedName);
  }

  if (combinedNameAlt) {
    candidates.push(combinedNameAlt);
  }

  const emailCandidates = [
    getValue(source, 'email'),
    getValue(userMetadata, 'email'),
    getValue(profile, 'email'),
  ];

  emailCandidates.forEach((email) => {
    const handle = extractEmailHandle(email);
    if (handle) {
      candidates.push(handle);
    }
  });

  return candidates.filter((value) => value.length > 0);
};

export const getDisplayName = (
  input: unknown | Array<unknown>,
  options: DisplayNameOptions = {}
): string => {
  const fallback = options.fallback ?? 'عضو';
  const sources = Array.isArray(input) ? input : [input];

  for (const source of sources) {
    const candidates = collectCandidates(source);
    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  const extraCandidates: string[] = [];

  if (options.email) {
    const handle = extractEmailHandle(options.email);
    if (handle) {
      extraCandidates.push(handle);
    }
  }

  if (options.extraValues) {
    options.extraValues.forEach((value) => {
      if (value) {
        const sanitized = sanitizeValue(value);
        if (sanitized) {
          extraCandidates.push(sanitized);
        }
      }
    });
  }

  if (extraCandidates.length > 0) {
    return extraCandidates[0];
  }

  return fallback;
};
