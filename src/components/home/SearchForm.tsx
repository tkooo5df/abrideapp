import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { wilayas } from "@/data/wilayas";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, MapPin, Users as UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// List of ksour (قصور) in Ghardaia - القصور الـ7
const ksour = [
  { value: "قصر بريان", label: "قصر بريان" },
  { value: "قصر القرارة", label: "قصر القرارة" },
  { value: "قصر بني يزقن", label: "قصر بني يزقن" },
  { value: "قصر العطف", label: "قصر العطف" },
  { value: "قصر غرداية", label: "قصر غرداية" },
  { value: "قصر بنورة", label: "قصر بنورة" },
  { value: "قصر مليكة", label: "قصر مليكة" },
];

const SearchForm = () => {
  const navigate = useNavigate();
  const [pickupWilaya, setPickupWilaya] = useState("");
  const [destinationWilaya, setDestinationWilaya] = useState("");
  const [fromKsar, setFromKsar] = useState("");
  const [toKsar, setToKsar] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate ksar if pickupWilaya is Ghardaia (47)
    if (pickupWilaya === '47' && !fromKsar) {
      alert('يرجى تحديد القصر عندما تكون الولاية غرداية');
      return;
    }
    
    // Validate toKsar if destinationWilaya is Ghardaia (47)
    if (destinationWilaya === '47' && !toKsar) {
      alert('يرجى تحديد القصر عندما تكون الوجهة غرداية');
      return;
    }
    
    // Get wilaya names from codes
    const pickupName = wilayas.find(w => w.code === pickupWilaya)?.name || pickupWilaya;
    const destinationName = wilayas.find(w => w.code === destinationWilaya)?.name || destinationWilaya;
    
    let searchUrl = `/ride-search?pickup=${encodeURIComponent(pickupName)}&destination=${encodeURIComponent(destinationName)}&date=${date}`;
    
    // Add fromKsar to query params if pickupWilaya is Ghardaia (47)
    if (pickupWilaya === '47' && fromKsar) {
      searchUrl += `&fromKsar=${encodeURIComponent(fromKsar)}`;
    }
    
    // Add toKsar to query params if destinationWilaya is Ghardaia (47)
    if (destinationWilaya === '47' && toKsar) {
      searchUrl += `&toKsar=${encodeURIComponent(toKsar)}`;
    }
    
    navigate(searchUrl);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-900/60">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold">ابحث عن رحلة</CardTitle>
            <p className="text-center text-muted-foreground">اختر ولايات الانطلاق والوصول وحدد التاريخ لعرض الرحلات المتاحة</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* From Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickup">من</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select 
                        value={pickupWilaya} 
                        onValueChange={(value) => {
                          setPickupWilaya(value);
                          // Reset ksar if wilaya is not Ghardaia (47)
                          if (value !== '47') {
                            setFromKsar('');
                          }
                        }}
                      >
                        <SelectTrigger className="pl-9 h-11">
                          <SelectValue placeholder="اختر الولاية" />
                        </SelectTrigger>
                        <SelectContent>
                          {wilayas.map((wilaya) => (
                            <SelectItem key={wilaya.code} value={wilaya.code}>
                              {wilaya.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Ksar field - only shown when pickupWilaya is Ghardaia (47) */}
                  {pickupWilaya === '47' && (
                    <div className="space-y-2">
                      <Label htmlFor="fromKsar">قصر الانطلاق <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select value={fromKsar} onValueChange={setFromKsar}>
                          <SelectTrigger className="pl-9 h-11">
                            <SelectValue placeholder="اختر القصر" />
                          </SelectTrigger>
                          <SelectContent>
                            {ksour.map((ksar) => (
                              <SelectItem key={ksar.value} value={ksar.value}>
                                {ksar.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* To Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">الى</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select 
                      value={destinationWilaya} 
                      onValueChange={(value) => {
                        console.log('onValueChange called with value:', value, 'Type:', typeof value);
                        setDestinationWilaya(value);
                        // Reset toKsar if wilaya is not Ghardaia (47)
                        if (value !== '47') {
                          setToKsar('');
                        }
                        // Debug: check value
                        console.log('Destination Wilaya set to:', value, 'Should show toKsar:', value === '47', 'Current destinationWilaya state:', destinationWilaya);
                      }}
                    >
                      <SelectTrigger className="pl-9 h-11">
                        <SelectValue placeholder="اختر الولاية" />
                      </SelectTrigger>
                      <SelectContent>
                        {wilayas.map((wilaya) => (
                          <SelectItem key={wilaya.code} value={wilaya.code}>
                            {wilaya.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* To Ksar field - only shown when destinationWilaya is Ghardaia (47) */}
                {(destinationWilaya === '47' || String(destinationWilaya) === '47') && (
                  <div className="space-y-2">
                    <Label htmlFor="toKsar">قصر الوجهة <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select value={toKsar} onValueChange={setToKsar}>
                        <SelectTrigger className="pl-9 h-11">
                          <SelectValue placeholder="اختر القصر" />
                        </SelectTrigger>
                        <SelectContent>
                          {ksour.map((ksar) => (
                            <SelectItem key={ksar.value} value={ksar.value}>
                              {ksar.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!date}
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(new Date(date), "PPP") : <span>اختر التاريخ</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date ? new Date(date) : undefined}
                        onSelect={(d) => {
                          if (d) {
                            const iso = d.toISOString().split('T')[0];
                            setDate(iso);
                          }
                        }}
                        disabled={(d) => d < new Date(new Date().toDateString())}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passengers">عدد الركاب</Label>
                  <div className="relative">
                    <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={passengers} onValueChange={setPassengers}>
                      <SelectTrigger className="pl-9 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} راكب{num > 1 ? 'ين' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90">ابحث الآن</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SearchForm;