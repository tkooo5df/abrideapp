import React, { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { HelpCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "البدء في الاستخدام",
      questions: [
        {
          q: "كيف أقوم بالتسجيل في المنصة؟",
          a: "انقر على زر 'تسجيل' في أعلى الصفحة، ثم اختر نوع حسابك (راكب أو سائق)، وأدخل معلوماتك الشخصية مثل الاسم، البريد الإلكتروني، ورقم الهاتف. بعد التسجيل، ستتلقى رسالة تأكيد."
        },
        {
          q: "هل التسجيل مجاني؟",
          a: "نعم! التسجيل واستخدام منصة abride مجاني تمامًا بدون أي عمولات أو رسوم على السائقين أو الركاب."
        },
        {
          q: "ما المعلومات المطلوبة للتسجيل؟",
          a: "للركاب: الاسم الكامل، رقم الهاتف، والبريد الإلكتروني. للسائقين: بالإضافة للمعلومات السابقة، معلومات السيارة (رقم التسجيل، الماركة، الموديل)، وصورة شخصية."
        }
      ]
    },
    {
      category: "حجز الرحلات",
      questions: [
        {
          q: "كيف أحجز رحلة؟",
          a: "من الصفحة الرئيسية، اختر مدينة المغادرة والوجهة والتاريخ، ثم انقر على 'بحث'. ستظهر لك قائمة بالرحلات المتاحة. اختر الرحلة المناسبة وانقر على 'احجز الآن'. أدخل عدد المقاعد المطلوبة وأكمل عملية الحجز."
        },
        {
          q: "هل يمكنني إلغاء الحجز؟",
          a: "نعم، يمكنك إلغاء الحجز قبل 24 ساعة من موعد الرحلة. تنبيه هام: في حال قيامك بإلغاء الحجز 3 مرات خلال 15 يومًا، سيتم إيقاف حسابك تلقائيًا ويتطلب إعادة التفعيل التواصل مع فريق الدعم."
        },
        {
          q: "كيف أتواصل مع السائق؟",
          a: "بعد تأكيد الحجز، ستظهر لك معلومات التواصل مع السائق (رقم الهاتف). يمكنك الاتصال به مباشرة لتنسيق تفاصيل الرحلة."
        },
        {
          q: "ماذا أفعل إذا تأخر السائق؟",
          a: "اتصل بالسائق أولاً للاستفسار عن سبب التأخير. إذا لم يرد أو كان التأخير كبيرًا، يمكنك إلغاء الحجز من خلال لوحة التحكم والإبلاغ عن المشكلة لفريق الدعم."
        }
      ]
    },
    {
      category: "للسائقين",
      questions: [
        {
          q: "كيف أنشئ رحلة جديدة؟",
          a: "من لوحة التحكم، انقر على 'إنشاء رحلة جديدة'. أدخل تفاصيل الرحلة: مكان المغادرة، الوجهة، التاريخ، الوقت، عدد المقاعد المتاحة، والسعر. ثم انقر على 'نشر الرحلة'."
        },
        {
          q: "كيف أحصل على أرباحي؟",
          a: "تحصل على أرباحك مباشرة من الركاب نقدًا عند إتمام الرحلة. المنصة لا تأخذ أي عمولة، الأرباح كاملة للسائق."
        },
        {
          q: "ماذا لو ألغى الراكب في اللحظة الأخيرة؟",
          a: "الإلغاء المتكرر (3 مرات في 15 يوم) يؤدي إلى إيقاف حساب الراكب تلقائيًا. يمكنك الإبلاغ عن عدم حضور الراكب لفريق الدعم."
        },
        {
          q: "هل يمكنني تعديل معلومات الرحلة بعد نشرها؟",
          a: "نعم، يمكنك تعديل السعر وعدد المقاعد المتاحة في أي وقت. أما تغيير التاريخ أو الوجهة، فيتطلب إشعار الركاب المحجوزين مسبقًا."
        }
      ]
    },
    {
      category: "الدفع والأسعار",
      questions: [
        {
          q: "ما هي طرق الدفع المتاحة؟",
          a: "حاليًا، الدفع يتم نقدًا عند الصعود إلى السيارة. نعمل على إضافة خيارات دفع إلكترونية قريبًا."
        },
        {
          q: "كيف يتم تحديد أسعار الرحلات؟",
          a: "السائق هو من يحدد سعر الرحلة بناءً على المسافة، تكاليف الوقود، وعوامل أخرى. ننصح دائمًا بأسعار منافسة وعادلة."
        },
        {
          q: "هل هناك رسوم إضافية؟",
          a: "السعر المعروض هو السعر النهائي. لا توجد أي رسوم مخفية أو عمولات. المنصة مجانية تمامًا للجميع."
        }
      ]
    },
    {
      category: "الأمان والثقة",
      questions: [
        {
          q: "كيف تضمنون سلامة الركاب؟",
          a: "يتم التحقق من السائقين بواسطة فريقنا التقني، حيث نقبل السائقين المعروفين والموثوقين في المجتمع المحلي. كما نوفر نظام تقييمات حيث يمكن للركاب تقييم السائقين والعكس. السائقون ذوو التقييمات المنخفضة أو السلوك غير المقبول يتم إيقافهم فورًا."
        },
        {
          q: "ماذا يحدث إذا قمت بإلغاء الحجز عدة مرات؟",
          a: "سياسة الإلغاء المتكرر: إذا قمت (سائق أو راكب) بإلغاء الحجز 3 مرات خلال 15 يومًا، سيتم إيقاف حسابك تلقائيًا. لإعادة تفعيل الحساب، يجب التواصل مع فريق الدعم على 213559509817 أو support@abride.online. هذه السياسة تضمن الالتزام والاحترام المتبادل بين جميع المستخدمين."
        },
        {
          q: "ماذا أفعل إذا واجهت مشكلة أثناء الرحلة؟",
          a: "اتصل بفريق الدعم فورًا على 213559509817. نحن متواجدون 24/7 للمساعدة في حالات الطوارئ."
        },
        {
          q: "هل معلوماتي الشخصية آمنة؟",
          a: "نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك. لن نشارك معلوماتك مع أي طرف ثالث دون إذنك."
        }
      ]
    },
    {
      category: "الدعم الفني",
      questions: [
        {
          q: "لا أستطيع تسجيل الدخول، ماذا أفعل؟",
          a: "تأكد من إدخال البريد الإلكتروني وكلمة المرور بشكل صحيح. إذا نسيت كلمة المرور، انقر على 'نسيت كلمة المرور' لإعادة تعيينها. إذا استمرت المشكلة، اتصل بالدعم."
        },
        {
          q: "التطبيق لا يعمل بشكل صحيح، ماذا أفعل؟",
          a: "حاول مسح الكاش (cache) وإعادة تشغيل التطبيق. تأكد من تحديث التطبيق لآخر نسخة. إذا استمرت المشكلة، أرسل لنا تقرير بالمشكلة."
        },
        {
          q: "كيف أتواصل مع الدعم الفني؟",
          a: "يمكنك التواصل معنا عبر: الهاتف: 213559509817، البريد الإلكتروني: support@abride.online، أو من خلال نموذج الاتصال في الموقع."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq => 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                <HelpCircle className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                الأسئلة الشائعة
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                نجيب على جميع أسئلتك حول كيفية استخدام المنصة
              </p>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="ابحث عن سؤال..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 h-12"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            {filteredFaqs.length === 0 ? (
              <Card className="text-center p-12">
                <p className="text-muted-foreground">لم يتم العثور على نتائج</p>
              </Card>
            ) : (
              <div className="space-y-8">
                {filteredFaqs.map((category, categoryIndex) => (
                  <motion.div
                    key={categoryIndex}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                      <span className="inline-block w-1 h-6 bg-primary rounded"></span>
                      {category.category}
                    </h2>
                    <div className="space-y-3">
                      {category.questions.map((faq, faqIndex) => {
                        const globalIndex = categoryIndex * 100 + faqIndex;
                        const isOpen = openIndex === globalIndex;
                        
                        return (
                          <Card key={faqIndex} className="overflow-hidden">
                            <button
                              onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                              className="w-full text-right p-4 hover:bg-accent transition-colors"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <h3 className="font-semibold text-foreground flex-1">
                                  {faq.q}
                                </h3>
                                {isOpen ? (
                                  <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                )}
                              </div>
                            </button>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <CardContent className="pt-0 pb-4 px-4">
                                  <p className="text-muted-foreground leading-relaxed">
                                    {faq.a}
                                  </p>
                                </CardContent>
                              </motion.div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12"
            >
              <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-3">لم تجد إجابة لسؤالك؟</h3>
                  <p className="mb-6 opacity-90">
                    فريق الدعم جاهز لمساعدتك في أي وقت
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="tel:213559509817">
                      <button className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors">
                        اتصل بنا: 213559509817
                      </button>
                    </a>
                    <a href="/contact">
                      <button className="bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                        أرسل رسالة
                      </button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;

