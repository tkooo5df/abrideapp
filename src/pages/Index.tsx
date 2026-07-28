import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import GhardaiaSection from "@/components/home/GhardaiaSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TripFeedCarousel from "@/components/TripFeedCarousel";
import MapSection from "@/components/home/MapSection";
import JoinSection from "@/components/home/JoinSection";

const Index = () => {

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main>
        <HeroSection />
        <GhardaiaSection />
        <FeaturesSection />
        <TripFeedCarousel />
        <MapSection />
        <JoinSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;