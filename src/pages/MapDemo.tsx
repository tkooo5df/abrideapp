import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DriverMapMapbox from "@/components/driver/DriverMapMapbox";
import PassengerMapMapbox from "@/components/passenger/PassengerMapMapbox";
import { Map, Navigation, Users, Car } from "lucide-react";

export default function MapDemo() {
  const [activeTab, setActiveTab] = useState("driver");
  const [demoBookingId] = useState(1); // Demo booking ID

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Map className="h-10 w-10 text-blue-600" />
          Mapbox Integration
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Real-time interactive maps for drivers and passengers using Mapbox GL JS.
          Powered by your Mapbox token for advanced mapping features!
        </p>
        
        {/* Features */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Badge variant="outline" className="flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            Live GPS Tracking
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Car className="h-3 w-3" />
            Real-time Driver Location
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Passenger Pickup Points
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Map className="h-3 w-3" />
            Route Navigation
          </Badge>
        </div>
      </div>

      {/* Map Components */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="driver" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Driver Map
          </TabsTrigger>
          <TabsTrigger value="passenger" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Passenger Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="driver" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Driver Map System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-green-600">✅ Features</h3>
                    <ul className="space-y-1 text-gray-600">
                      <li>• GPS location tracking</li>
                      <li>• Nearby passenger markers</li>
                      <li>• Route navigation to pickup</li>
                      <li>• Real-time location broadcast</li>
                      <li>• Auto-update every 5 seconds</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-600">🗺️ Map Features</h3>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Mapbox GL JS rendering</li>
                      <li>• Custom driver/passenger icons</li>
                      <li>• Interactive markers & popups</li>
                      <li>• Responsive design</li>
                      <li>• RTL language support</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-purple-600">⚡ Real-time</h3>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Supabase Realtime channels</li>
                      <li>• Live driver position updates</li>
                      <li>• Passenger booking notifications</li>
                      <li>• Automatic map centering</li>
                      <li>• Offline-capable</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <DriverMapMapbox />
        </TabsContent>

        <TabsContent value="passenger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Passenger Map System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-green-600">✅ Features</h3>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Live driver tracking</li>
                      <li>• Pickup & destination markers</li>
                      <li>• Distance & ETA calculation</li>
                      <li>• Driver information display</li>
                      <li>• Trip status updates</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-600">🗺️ Map Features</h3>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Real-time driver position</li>
                      <li>• Trip route visualization</li>
                      <li>• Auto-center on driver</li>
                      <li>• Speed & accuracy display</li>
                      <li>• Custom styling</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-purple-600">📊 Information</h3>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Driver name & phone</li>
                      <li>• Trip distance & ETA</li>
                      <li>• Driver speed tracking</li>
                      <li>• Connection status</li>
                      <li>• Booking details</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <PassengerMapMapbox bookingId={demoBookingId} />
        </TabsContent>
      </Tabs>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Frontend Technologies</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>React + TypeScript</span>
                  <Badge variant="outline">UI Framework</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Mapbox GL JS</span>
                  <Badge variant="outline">Map Components</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tailwind CSS</span>
                  <Badge variant="outline">Styling</Badge>
                </div>
                <div className="flex justify-between">
                  <span>shadcn/ui</span>
                  <Badge variant="outline">Components</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Backend & Database</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Supabase</span>
                  <Badge variant="outline">Database & Realtime</Badge>
                </div>
                <div className="flex justify-between">
                  <span>driver_locations table</span>
                  <Badge variant="outline">Location Storage</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Realtime Channels</span>
                  <Badge variant="outline">Live Updates</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Row Level Security</span>
                  <Badge variant="outline">Data Protection</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Mapbox API</span>
                  <Badge variant="outline">Map Tiles</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">For Drivers:</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li>1. Click "Start Tracking" to enable GPS</li>
                  <li>2. Allow location permissions in browser</li>
                  <li>3. View nearby passenger pickup points</li>
                  <li>4. Select a passenger to see route navigation</li>
                  <li>5. Location updates automatically every 5 seconds</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold mb-2">For Passengers:</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li>1. View assigned driver's live location</li>
                  <li>2. See pickup and destination markers</li>
                  <li>3. Track distance and estimated arrival time</li>
                  <li>4. Monitor driver speed and connection status</li>
                  <li>5. Map auto-centers on driver movement</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}