import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Code2, ExternalLink } from "lucide-react";

const DeveloperSection = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30" dir="rtl">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden border-2 hover:border-primary transition-all duration-300 shadow-lg">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Developer Info */}
                <div className="flex-1 p-8 md:p-12">
                  <div className="flex items-center gap-2 mb-4">
                    <Code2 className="h-6 w-6 text-primary" />
                    <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                      المطور
                    </span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                    أمين كركار
                  </h2>
                  
                  <p className="text-lg text-primary font-semibold mb-4">
                    مؤسس ومطور منصة abride
                  </p>
                  
                  <div className="space-y-2 text-muted-foreground mb-6">
                    <p className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                      طالب جامعي، 19 سنة
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                      من ولاية غرداية
                    </p>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    مطور شاب طموح قام بتصميم وبناء منصة abride بالكامل من الصفر. 
                    يهدف إلى تطوير حلول تقنية مبتكرة تخدم المجتمع المحلي في غرداية 
                    وتساهم في تحسين بنية النقل والخدمات الرقمية.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href="https://www.facebook.com/amine.kerkar.74721/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    
                    <a 
                      href="https://www.linkedin.com/company/13032580/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                
                {/* Developer Image */}
                <div className="md:w-80 relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                  <div className="relative h-full flex items-center justify-center p-8">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                      <img 
                        src="https://media.licdn.com/dms/image/v2/D4D03AQHIm9xkh5Fwkg/profile-displayphoto-shrink_200_200/B4DZW0sh83HkAk-/0/1742493327983?e=2147483647&v=beta&t=99Ik7cMFpQWrT4ubyDR3sbELsbZiJvj9jJH3gK4SHMg"
                        alt="أمين كركار"
                        className="relative w-48 h-48 rounded-full object-cover border-4 border-primary/30 shadow-2xl"
                      />
                      {/* Decorative elements */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full opacity-60"></div>
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-secondary rounded-full opacity-60"></div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Tech Stack Badge (Optional) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            تم تطوير المنصة باستخدام أحدث التقنيات: React, TypeScript, Supabase
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DeveloperSection;

