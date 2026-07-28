import React, { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Phone, Mail, MapPin, Send, MessageSquare, Facebook, Instagram, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { TelegramService } from "@/integrations/telegram/telegramService";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send message to admin via Telegram
      const telegramSent = await TelegramService.notifyContactForm({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message
      });

      if (telegramSent) {
        toast({
          title: "تم إرسال رسالتك بنجاح!",
          description: "سنتواصل معك في أقرب وقت ممكن.",
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: ""
        });
      } else {
        toast({
          title: "حدث خطأ",
          description: "لم يتم إرسال الرسالة. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "الهاتف",
      value: "213559509817",
      link: "tel:213559509817"
    },
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      value: "support@abride.online",
      link: "mailto:support@abride.online"
    },
    {
      icon: MapPin,
      title: "العنوان",
      value: "ولاية غرداية، الجزائر",
      link: null
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
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                اتصل بنا
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                نحن هنا للإجابة على جميع استفساراتك ومساعدتك في أي وقت
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <info.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{info.title}</h3>
                      {info.link ? (
                        <a 
                          href={info.link}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{info.value}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">أرسل لنا رسالة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">الاسم الكامل</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="أدخل اسمك الكامل"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">البريد الإلكتروني</label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="example@email.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">رقم الهاتف</label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+213 XXX XXX XXX"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">الموضوع</label>
                        <Input
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="موضوع رسالتك"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">الرسالة</label>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="اكتب رسالتك هنا..."
                          rows={5}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          "جاري الإرسال..."
                        ) : (
                          <>
                            <Send className="ml-2 h-4 w-4" />
                            إرسال الرسالة
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">ساعات العمل</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p>السبت - الخميس: 8:00 صباحًا - 8:00 مساءً</p>
                      <p>الجمعة: 2:00 مساءً - 8:00 مساءً</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">لماذا تتواصل معنا؟</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>الاستفسار عن خدماتنا</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>الإبلاغ عن مشكلة تقنية</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>الانضمام كسائق</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>اقتراحات لتحسين الخدمة</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>شراكات وتعاون</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3">نحن في خدمتك!</h3>
                    <p className="opacity-90 mb-4">
                      فريقنا جاهز للرد على استفساراتك في أقرب وقت ممكن. 
                      نقدر تواصلك معنا ونسعى دائمًا لتقديم أفضل خدمة.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <a 
                        href="https://www.facebook.com/people/Abrideonline/61583993845397/#" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white/20 p-2 rounded-md hover:bg-white/30 transition-colors"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                      <a 
                        href="https://www.instagram.com/abride.online/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white/20 p-2 rounded-md hover:bg-white/30 transition-colors"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                      <a 
                        href="https://wa.me/213559509817" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white/20 p-2 rounded-md hover:bg-white/30 transition-colors"
                        aria-label="WhatsApp"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
                      <a 
                        href="https://t.me/abrideonline" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white/20 p-2 rounded-md hover:bg-white/30 transition-colors"
                        aria-label="Telegram"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;

