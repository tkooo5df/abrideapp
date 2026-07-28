import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Calendar } from "lucide-react";
import { wilayas, popularWilayas } from "@/data/wilayas";
import BlurText from "@/components/BlurText";

const heroImage = "https://pbs.twimg.com/media/EG8em2JWoAAesy9?format=jpg&name=medium";

// Types
type SearchFormState = {
  fromWilaya: string;
  toWilaya: string;
  fromKsar: string;
  toKsar: string;
  date: string;
  passengers: number;
};

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

const HeroSection = () => {
  const [searchForm, setSearchForm] = useState<SearchFormState>({
    fromWilaya: "",
    toWilaya: "",
    fromKsar: "",
    toKsar: "",
    date: "",
    passengers: 1,
  });

  // Default date = today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSearchForm((prev) => ({ ...prev, date: today }));
  }, []);

  const swapLocations = () => {
    setSearchForm((prev) => ({
      ...prev,
      fromWilaya: prev.toWilaya,
      toWilaya: prev.fromWilaya,
      fromKsar: prev.toKsar, // Swap ksar values
      toKsar: prev.fromKsar, // Swap ksar values
    }));
  };

  const handleSearch = () => {
    if (searchForm.fromWilaya && searchForm.toWilaya) {
      // Validate ksar if fromWilaya is Ghardaia (47)
      if (searchForm.fromWilaya === '47' && !searchForm.fromKsar) {
        alert('يرجى تحديد القصر عندما تكون الولاية غرداية');
        return;
      }
      
      // Validate toKsar if toWilaya is Ghardaia (47)
      if (searchForm.toWilaya === '47' && !searchForm.toKsar) {
        alert('يرجى تحديد القصر عندما تكون الوجهة غرداية');
        return;
      }

      const fromWilayaName =
        wilayas.find((w) => w.code === searchForm.fromWilaya)?.name || searchForm.fromWilaya;
      const toWilayaName =
        wilayas.find((w) => w.code === searchForm.toWilaya)?.name || searchForm.toWilaya;

      const dateToUse =
        searchForm.date && searchForm.date.length === 10
          ? searchForm.date
          : new Date().toISOString().split("T")[0];

      const searchParams = new URLSearchParams({
        pickup: fromWilayaName,
        destination: toWilayaName,
        date: dateToUse,
        passengers: searchForm.passengers.toString(),
      });
      
      // Add fromKsar to query params if fromWilaya is Ghardaia (47)
      if (searchForm.fromWilaya === '47' && searchForm.fromKsar) {
        searchParams.append('fromKsar', searchForm.fromKsar);
      }
      
      // Add toKsar to query params if toWilaya is Ghardaia (47)
      if (searchForm.toWilaya === '47' && searchForm.toKsar) {
        searchParams.append('toKsar', searchForm.toKsar);
      }
      
      window.location.href = `/ride-search?${searchParams.toString()}`;
    }
  };

  const incrementPassengers = () =>
    setSearchForm((prev) => ({ ...prev, passengers: Math.min(8, prev.passengers + 1) }));
  const decrementPassengers = () =>
    setSearchForm((prev) => ({ ...prev, passengers: Math.max(1, prev.passengers - 1) }));

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="منصة أبريد - خدمة النقل في الجزائر" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 container mx-auto px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center text-white">
          <div className="space-y-2">
            <BlurText 
              text="أسهل طريقة للسفر في ولاية غرداية" 
              delay={100}
              animateBy="words"
              direction="top"
              className="text-3xl font-bold leading-tight md:text-5xl lg:text-6xl"
            />
            <BlurText 
              text="اختر نقطة الانطلاق والوجهة والتاريخ وعدد المقاعد ثم ابدأ البحث عن أفضل رحلات التاكسي بين الولايات." 
              delay={50}
              animateBy="words"
              direction="bottom"
              className="mx-auto max-w-3xl text-base text-white/80 md:text-lg"
            />
          </div>

          {/* شريط البحث: عمودي على الهاتف، أفقي على الحاسوب */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="w-full"
          >
            <div
              className="
                flex w-full items-stretch gap-2 rounded-lg border border-white/20 bg-white/10 py-2.5 px-2.5 md:py-2.5 md:px-3 shadow-xl backdrop-blur-md
                flex-col md:flex-row md:flex-nowrap
                overflow-visible
              "
            >
              {/* From */}
              <div className="min-w-0 w-full md:min-w-[200px] md:flex-1">
                <Select
                  value={searchForm.fromWilaya}
                  onValueChange={(value) => setSearchForm((p) => ({ 
                    ...p, 
                    fromWilaya: value,
                    fromKsar: value === '47' ? p.fromKsar : '' // Keep ksar if already selected, otherwise reset
                  }))}
                >
                  <SelectTrigger
                    id="from-wilaya"
                    className="h-12 w-full flex-row-reverse items-center justify-between rounded-md border border-white/80 bg-white px-3 text-right text-slate-900 shadow-sm focus:ring-1 focus:ring-primary"
                  >
                    <div className="flex w-full flex-col items-end justify-center leading-tight">
                      <span className="text-[10px] font-medium text-slate-500">من الولاية</span>
                      <span className="text-sm font-semibold">
                        <SelectValue placeholder="اختر نقطة الانطلاق" />
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 border border-slate-200 bg-white text-slate-900">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500">الولايات الشائعة</div>
                    {wilayas
                      .filter((w) => popularWilayas.includes(w.code))
                      .map((wilaya) => (
                        <SelectItem
                          key={`popular-${wilaya.code}`}
                          value={wilaya.code}
                          className="text-sm text-right data-[highlighted]:bg-black/5 data-[state=checked]:bg-black/10"
                        >
                          {wilaya.code} - {wilaya.name}
                        </SelectItem>
                      ))}
                    <div className="my-2 h-px bg-slate-200" />
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500">جميع الولايات</div>
                    {wilayas
                      .filter((w) => !popularWilayas.includes(w.code))
                      .map((wilaya) => (
                        <SelectItem
                          key={`all-${wilaya.code}`}
                          value={wilaya.code}
                          className="text-sm text-right data-[highlighted]:bg-black/5 data-[state=checked]:bg-black/10"
                        >
                          {wilaya.code} - {wilaya.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ksar field - only shown when fromWilaya is Ghardaia (47) */}
              {searchForm.fromWilaya === '47' && (
                <div className="min-w-0 w-full md:min-w-[200px] md:flex-1">
                  <Select
                    value={searchForm.fromKsar}
                    onValueChange={(value) => setSearchForm((p) => ({ ...p, fromKsar: value }))}
                  >
                    <SelectTrigger
                      id="from-ksar"
                      className="h-12 w-full flex-row-reverse items-center justify-between rounded-md border border-white/80 bg-white px-3 text-right text-slate-900 shadow-sm focus:ring-1 focus:ring-primary"
                    >
                      <div className="flex w-full flex-col items-end justify-center leading-tight">
                        <span className="text-[10px] font-medium text-slate-500">القصر <span className="text-red-500">*</span></span>
                        <span className="text-sm font-semibold">
                          <SelectValue placeholder="اختر القصر" />
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60 border border-slate-200 bg-white text-slate-900">
                      {ksour.map((ksar) => (
                        <SelectItem
                          key={ksar.value}
                          value={ksar.value}
                          className="text-sm text-right data-[highlighted]:bg-black/5 data-[state=checked]:bg-black/10"
                        >
                          {ksar.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Swap */}
              <div className="flex flex-shrink-0 items-center justify-center my-2 md:my-0">
                <button
                  type="button"
                  onClick={swapLocations}
                  className="flex h-12 w-12 items-center justify-center self-center md:self-auto rounded-md border border-yellow-500 bg-yellow-500 text-white transition-colors hover:bg-yellow-600"
                  aria-label="تبديل نقطة الانطلاق والوجهة"
                >
                  <ArrowUpDown className="h-5 w-5 text-white" />
                </button>
              </div>

              {/* To */}
              <div className="min-w-0 w-full md:min-w-[200px] md:flex-1">
                <Select
                  value={searchForm.toWilaya}
                  onValueChange={(value) => setSearchForm((p) => ({ 
                    ...p, 
                    toWilaya: value,
                    toKsar: value === '47' ? p.toKsar : '' // Reset toKsar if not Ghardaia
                  }))}
                >
                  <SelectTrigger
                    id="to-wilaya"
                    className="h-12 w-full flex-row-reverse items-center justify-between rounded-md border border-white/80 bg-white px-3 text-right text-slate-900 shadow-sm focus:ring-1 focus:ring-primary"
                  >
                    <div className="flex w-full flex-col items-end justify-center leading-tight">
                      <span className="text-[10px] font-medium text-slate-500">إلى الولاية</span>
                      <span className="text-sm font-semibold">
                        <SelectValue placeholder="اختر الوجهة" />
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 border border-slate-200 bg-white text-slate-900">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500">الولايات الشائعة</div>
                    {wilayas
                      .filter((w) => popularWilayas.includes(w.code))
                      .map((wilaya) => (
                        <SelectItem
                          key={`popular-to-${wilaya.code}`}
                          value={wilaya.code}
                          className="text-sm text-right data-[highlighted]:bg-black/5 data-[state=checked]:bg-black/10"
                        >
                          {wilaya.code} - {wilaya.name}
                        </SelectItem>
                      ))}
                    <div className="my-2 h-px bg-slate-200" />
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500">جميع الولايات</div>
                    {wilayas
                      .filter((w) => !popularWilayas.includes(w.code))
                      .map((wilaya) => (
                        <SelectItem
                          key={`to-${wilaya.code}`}
                          value={wilaya.code}
                          className="text-sm text-right data-[highlighted]:bg-black/5 data-[state=checked]:bg-black/10"
                        >
                          {wilaya.code} - {wilaya.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* To Ksar field - only shown when toWilaya is Ghardaia (47) */}
              {searchForm.toWilaya === '47' && (
                <div className="min-w-0 w-full md:min-w-[200px] md:flex-1">
                  <Select
                    value={searchForm.toKsar}
                    onValueChange={(value) => setSearchForm((p) => ({ ...p, toKsar: value }))}
                  >
                    <SelectTrigger
                      id="to-ksar"
                      className="h-12 w-full flex-row-reverse items-center justify-between rounded-md border border-white/80 bg-white px-3 text-right text-slate-900 shadow-sm focus:ring-1 focus:ring-primary"
                    >
                      <div className="flex w-full flex-col items-end justify-center leading-tight">
                        <span className="text-[10px] font-medium text-slate-500">قصر الوجهة <span className="text-red-500">*</span></span>
                        <span className="text-sm font-semibold">
                          <SelectValue placeholder="اختر القصر" />
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60 border border-slate-200 bg-white text-slate-900">
                      {ksour.map((ksar) => (
                        <SelectItem
                          key={ksar.value}
                          value={ksar.value}
                          className="text-sm text-right data-[highlighted]:bg-black/5 data-[state=checked]:bg-black/10"
                        >
                          {ksar.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date */}
              <div className="min-w-0 w-full md:min-w-[180px] md:flex-1">
                <label htmlFor="travel-date" className="block">
                  <div className="relative row flex h-12 flex-col justify-center rounded-md border border-white/80 bg-white px-3 py-2 text-right text-slate-900 shadow-sm focus-within:ring-1 focus-within:ring-primary">
                    <span className="text-[10px] font-medium text-slate-500">التاريخ</span>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <input
                        id="travel-date"
                        type="date"
                        value={searchForm.date}
                        onChange={(e) => setSearchForm((p) => ({ ...p, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full border-none bg-transparent text-sm font-semibold text-slate-900 outline-none focus:ring-0
                        [&::-webkit-calendar-picker-indicator]:opacity-0
                        [&::-webkit-calendar-picker-indicator]:cursor-pointer
                        [&::-webkit-calendar-picker-indicator]:w-full
                        [&::-webkit-calendar-picker-indicator]:h-full
                        [&::-webkit-calendar-picker-indicator]:absolute
                        [&::-webkit-calendar-picker-indicator]:top-0
                        [&::-webkit-calendar-picker-indicator]:left-0"
                      />
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary z-10">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Passengers */}
              <div className="min-w-0 w-full md:min-w-[180px] md:flex-1">
                <label htmlFor="passengers" className="block">
                  <div className="flex h-12 items-center justify-between gap-2 rounded-md border border-white/80 bg-white px-2 text-right text-slate-900 shadow-sm">
                    <button
                      type="button"
                      onClick={decrementPassengers}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/80 bg-white text-slate-900 hover:border-primary"
                      aria-label="تقليل عدد المقاعد"
                    >
                      −
                    </button>
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-[10px] font-medium text-slate-500">عدد المقاعد</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {searchForm.passengers}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={incrementPassengers}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/80 bg-white text-slate-900 hover:border-primary"
                      aria-label="زيادة عدد المقاعد"
                    >
                      +
                    </button>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <div className="min-w-0 w-full md:w-auto md:flex-shrink-0">
                <Button
                  type="submit"
                  className="h-12 w-full md:w-auto md:min-w-[120px] rounded-md bg-yellow-500 px-4 md:px-6 text-sm font-semibold text-slate-900 shadow hover:bg-yellow-600"
                >
                  بحث
                </Button>
              </div>
            </div>
          </form>

          {/* وصف المنصة */}
          <div className="mt-6 max-w-2xl mx-auto">
            <p className="text-base md:text-lg text-white/90 text-center leading-relaxed font-medium">
              منصة نقل ذكية تربط السائقين والركاب في ولاية غرداية ضمن مشروع تطوير بنية النقل المحلي
            </p>
          </div>

          {/* تلميح نسخة الهاتف */}
          <p className="mt-1 text-xs text-white/70 md:hidden">على الهاتف، ستظهر الحقول أسفل بعضها.</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;