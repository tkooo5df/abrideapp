import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CancellationWarningProps {
  onDismiss?: () => void;
}

const CancellationWarning: React.FC<CancellationWarningProps> = ({ onDismiss }) => {
  const { user, profile } = useAuth();
  const [cancellationCount, setCancellationCount] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchCancellationData = async () => {
      if (!user || !profile) {
        setLoading(false);
        return;
      }

      try {
        const userType = profile.role === 'driver' ? 'driver' : 'passenger';
        
        // تحقق من حالة الحساب الموقوف
        const suspended = await BrowserDatabaseService.isUserSuspended(user.id);
        setIsSuspended(suspended);
        // إذا كان الحساب موقوف، لا نحتاج لعرض التحذير
        if (suspended) {
          setLoading(false);
          return;
        }
        
        // احصل على عدد الإلغاءات فقط إذا لم يكن الحساب موقوف
        const count = await BrowserDatabaseService.getCancellationCountLast15Days(user.id, userType);
        setCancellationCount(count);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchCancellationData();
  }, [user, profile]);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (loading || dismissed || cancellationCount === 0 || isSuspended) {
    return null;
  }

  const getWarningMessage = () => {
    if (cancellationCount === 1) {
      return {
        title: 'تحذير: إلغاء واحد',
        message: 'لقد قمت بإلغاء مرة واحدة في آخر 15 يوم. إذا قمت بإلغاء مرتين أخريين، سيتم إيقاف حسابك.',
        variant: 'default' as const
      };
    } else if (cancellationCount === 2) {
      return {
        title: 'تحذير شديد: إلغاءان',
        message: 'لقد قمت بإلغاء مرتين في آخر 15 يوم. إذا قمت بإلغاء مرة أخرى، سيتم إيقاف حسابك تلقائياً.',
        variant: 'destructive' as const
      };
    } else if (cancellationCount >= 3) {
      return {
        title: 'تم إيقاف الحساب',
        message: 'تم إيقاف حسابك بسبب تجاوز حد الإلغاءات (3 إلغاءات في 15 يوم). يرجى التواصل مع الدعم لإعادة فتح الحساب.',
        variant: 'destructive' as const
      };
    }
    return null;
  };

  const warning = getWarningMessage();
  if (!warning) {
    return null;
  }

  return (
    <Alert variant={warning.variant} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold mb-1">{warning.title}</div>
          <div className="text-sm">{warning.message}</div>
          {cancellationCount >= 3 && (
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => window.open('mailto:support@abridev.com?subject=إعادة فتح الحساب', '_blank')}
                className="text-xs"
              >
                التواصل مع الدعم
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="ml-2 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default CancellationWarning;
