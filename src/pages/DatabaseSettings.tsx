import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DatabaseSwitch from "@/components/DatabaseSwitch";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const DatabaseSettings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">إعدادات قاعدة البيانات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-4">
                <DatabaseSwitch />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DatabaseSettings;