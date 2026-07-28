import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Server, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";

const DatabaseSwitch = () => {
  const { isInitialized, isSupabase } = useDatabase();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          نظام إدارة البيانات
        </CardTitle>
        <CardDescription>
          التطبيق يستخدم Supabase كمنصة البيانات الوحيدة لضمان تزامن الحجوزات والرحلات والحسابات بين جميع الأدوار.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-emerald-700 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-semibold text-emerald-800">Supabase مفعل بشكل افتراضي</h4>
              <p className="text-sm text-emerald-700">
                تمت إزالة قاعدة البيانات المحلية نهائياً لتجنب تضارب البيانات. كل التحديثات تتم مباشرة على Supabase حتى تبقى بيانات السائقين والركاب والإدارة متزامنة دائماً.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Server className="h-6 w-6 text-green-700" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Supabase (PostgreSQL)</h3>
                <Badge variant="default">{isSupabase ? "مفعّل" : "غير متاح"}</Badge>
                {isInitialized ? (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    جاهز
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    جاري التهيئة
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                يتم تخزين الحسابات، المركبات، الرحلات، والحجوزات مباشرة في Supabase. أي تغيير من السائق أو الراكب أو لوحة الإدارة ينعكس فوراً على الجميع.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">ما الذي يتم مزامنته؟</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>ملفات الحسابات وأدوار المستخدمين.</li>
              <li>مركبات السائقين وحالتها.</li>
              <li>الرحلات المعلنة وتوفر المقاعد.</li>
              <li>الحجوزات والمدفوعات وحالة التأكيد.</li>
            </ul>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">خطوات ضمان الاتصال</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                تأكد من ضبط مفاتيح <code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code> في ملف البيئة.
              </li>
              <li>شغّل سكربت الترحيل داخل مجلد <code>supabase/migrations</code> داخل مشروع Supabase.</li>
              <li>بعد الإعداد، قم بتحديث الصفحة للتأكد من ظهور البيانات المحدثة.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSwitch;
