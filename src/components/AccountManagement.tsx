import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useNavigate } from 'react-router-dom';
import { Trash2, User, Car, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AccountManagement = () => {
  const { accounts, switchAccount, user } = useLocalAuth();
  const navigate = useNavigate();

  const handleSwitchAccount = async (email: string) => {
    try {
      const result = await switchAccount(email);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: "تم تبديل الحساب بنجاح",
        description: "مرحباً بك مرة أخرى!",
      });
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "خطأ في تبديل الحساب",
        description: error.message || "حدث خطأ أثناء تبديل الحساب",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = (email: string) => {
    // In a real application, you would implement account deletion logic here
    // For now, we'll just show a toast message
    toast({
      title: "تم حذف الحساب",
      description: `تم حذف الحساب ${email} بنجاح`,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'driver':
        return <Car className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'driver':
        return 'سائق';
      case 'admin':
        return 'مدير';
      default:
        return 'راكب';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الحسابات</CardTitle>
        <CardDescription>
          إدارة الحسابات المحفوظة على هذا الجهاز
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>لا توجد حسابات محفوظة</p>
            <p className="text-sm mt-2">قم بإنشاء حساب جديد لإضافته إلى هذه القائمة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  user?.email === account.email 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-muted/50 hover:bg-muted/100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRoleIcon(account.role)}
                  <div>
                    <p className="font-medium">{account.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {getRoleName(account.role)}
                      {user?.email === account.email && ' (الحساب الحالي)'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user?.email !== account.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchAccount(account.email)}
                    >
                      تبديل
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAccount(account.email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 text-center">
          <Button onClick={() => navigate('/auth/signup')}>
            إنشاء حساب جديد
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountManagement;