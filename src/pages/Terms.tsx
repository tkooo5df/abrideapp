import React from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FileText, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Terms = () => {
  const sections = [
    {
      title: "1. القبول بالشروط",
      content: "باستخدامك لمنصة abride، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام المنصة."
    },
    {
      title: "2. التسجيل والحساب",
      content: "يجب عليك تقديم معلومات دقيقة وكاملة عند التسجيل. أنت مسؤول عن الحفاظ على سرية حسابك وكلمة المرور. يجب أن تكون بعمر 18 عامًا على الأقل لإنشاء حساب."
    },
    {
      title: "3. مسؤوليات المستخدم",
      content: `
        - احترام جميع المستخدمين الآخرين على المنصة
        - عدم استخدام المنصة لأغراض غير قانونية
        - تقديم معلومات صحيحة ودقيقة
        - الالتزام بالمواعيد المتفق عليها
        - عدم نشر محتوى مسيء أو غير لائق
      `
    },
    {
      title: "4. شروط السائقين",
      content: `
        - أن يكون معروفًا وموثوقًا في المجتمع المحلي
        - التحقق والموافقة من قبل الفريق التقني
        - التأكد من صلاحية السيارة وتأمينها
        - الالتزام بقوانين المرور والسلامة
        - معاملة الركاب باحترام ومهنية
        - الحفاظ على نظافة وسلامة السيارة
        - عدم إلغاء الرحلات المتكرر (أكثر من 3 مرات في 15 يوم)
      `
    },
    {
      title: "5. شروط الركاب",
      content: `
        - الالتزام بالموعد المتفق عليه
        - احترام السائق والركاب الآخرين
        - عدم التدخين أو التصرف بشكل غير لائق في السيارة
        - دفع المبلغ المتفق عليه نقدًا للسائق
        - إبلاغ السائق في حالة التأخير أو الإلغاء
        - عدم الإلغاء المتكرر (أكثر من 3 مرات في 15 يوم)
      `
    },
    {
      title: "6. الحجز والإلغاء",
      content: "يمكن إلغاء الحجز قبل 24 ساعة من موعد الرحلة. تنبيه هام: الإلغاء المتكرر (3 مرات خلال 15 يومًا) يؤدي إلى إيقاف الحساب تلقائيًا ويتطلب إعادة التفعيل التواصل مع فريق الدعم. عدم الحضور دون إلغاء يعتبر انتهاكًا خطيرًا للشروط."
    },
    {
      title: "7. الدفع والرسوم",
      content: "الدفع يتم نقدًا مباشرة من الراكب للسائق. المنصة مجانية بالكامل ولا تأخذ أي عمولات أو رسوم من أي طرف. السعر المعروض هو السعر النهائي المتفق عليه بين السائق والراكب."
    },
    {
      title: "8. المسؤولية",
      content: "منصة abride هي وسيط بين السائقين والركاب. نحن غير مسؤولين عن أي أضرار أو خسائر قد تحدث أثناء الرحلة. السائق مسؤول عن سلامة الركاب والالتزام بقوانين المرور."
    },
    {
      title: "9. التقييمات والمراجعات",
      content: "يحق لكل مستخدم تقييم الآخرين بعد اكتمال الرحلة. يجب أن تكون التقييمات صادقة ومحترمة. المنصة تحتفظ بالحق في حذف التقييمات المسيئة أو الكاذبة."
    },
    {
      title: "10. الإيقاف والحظر",
      content: "نحتفظ بالحق في إيقاف أو حظر أي حساب ينتهك هذه الشروط أو يسيء استخدام المنصة. قد يكون الإيقاف مؤقتًا أو دائمًا حسب خطورة الانتهاك."
    },
    {
      title: "11. الملكية الفكرية",
      content: "جميع محتويات المنصة (شعار، تصميم، نصوص، صور) هي ملك لـ abride ومحمية بحقوق النشر. يُمنع نسخها أو استخدامها دون إذن كتابي."
    },
    {
      title: "12. حماية البيانات",
      content: "نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. يرجى الاطلاع على سياسة الخصوصية الخاصة بنا لمزيد من التفاصيل حول كيفية جمع واستخدام بياناتك."
    },
    {
      title: "13. التعديلات على الشروط",
      content: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار في المنصة."
    },
    {
      title: "14. القانون الواجب التطبيق",
      content: "تخضع هذه الشروط والأحكام للقوانين الجزائرية. أي نزاع سيتم حله في المحاكم المختصة في ولاية غرداية."
    },
    {
      title: "15. التواصل",
      content: "لأي استفسارات حول هذه الشروط، يرجى التواصل معنا عبر: البريد الإلكتروني: support@abride.online، الهاتف: 213559509817"
    }
  ];

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
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                الشروط والأحكام
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                يرجى قراءة هذه الشروط بعناية قبل استخدام المنصة
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                آخر تحديث: أكتوبر 2024
              </p>
            </motion.div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2 border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-900/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                        تنويه هام
                      </h3>
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm leading-relaxed">
                        باستخدامك لمنصة abride، فإنك توافق تلقائيًا على جميع الشروط والأحكام 
                        الموضحة أدناه. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف 
                        عن استخدام المنصة فورًا.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-8 px-4 pb-16">
          <div className="container mx-auto max-w-4xl">
            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold text-primary mb-3">
                        {section.title}
                      </h2>
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Agreement Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12"
            >
              <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-3">هل لديك أسئلة؟</h3>
                  <p className="mb-6 opacity-90">
                    إذا كان لديك أي استفسارات حول هذه الشروط والأحكام، لا تتردد في التواصل معنا
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/contact">
                      <button className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors">
                        اتصل بنا
                      </button>
                    </a>
                    <a href="/faq">
                      <button className="bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors">
                        الأسئلة الشائعة
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

export default Terms;

