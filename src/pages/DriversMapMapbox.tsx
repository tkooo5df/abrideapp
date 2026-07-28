import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapboxMap from '@/components/map/MapboxMap';
import { MAPBOX_CONFIG, MARKER_ICONS, GHARDAIA_CENTER } from '@/config/mapbox';
import { locationTrackingService } from '@/services/locationTracking';
import { useDatabase } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Filter, MapPin, Star, Car } from 'lucide-react';

interface DriverMarker {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  rating: number;
  totalTrips: number;
  vehicleType: string;
  isAvailable: boolean;
  currentTrip?: {
    from: string;
    to: string;
    availableSeats: number;
  };
}

const DriversMapMapbox = () => {
  const navigate = useNavigate();
  const { getAllDrivers } = useDatabase();
  
  const [drivers, setDrivers] = useState<DriverMarker[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverMarker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [mapCenter, setMapCenter] = useState(GHARDAIA_CENTER);
  const [mapZoom, setMapZoom] = useState(12);

  // Fetch drivers data
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        // In a real implementation, this would fetch actual driver data
        // For now, we'll use mock data to demonstrate the functionality
        const mockDrivers: DriverMarker[] = [
          {
            id: '1',
            name: 'محمد أحمد',
            location: { lat: 32.4913, lng: 3.6745 },
            rating: 4.8,
            totalTrips: 127,
            vehicleType: 'تويوتا كامري',
            isAvailable: true,
            currentTrip: {
              from: 'غرداية',
              to: 'الجزائر',
              availableSeats: 3
            }
          },
          {
            id: '2',
            name: 'علي عبد الله',
            location: { lat: 32.5500, lng: 3.7500 },
            rating: 4.5,
            totalTrips: 89,
            vehicleType: 'هيونداي إيلنترا',
            isAvailable: true
          },
          {
            id: '3',
            name: 'عمر سعيد',
            location: { lat: 32.4000, lng: 3.6000 },
            rating: 4.9,
            totalTrips: 203,
            vehicleType: 'كيا سorento',
            isAvailable: false
          }
        ];
        
        setDrivers(mockDrivers);
      } catch (error) {
      }
    };

    fetchDrivers();
  }, []);

  // Filter drivers based on search and availability
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         driver.vehicleType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = !showAvailableOnly || driver.isAvailable;
    return matchesSearch && matchesAvailability;
  });

  const handleMarkerClick = (driver: DriverMarker) => {
    setSelectedDriver(driver);
    setMapCenter(driver.location);
    setMapZoom(14);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Prepare markers for MapboxMap component
  const mapMarkers = filteredDrivers.map(driver => ({
    id: driver.id,
    position: driver.location,
    icon: (driver.isAvailable ? 'driver' : 'passenger') as keyof typeof MARKER_ICONS,
    title: driver.name,
    onClick: () => handleMarkerClick(driver),
    popupContent: `
      <div class="p-3 min-w-[200px]" dir="rtl">
        <h3 class="font-bold text-lg mb-2">
          ${driver.name}
        </h3>
        <div class="flex items-center gap-1 mb-2">
          <Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span class="text-sm">${driver.rating} (${driver.totalTrips} رحلة)</span>
        </div>
        <div class="text-sm text-gray-600 mb-2">
          ${driver.vehicleType}
        </div>
        <Badge variant={driver.isAvailable ? "default" : "secondary"}>
          ${driver.isAvailable ? '🟢 متاح' : '🔴 مشغول'}
        </Badge>
        ${driver.currentTrip ? `
          <div class="mt-2 p-2 bg-blue-50 rounded text-sm">
            <div class="flex items-center gap-1 text-blue-700 mb-1">
              <MapPin class="h-3 w-3" />
              <span class="font-medium">رحلة حالية</span>
            </div>
            <div class="text-xs text-gray-600">
              ${driver.currentTrip.from} ← ${driver.currentTrip.to}
            </div>
            <div class="text-xs text-gray-600 mt-1">
              ${driver.currentTrip.availableSeats} مقعد متاح
            </div>
          </div>
        ` : ''}
      </div>
    `
  }));

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </Button>
            <h1 className="text-xl font-bold">خريطة السائقين</h1>
            <div className="w-16"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search and Filters */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث عن سائق أو مركبة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">السائقين المتاحين فقط</span>
                <Button
                  variant={showAvailableOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  فلترة
                </Button>
              </div>
            </div>
          </Card>

          {/* Driver Cards */}
          {filteredDrivers.length === 0 ? (
            <Card className="p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500">جرّب تعديل معايير البحث</p>
            </Card>
          ) : (
            filteredDrivers.map((driver) => (
              <Card 
                key={driver.id} 
                className={`cursor-pointer hover:shadow-md transition-all ${selectedDriver?.id === driver.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleMarkerClick(driver)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{driver.name}</h3>
                        <Badge variant={driver.isAvailable ? "default" : "secondary"}>
                          {driver.isAvailable ? '🟢 متاح' : '🔴 مشغول'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{driver.rating} ({driver.totalTrips} رحلة)</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {driver.vehicleType}
                      </div>

                      {driver.currentTrip && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <div className="flex items-center gap-1 text-blue-700 mb-1">
                            <MapPin className="h-3 w-3" />
                            <span className="font-medium">رحلة حالية</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {driver.currentTrip.from} ← {driver.currentTrip.to}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {driver.currentTrip.availableSeats} مقعد متاح
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden h-[calc(100vh-200px)]">
            <MapboxMap
              center={mapCenter}
              zoom={mapZoom}
              markers={mapMarkers}
              showControls={true}
              className="w-full h-full"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DriversMapMapbox;