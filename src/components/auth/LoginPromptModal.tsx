import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Car, Shield, Clock, Users, MapPin } from 'lucide-react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

const LoginPromptModal = ({
  isOpen,
  onClose,
  title = "تسجيل الدخول مطلوب",
  description = "لإكمال عملية الحجز، يرجى تسجيل الدخول أو إنشاء حساب جديد"
}: LoginPromptModalProps) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/auth/signin');
  };

  const handleSignUp = () => {
    onClose();
    navigate('/auth/signup');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits for Drivers */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">للسائقين</h3>
                  <p className="text-sm text-muted-foreground">أضف رحلاتك وكسب المال</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>إدارة الحجوزات والركاب</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>تحديد المسارات والأوقات</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>جدولة الرحلات حسب احتياجاتك</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits for Passengers */}
          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary">للركاب</h3>
                  <p className="text-sm text-muted-foreground">احجز رحلات مريحة وآمنة</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>أكثر من 100 وجهة في الجزائر</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>حجوزات آمنة ومضمونة</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>حجوزات فورية وسريعة</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSignUp}
              className="w-full"
              size="lg"
            >
              إنشاء حساب جديد
            </Button>
            <Button
              onClick={handleLogin}
              variant="outline"
              className="w-full"
              size="lg"
            >
              تسجيل الدخول
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            بإنشاء حسابك، توافق على <span className="text-primary cursor-pointer hover:underline">الشروط والأحكام</span> و <span className="text-primary cursor-pointer hover:underline">سياسة الخصوصية</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;



