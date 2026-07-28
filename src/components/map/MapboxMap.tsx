import { useState, useEffect, useRef, useMemo } from 'react';
import mapboxgl, { Map, Marker, Popup, LngLatLike, LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MARKER_ICONS, MAPBOX_CONFIG, DEFAULT_MAP_OPTIONS } from '@/config/mapbox';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

interface MapboxMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    icon?: keyof typeof MARKER_ICONS;
    title?: string;
    onClick?: () => void;
    popupContent?: React.ReactNode;
  }>;
  routes?: Array<{
    id: string;
    coordinates: Array<[number, number]>; // [lng, lat]
    color?: string;
    width?: number;
  }>;
  onMapLoad?: (map: Map) => void;
  className?: string;
  style?: React.CSSProperties;
  showControls?: boolean;
}

const MapboxMap = ({
  center = { lat: 28.0339, lng: 1.6596 },
  zoom = 6,
  markers = [],
  routes = [],
  onMapLoad,
  className = '',
  style = {},
  showControls = true,
}: MapboxMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);
  const routeIdsRef = useRef<string[]>([]);
  const previousRoutesRef = useRef<string>('');
  const routesRef = useRef<typeof routes>([]);
  const zoomCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
    }

    // Create new map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_CONFIG.style,
      center: [center.lng, center.lat] as LngLatLike,
      zoom: zoom,
    });

    // Add custom arrow icon when map loads
    map.on('load', () => {
      // Create arrow SVG as image
      const canvas = document.createElement('canvas');
      canvas.width = 30;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#3b82f6'; // Blue color matching route
        ctx.beginPath();
        // Draw arrow pointing upward (will be rotated by bearing)
        // Arrow tip at top (y=0), base at bottom (y=30)
        ctx.moveTo(15, 0); // Top point (tip of arrow)
        ctx.lineTo(5, 20); // Bottom left
        ctx.lineTo(12, 20); // Bottom left inner
        ctx.lineTo(12, 30); // Bottom left outer
        ctx.lineTo(18, 30); // Bottom right outer
        ctx.lineTo(18, 20); // Bottom right inner
        ctx.lineTo(25, 20); // Bottom right
        ctx.closePath();
        ctx.fill();
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            map.loadImage(url, (error, image) => {
              if (!error && image) {
                if (!map.hasImage('route-arrow')) {
                  map.addImage('route-arrow', image);
                }
              }
            });
          }
        });
      }
    });

    // Add language support for Arabic
    if (MAPBOX_CONFIG.language === 'ar') {
      map.on('load', () => {
        // Get all layers and set Arabic labels
        const style = map.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer: any) => {
            // Only modify text layers
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
              try {
                // Set text field to use Arabic names with fallback
                map.setLayoutProperty(layer.id, 'text-field', [
                  'coalesce',
                  ['get', 'name_ar'],
                  ['get', 'name:ar'], 
                  ['get', 'name'],
                ]);
              } catch (error) {
                // Some layers might not support this, silently continue
              }
            }
          });
        }
      });
    }

    // Add controls
    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    }

    // Set map reference
    mapRef.current = map;

    // Store routes to re-add them after style changes
    routesRef.current = routes;
    
    // Listen for style changes to re-add routes
    map.on('style.load', () => {
      // Re-add routes after style loads - immediate check
      if (routesRef.current.length > 0 && map.isStyleLoaded()) {
        // Wait a bit for style to fully load, then ensure routes exist
        setTimeout(() => {
          routesRef.current.forEach((route) => {
            const sourceId = `route-source-${route.id}`;
            const layerId = `route-layer-${route.id}`;
            
            // Re-add route if it was removed
            if (!map.getLayer(layerId)) {
              // Check if source exists
              if (!map.getSource(sourceId)) {
                // Source was removed, need to re-add everything
                try {
                  map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                      type: 'Feature',
                      geometry: {
                        type: 'LineString',
                        coordinates: route.coordinates,
                      },
                      properties: {},
                    },
                  });
                } catch (error) {
                  return;
                }
              }
              
              // Re-add layer
              if (map.getSource(sourceId)) {
                try {
                  const style = map.getStyle();
                  let beforeLayerId: string | undefined = undefined;
                  
                  if (style && style.layers) {
                    const labelLayer = style.layers.find((layer: any) => 
                      layer.type === 'symbol' && 
                      layer.id && 
                      !layer.id.startsWith('route-')
                    );
                    if (labelLayer) {
                      beforeLayerId = labelLayer.id;
                    }
                  }
                  
                  map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round',
                    },
                    paint: {
                      'line-color': route.color || '#3b82f6',
                      'line-width': route.width || 6,
                      'line-opacity': 0.9,
                    },
                  }, beforeLayerId);
                } catch (error) {
                }
              }
            }
          });
        }, 100);
      }
    });

    // Helper function to re-add route if missing
    const ensureRouteExists = (route: typeof routes[0]) => {
      const sourceId = `route-source-${route.id}`;
      const layerId = `route-layer-${route.id}`;
      
      // Re-add route if it was removed
      if (!map.getLayer(layerId)) {
        // Check if source exists
        if (!map.getSource(sourceId)) {
          // Source was removed, need to re-add everything
          try {
            map.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: route.coordinates,
                },
                properties: {},
              },
            });
          } catch (error) {
            return;
          }
        }
        
        // Re-add layer
        if (map.getSource(sourceId)) {
          try {
            const style = map.getStyle();
            let beforeLayerId: string | undefined = undefined;
            
            if (style && style.layers) {
              const labelLayer = style.layers.find((layer: any) => 
                layer.type === 'symbol' && 
                layer.id && 
                !layer.id.startsWith('route-')
              );
              if (labelLayer) {
                beforeLayerId = labelLayer.id;
              }
            }
            
            map.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': route.color || '#3b82f6',
                'line-width': route.width || 6,
                'line-opacity': 0.9,
              },
            }, beforeLayerId);
          } catch (error) {
          }
        }
      }
    };

    // Listen for zoom/pan to ensure routes stay visible
    map.on('zoomend', () => {
      // Ensure routes are still visible after zoom - immediate check
      if (routesRef.current.length > 0 && map.isStyleLoaded()) {
        routesRef.current.forEach(ensureRouteExists);
      }
    });

    // Also listen during zoom to catch immediate disappearance
    const zoomHandler = () => {
      // Clear previous timeout
      if (zoomCheckTimeoutRef.current) {
        clearTimeout(zoomCheckTimeoutRef.current);
      }
      
      // Check after a short delay during zoom
      zoomCheckTimeoutRef.current = setTimeout(() => {
        if (routesRef.current.length > 0 && map.isStyleLoaded()) {
          routesRef.current.forEach(ensureRouteExists);
        }
      }, 100);
    };
    map.on('zoom', zoomHandler);

    // Also listen for moveend to ensure routes stay visible after panning
    map.on('moveend', () => {
      // Ensure routes are still visible after panning - immediate check
      if (routesRef.current.length > 0 && map.isStyleLoaded()) {
        routesRef.current.forEach(ensureRouteExists);
      }
    });

    // Listen for idle events to ensure routes stay visible (throttled)
    let lastCheckTime = 0;
    map.on('idle', () => {
      // Throttle checks to once per 500ms
      const now = Date.now();
      if (now - lastCheckTime < 500) {
        return;
      }
      lastCheckTime = now;
      
      // Check routes when map is idle
      if (routesRef.current.length > 0 && map.isStyleLoaded()) {
        routesRef.current.forEach(ensureRouteExists);
      }
    });

    // Call onMapLoad callback
    map.on('load', () => {
      if (onMapLoad) {
        onMapLoad(map);
      }
    });

    // Clean up on unmount
    return () => {
      // Clear zoom timeout if it exists
      if (zoomCheckTimeoutRef.current) {
        clearTimeout(zoomCheckTimeoutRef.current);
        zoomCheckTimeoutRef.current = null;
      }
      
      // Remove event listeners
      map.off('zoom', zoomHandler);
      
      if (mapRef.current) {
        mapRef.current.remove();
      }
      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const el = document.createElement('div');
      el.className = 'marker';
      
      // Set marker style based on icon type
      const iconConfig = MARKER_ICONS[markerData.icon || 'driver'];
      el.style.backgroundColor = iconConfig.color;
      el.style.width = iconConfig.size === 'small' ? '20px' : iconConfig.size === 'large' ? '40px' : '30px';
      el.style.height = iconConfig.size === 'small' ? '20px' : iconConfig.size === 'large' ? '40px' : '30px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 0 2px ' + iconConfig.color;
      el.style.cursor = 'pointer';

      const marker = new Marker({ element: el })
        .setLngLat([markerData.position.lng, markerData.position.lat] as LngLatLike)
        .addTo(mapRef.current!);

      // Add click handler
      if (markerData.onClick) {
        el.addEventListener('click', markerData.onClick);
      }

      // Add popup if content provided
      if (markerData.popupContent) {
        el.addEventListener('click', () => {
          if (popupRef.current) {
            popupRef.current.remove();
          }
          
          const popup = new Popup({ offset: 25 })
            .setLngLat([markerData.position.lng, markerData.position.lat] as LngLatLike)
            .setHTML(`<div id="popup-${markerData.id}"></div>`)
            .addTo(mapRef.current!);
          
          popupRef.current = popup;
          
          // Render popup content
          const popupElement = document.getElementById(`popup-${markerData.id}`);
          if (popupElement) {
            const tempDiv = document.createElement('div');
            const content = markerData.popupContent as React.ReactNode;
            // Simple way to render content - in a real app you'd use ReactDOM.createPortal
            if (typeof content === 'string') {
              popupElement.innerHTML = content;
            } else {
              popupElement.innerHTML = '<div>Driver Information</div>';
            }
          }
        });
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = new LngLatBounds();
      markers.forEach(marker => {
        bounds.extend([marker.position.lng, marker.position.lat] as LngLatLike);
      });
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [markers]);

  // Update routes (polylines)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Serialize routes to compare with previous
    const routesString = JSON.stringify(routes);
    // Skip if routes haven't changed
    if (routesString === previousRoutesRef.current) {
      return;
    }
    
    previousRoutesRef.current = routesString;
    routesRef.current = routes; // Update routes ref
    const addRoutes = () => {
      // Check if map is still available and style is loaded
      if (!map.isStyleLoaded()) {
        return;
      }

      // Get current route IDs
      const currentRouteIds = routes.map(r => r.id);
      
      // Cleanup only routes that are no longer in the new routes list
    routeIdsRef.current.forEach((rid) => {
        if (!currentRouteIds.includes(rid)) {
          // This route is no longer needed, remove it
      const layerId = `route-layer-${rid}`;
      const sourceId = `route-source-${rid}`;
          const arrowLayerId = `route-arrow-${rid}`;
          const arrowSourceId = `route-arrow-source-${rid}`;
          try {
            if (map.getLayer(arrowLayerId)) map.removeLayer(arrowLayerId);
            if (map.getSource(arrowSourceId)) map.removeSource(arrowSourceId);
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId);
            }
          } catch (error) {
            // Layer or source might not exist, ignore
          }
        }
      });
      
      // Update routeIdsRef: keep existing routes that are still in current routes, add new ones
      routeIdsRef.current = [
        ...routeIdsRef.current.filter(id => currentRouteIds.includes(id)),
        ...currentRouteIds.filter(id => !routeIdsRef.current.includes(id))
      ];

    if (!Array.isArray(routes) || routes.length === 0) return;

    routes.forEach((route) => {
      const sourceId = `route-source-${route.id}`;
      const layerId = `route-layer-${route.id}`;

        // Skip if route already exists
        if (map.getLayer(layerId) && map.getSource(sourceId)) {
          // Ensure it's in routeIdsRef
          if (!routeIdsRef.current.includes(route.id)) {
            routeIdsRef.current.push(route.id);
          }
          return;
        }

        try {
      // Add GeoJSON source
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates,
          },
          properties: {},
        },
      });
          // Add line layer - place it above roads but below labels
          // Find the first label layer to place route below it
          const style = map.getStyle();
          let beforeLayerId: string | undefined = undefined;
          
          if (style && style.layers) {
            // Find the first symbol layer (labels) to place route before it
            const labelLayer = style.layers.find((layer: any) => 
              layer.type === 'symbol' && 
              layer.id && 
              !layer.id.startsWith('route-')
            );
            if (labelLayer) {
              beforeLayerId = labelLayer.id;
            }
          }

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
              'line-color': route.color || '#3b82f6',
              'line-width': route.width || 6,
              'line-opacity': 0.9,
            },
          }, beforeLayerId);
          // Add arrow layer to show direction
          const arrowLayerId = `route-arrow-${route.id}`;
          
          // Create arrow source with points along the route
          const arrowSourceId = `route-arrow-source-${route.id}`;
          const arrowCoordinates: Array<[number, number]> = [];
          
          // Add arrows at regular intervals (every 10% of the route)
          if (route.coordinates.length > 1) {
            const step = Math.max(1, Math.floor(route.coordinates.length / 10));
            for (let i = step; i < route.coordinates.length - step; i += step) {
              arrowCoordinates.push(route.coordinates[i]);
            }
            // Always add arrow near the end
            if (route.coordinates.length > 2) {
              arrowCoordinates.push(route.coordinates[route.coordinates.length - 2]);
            }
          }

          if (arrowCoordinates.length > 0) {
            map.addSource(arrowSourceId, {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: arrowCoordinates.map((coord, index) => {
                  // Calculate bearing for arrow direction
                  let bearing = 0;
                  if (index < arrowCoordinates.length - 1) {
                    const nextCoord = arrowCoordinates[index + 1];
                    const lat1 = coord[1] * Math.PI / 180;
                    const lat2 = nextCoord[1] * Math.PI / 180;
                    const dLon = (nextCoord[0] - coord[0]) * Math.PI / 180;
                    const y = Math.sin(dLon) * Math.cos(lat2);
                    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
                    bearing = Math.atan2(y, x) * 180 / Math.PI;
                  } else if (index > 0) {
                    const prevCoord = arrowCoordinates[index - 1];
                    const lat1 = prevCoord[1] * Math.PI / 180;
                    const lat2 = coord[1] * Math.PI / 180;
                    const dLon = (coord[0] - prevCoord[0]) * Math.PI / 180;
                    const y = Math.sin(dLon) * Math.cos(lat2);
                    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
                    bearing = Math.atan2(y, x) * 180 / Math.PI;
                  }
                  
                  return {
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: coord,
                    },
                    properties: {
                      bearing: bearing,
                    },
                  };
                }),
        },
      });

            // Add arrow symbol layer - wait for image to be loaded
            const addArrowLayer = () => {
              if (map.hasImage('route-arrow')) {
                map.addLayer({
                  id: arrowLayerId,
                  type: 'symbol',
                  source: arrowSourceId,
                  layout: {
                    'icon-image': 'route-arrow',
                    'icon-size': 0.6,
                    'icon-rotate': ['get', 'bearing'],
                    'icon-rotation-alignment': 'map',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                  },
                });
              } else {
                // Wait for image to load
                setTimeout(addArrowLayer, 100);
              }
            };
            addArrowLayer();
          }

      routeIdsRef.current.push(route.id);
        } catch (error) {
        }
      });
    };

    // Check if map is loaded and style is loaded
    if (map.isStyleLoaded()) {
      addRoutes();
    } else {
      // Wait for map to load
      const handleLoad = () => {
        addRoutes();
      };
      map.once('load', handleLoad);
      
      // Cleanup function
      return () => {
        map.off('load', handleLoad);
      };
    }
  }, [routes]);

  // Update center and zoom
  useEffect(() => {
    if (!mapRef.current) return;
    
    mapRef.current.setCenter([center.lng, center.lat] as LngLatLike);
    mapRef.current.setZoom(zoom);
  }, [center, zoom]);

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full h-full ${className}`}
      style={style}
    />
  );
};

export default MapboxMap;