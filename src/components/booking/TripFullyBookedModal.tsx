import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, AlertCircle, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TripFullyBookedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TripFullyBookedModal = ({ isOpen, onClose }: TripFullyBookedModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-muted/30">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              عذراً، الرحلة محجوزة بالكامل!
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="p-6 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10" />
            </div>
            
            <div className="space-y-3">
              <p className="text-lg font-medium">
                لقد اكتمل العدد لهذه الرحلة.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                لكن لا تقلق! ربما سيتم إضافة رحلات أخرى في قادم الأيام. 
                تابعنا على منصات التواصل الاجتماعي لتبقى على اطلاع دائم بآخر الرحلات والعروض.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white gap-2" 
                onClick={() => window.open('https://facebook.com/abride.online', '_blank')}
              >
                <Facebook className="h-5 w-5" />
                تابعنا على فيسبوك
                <ExternalLink className="h-4 w-4 mr-auto opacity-50" />
              </Button>
              
              <Button 
                className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white gap-2"
                onClick={() => window.open('https://instagram.com/abride.online', '_blank')}
              >
                <Instagram className="h-5 w-5" />
                تابعنا على انستغرام
                <ExternalLink className="h-4 w-4 mr-auto opacity-50" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 border-t bg-muted/10">
            <Button variant="outline" className="w-full" onClick={onClose}>
              حسناً، فهمت
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default memo(TripFullyBookedModal);
