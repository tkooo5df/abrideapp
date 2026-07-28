import React, { useEffect, useState } from "react";
import MapboxMap from "@/components/map/MapboxMap";
import { MAPBOX_CONFIG, MARKER_ICONS, GHARDAIA_CENTER } from "@/config/mapbox";

interface LatLng {
  lat: number;
  lng: number;
}

interface WilayaInfo {
  id: number;
  name: string;
}

interface PassengerMapActiveBookingMapboxProps {
  driverPos: LatLng | null;
  pickup: LatLng | null;
  destination: LatLng | null;
  fromWilaya: WilayaInfo | null;
  toWilaya: WilayaInfo | null;
  showDriverRoute?: boolean;
}

export default function PassengerMapActiveBookingMapbox({
  driverPos,
  pickup,
  destination,
  fromWilaya,
  toWilaya,
  showDriverRoute = false
}: PassengerMapActiveBookingMapboxProps) {
  const [mapCenter, setMapCenter] = useState(GHARDAIA_CENTER);
  const [mapZoom, setMapZoom] = useState(12);

  // Update map center when driver position changes
  useEffect(() => {
    if (driverPos) {
      setMapCenter({ lat: driverPos.lat, lng: driverPos.lng });
      setMapZoom(15);
    } else if (pickup) {
      setMapCenter({ lat: pickup.lat, lng: pickup.lng });
      setMapZoom(14);
    }
  }, [driverPos, pickup]);

  // Prepare markers for MapboxMap component
  const mapMarkers = [];
  
  // Add driver position marker
  if (driverPos) {
    mapMarkers.push({
      id: 'driver',
      position: { lat: driverPos.lat, lng: driverPos.lng },
      icon: 'driver' as keyof typeof MARKER_ICONS,
      title: 'Driver Location',
      onClick: () => {},
      popupContent: `
        <div class="p-2 text-center">
          <h3 class="font-semibold">Driver Location</h3>
          <p class="text-sm">${driverPos.lat.toFixed(6)}, ${driverPos.lng.toFixed(6)}</p>
        </div>
      `
    });
  }

  // Add pickup location marker
  if (pickup) {
    mapMarkers.push({
      id: 'pickup',
      position: pickup,
      icon: 'pickup' as keyof typeof MARKER_ICONS,
      title: 'Pickup Location',
      onClick: () => {},
      popupContent: `
        <div class="p-2 text-center">
          <h3 class="font-semibold">Pickup Location</h3>
          ${fromWilaya?.name ? `<p class="text-sm">Wilaya: ${fromWilaya.name}</p>` : ''}
        </div>
      `
    });
  }

  // Add destination marker
  if (destination) {
    mapMarkers.push({
      id: 'destination',
      position: destination,
      icon: 'destination' as keyof typeof MARKER_ICONS,
      title: 'Destination',
      onClick: () => {},
      popupContent: `
        <div class="p-2 text-center">
          <h3 class="font-semibold">Destination</h3>
          ${toWilaya?.name ? `<p class="text-sm">Wilaya: ${toWilaya.name}</p>` : ''}
        </div>
      `
    });
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden">
      <MapboxMap
        center={mapCenter}
        zoom={mapZoom}
        markers={mapMarkers}
        showControls={true}
        className="w-full h-full"
      />
    </div>
  );
}