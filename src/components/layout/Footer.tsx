import { Link } from "react-router-dom";
import { Car, Facebook, Instagram, MessageCircle, MessageSquare, Phone, Mail, MapPin } from "lucide-react";
import { useIsNativeApp } from "@/hooks/useIsNativeApp";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const isNativeApp = useIsNativeApp();

  if (isNativeApp) {
    return null;
  }

  return (
    <footer className="bg-primary text-primary-foreground pb-16 md:pb-0">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-secondary p-2 rounded-lg">
                <Car className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">abride</h3>
                <p className="text-sm text-primary-foreground/80">الجزائر</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              منصة نقل ذكية تربط السائقين والركاب في ولاية غرداية ضمن مشروع تطوير بنية النقل المحلي
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.facebook.com/people/Abrideonline/61583993845397/#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary-foreground/10 p-2 rounded-md hover:bg-primary-foreground/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://www.instagram.com/abride.online/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary-foreground/10 p-2 rounded-md hover:bg-primary-foreground/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://wa.me/213559509817" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary-foreground/10 p-2 rounded-md hover:bg-primary-foreground/20 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a 
                href="https://t.me/abrideonline" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary-foreground/10 p-2 rounded-md hover:bg-primary-foreground/20 transition-colors"
                aria-label="Telegram"
              >
                <MessageSquare className="h-5 w-5" />
              </a>
            </div>
          </div>

                  {/* Quick Links */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">روابط سريعة</h4>
                    <nav className="flex flex-col gap-2">
                      <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        الرئيسية
                      </Link>
                      <Link to="/current-trips" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        الرحلات الحالية
                      </Link>
                      <Link to="/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        حولنا
                      </Link>
                      <Link to="/contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        اتصل بنا
                      </Link>
                      <Link to="/faq" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        الأسئلة الشائعة
                      </Link>
                      <Link to="/terms" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        الشروط والأحكام
                      </Link>
                      <Link to="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        سياسة الخصوصية
                      </Link>
                    </nav>
                  </div>

                  {/* Services */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">خدماتنا</h4>
                    <nav className="flex flex-col gap-2">
                      <Link to="/current-trips" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        حجز الرحلات
                      </Link>
                      <Link to="/auth/signup#driver" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        انضم كسائق
                      </Link>
                      <Link to="/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        حولنا
                      </Link>
                      <Link to="/contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                        اتصل بنا
                      </Link>
                    </nav>
                  </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">تواصل معنا</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-primary-foreground/80">
                <Phone className="h-4 w-4 text-secondary" />
                <a href="tel:213559509817" className="hover:text-primary-foreground transition-colors" dir="ltr">213559509817</a>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/80">
                <Mail className="h-4 w-4 text-secondary" />
                <a href="mailto:support@abride.online" className="hover:text-primary-foreground transition-colors">support@abride.online</a>
              </div>
              <div className="flex items-start gap-3 text-primary-foreground/80">
                <MapPin className="h-4 w-4 text-secondary mt-1" />
                <span>ولاية غرداية، الجزائر</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/80 text-sm">
              © {currentYear} abride. جميع الحقوق محفوظة.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/terms" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                الشروط والأحكام
              </Link>
              <Link to="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                سياسة الخصوصية
              </Link>
              <Link to="/cookies" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                سياسة الكوكيز
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;