import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, User, Phone, Calendar, MapPin, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
}

const fieldLabels: { [key: string]: { label: string; icon: React.ReactNode } } = {
  first_name: { label: 'الاسم الأول', icon: <User className="h-4 w-4" /> },
  last_name: { label: 'اسم العائلة', icon: <User className="h-4 w-4" /> },
  phone: { label: 'رقم الهاتف', icon: <Phone className="h-4 w-4" /> },
  age: { label: 'السن', icon: <Calendar className="h-4 w-4" /> },
  wilaya: { label: 'الولاية', icon: <MapPin className="h-4 w-4" /> },
  ksar: { label: 'القصر', icon: <Building className="h-4 w-4" /> }
};

const ProfileCompletionModal = ({ isOpen, onClose, missingFields }: ProfileCompletionModalProps) => {
  const navigate = useNavigate();

  const handleCompleteProfile = () => {
    onClose();
    navigate('/dashboard?tab=profile-edit');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            معلومات الملف الشخصي ناقصة
          </DialogTitle>
          <DialogDescription className="text-right pt-2">
            لا يمكنك إجراء حجز إلا بعد إكمال جميع المعلومات الأساسية في الملف الشخصي.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-right">
            <p className="font-semibold mb-2">المعلومات المطلوبة:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {missingFields.map((field) => {
                const fieldInfo = fieldLabels[field];
                return (
                  <li key={field} className="flex items-center gap-2">
                    {fieldInfo?.icon}
                    <span>{fieldInfo?.label || field}</span>
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100 text-right">
            <strong>ملاحظة:</strong> يجب إكمال جميع المعلومات المطلوبة (الاسم الأول، اسم العائلة، رقم الهاتف، السن، الولاية، والقصر إذا كانت الولاية غرداية) قبل إجراء أي حجز.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleCompleteProfile} className="bg-primary hover:bg-primary/90">
            إكمال الملف الشخصي
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionModal;

