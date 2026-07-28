import React from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Shield, Lock, Eye, Database, UserCheck, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Privacy = () => {
  const principles = [
    {
      icon: Shield,
      title: "الشفافية",
      description: "نوضح لك بدقة ما نجمعه من بيانات وكيف نستخدمها"
    },
    {
      icon: Lock,
      title: "الأمان",
      description: "نستخدم أحدث تقنيات التشفير لحماية معلوماتك"
    },
    {
      icon: UserCheck,
      title: "التحكم",
      description: "أنت تتحكم في بياناتك ويمكنك تعديلها أو حذفها في أي وقت"
    }
  ];

  const sections = [
    {
      title: "1. المعلومات التي نجمعها",
      icon: Database,
      content: `
نجمع أنواعًا مختلفة من المعلومات لتقديم وتحسين خدماتنا:

**معلومات الحساب:**
• الاسم الكامل
• رقم الهاتف
• البريد الإلكتروني
• تاريخ الميلاد
• الصورة الشخصية (اختياري)

**للسائقين إضافةً:**
• معلومات السيارة (رقم التسجيل، الماركة، الموديل، اللون)
• معلومات التأمين
• التحقق من الهوية بواسطة الفريق التقني

**معلومات الرحلات:**
• مواقع المغادرة والوصول
• التاريخ والوقت
• عدد الركاب
• تفاصيل الدفع

**معلومات الجهاز:**
• نوع الجهاز ونظام التشغيل
• عنوان IP
• معرف الجهاز الفريد
• بيانات الموقع (عند الموافقة)
      `
    },
    {
      title: "2. كيف نستخدم معلوماتك",
      icon: Eye,
      content: `
نستخدم المعلومات التي نجمعها للأغراض التالية:

**تقديم الخدمة:**
• ربط السائقين والركاب
• معالجة الحجوزات
• إدارة الدفعات
• إرسال إشعارات حول الرحلات

**تحسين الخدمة:**
• تحليل أنماط الاستخدام
• تطوير ميزات جديدة
• إصلاح الأخطاء التقنية
• تحسين تجربة المستخدم

**الأمان والثقة:**
• التحقق من هوية المستخدمين
• منع الاحتيال
• حماية سلامة المستخدمين
• حل النزاعات

**التواصل:**
• إرسال تحديثات الخدمة
• الإشعارات الهامة
• العروض الترويجية (يمكن إلغاء الاشتراك)
• الرد على الاستفسارات
      `
    },
    {
      title: "3. مشاركة المعلومات",
      icon: UserCheck,
      content: `
نحن لا نبيع معلوماتك الشخصية أبدًا. نشارك معلوماتك فقط في الحالات التالية:

**مع مستخدمين آخرين:**
• عند حجز رحلة، نشارك اسمك ورقم هاتفك مع السائق/الراكب
• التقييمات والمراجعات تكون مرئية للجميع

**مقدمو الخدمات:**
• شركات الدفع الإلكتروني
• خدمات الاستضافة والبنية التحتية
• أدوات التحليل وتحسين الأداء

**الالتزامات القانونية:**
• عند الطلب من جهات حكومية بموجب القانون
• لحماية حقوقنا وممتلكاتنا
• في حالات الطوارئ لحماية السلامة
      `
    },
    {
      title: "4. أمان البيانات",
      icon: Lock,
      content: `
نتخذ إجراءات أمنية صارمة لحماية معلوماتك:

**التشفير:**
• تشفير البيانات أثناء النقل (SSL/TLS)
• تشفير البيانات المخزنة
• تشفير كلمات المرور

**التحكم في الوصول:**
• الوصول محدود للموظفين المصرح لهم فقط
• مراقبة جميع عمليات الوصول للبيانات
• مصادقة ثنائية للحسابات الحساسة

**النسخ الاحتياطي:**
• نسخ احتياطية يومية للبيانات
• تخزين آمن في مراكز بيانات متعددة
• خطط استرداد الكوارث
      `
    },
    {
      title: "5. حقوقك",
      icon: UserCheck,
      content: `
لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية:

**الوصول:**
• طلب نسخة من جميع بياناتك
• معرفة كيف نستخدم معلوماتك

**التصحيح:**
• تحديث أو تصحيح معلوماتك
• إضافة معلومات ناقصة

**الحذف:**
• طلب حذف حسابك وبياناتك
• قد نحتفظ ببعض المعلومات للالتزامات القانونية

**الاعتراض:**
• الاعتراض على استخدام معين لبياناتك
• إلغاء الاشتراك من الرسائل التسويقية

**نقل البيانات:**
• طلب نقل بياناتك إلى خدمة أخرى
• الحصول على بياناتك بصيغة قابلة للقراءة آليًا
      `
    },
    {
      title: "6. ملفات تعريف الارتباط (Cookies)",
      icon: Database,
      content: `
نستخدم ملفات تعريف الارتباط لتحسين تجربتك:

**ملفات ضرورية:**
• للحفاظ على تسجيل دخولك
• تذكر تفضيلاتك
• أمان الموقع

**ملفات التحليل:**
• فهم كيفية استخدام المنصة
• تحليل الأداء
• تحسين الخدمة

**يمكنك التحكم في ملفات تعريف الارتباط من إعدادات المتصفح.**
      `
    },
    {
      title: "7. الاحتفاظ بالبيانات",
      icon: Database,
      content: `
نحتفظ ببياناتك طالما كان حسابك نشطًا أو حسب الحاجة لتقديم الخدمات:

• بيانات الحساب: طالما الحساب نشط
• بيانات الرحلات: 5 سنوات للسجلات المحاسبية
• رسائل الدعم: 3 سنوات
• السجلات الأمنية: سنة واحدة

بعد حذف الحساب، نحذف معظم البيانات خلال 30 يومًا، لكن قد نحتفظ ببعض المعلومات للالتزامات القانونية.
      `
    },
    {
      title: "8. خصوصية الأطفال",
      icon: UserCheck,
      content: `
خدماتنا مخصصة للأشخاص الذين تزيد أعمارهم عن 18 عامًا. 

لا نجمع عن قصد معلومات من الأطفال دون سن 18. إذا اكتشفنا أن طفلاً قدم معلومات، سنحذفها فورًا.

إذا كنت ولي أمر وتعتقد أن طفلك قدم معلومات، يرجى الاتصال بنا فورًا.
      `
    },
    {
      title: "9. التحديثات على هذه السياسة",
      icon: Bell,
      content: `
قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنعلمك بأي تغييرات جوهرية من خلال:

• إشعار بارز على المنصة
• رسالة بريد إلكتروني
• إشعار في التطبيق

آخر تحديث: أكتوبر 2024

استمرارك في استخدام المنصة بعد التحديثات يعني موافقتك على السياسة الجديدة.
      `
    },
    {
      title: "10. اتصل بنا",
      icon: Bell,
      content: `
إذا كان لديك أي أسئلة أو مخاوف بشأن خصوصيتك:

**البريد الإلكتروني:**
support@abride.online

**الهاتف:**
213559509817

**العنوان:**
ولاية غرداية، الجزائر

نحن ملتزمون بحماية خصوصيتك وسنرد على استفساراتك في أقرب وقت ممكن.
      `
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
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                سياسة الخصوصية
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                نحن نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                آخر تحديث: أكتوبر 2024
              </p>
            </motion.div>
          </div>
        </section>

        {/* Principles */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center text-primary mb-12"
            >
              مبادئنا الأساسية
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {principles.map((principle, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <principle.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{principle.title}</h3>
                      <p className="text-muted-foreground">
                        {principle.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Sections */}
        <section className="py-8 px-4 pb-16 bg-muted/30">
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
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <section.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-primary flex-1">
                          {section.title}
                        </h2>
                      </div>
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12"
            >
              <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-90" />
                  <h3 className="text-2xl font-bold mb-3">خصوصيتك مهمة بالنسبة لنا</h3>
                  <p className="mb-6 opacity-90">
                    إذا كان لديك أي أسئلة حول سياسة الخصوصية أو كيفية معالجة بياناتك، 
                    لا تتردد في التواصل معنا
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

export default Privacy;

