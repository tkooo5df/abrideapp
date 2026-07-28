import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, UserX } from 'lucide-react';

const CancellationManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة الإلغاءات والإيقافات</h2>
          <p className="text-gray-600">مراقبة وإدارة إلغاءات المستخدمين وإيقاف الحسابات</p>
        </div>
      </div>

      {/* Test Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            تبويب الإلغاءات يعمل!
          </CardTitle>
          <CardDescription>
            هذا تبويب الإلغاءات - إذا كنت ترى هذا النص، فالتبويب يعمل بشكل صحيح
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserX className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">سيتم إضافة إحصائيات الإلغاءات هنا قريباً</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CancellationManagement;
