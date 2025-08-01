"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngExpression } from "leaflet";
import axios from "axios";
import { Button } from "@/components/ui/button";
import polyline from "@mapbox/polyline";
import {
  X,
  Navigation,
  Clock,
  Route,
  Loader2,
  Share2,
  Phone,
  Star,
} from "lucide-react";
import { mockSellers, Seller } from "@/lib/sellers";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

interface IconDefault extends L.Icon.Default {
  _getIconUrl?: () => string;
}

// Fix Leaflet icons
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Optimized route cache with expiration
class RouteCache {
  private cache = new Map<
    string,
    { data: [number, number][]; timestamp: number }
  >();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  set(key: string, data: [number, number][]) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): [number, number][] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

const routeCache = new RouteCache();

type MapSearchProps = {
  onSellerSelect?: (seller: Seller, routeCoords: [number, number][]) => void;
  filters: { brand: string; size: string };
};

// Map controller component for programmatic control
function MapController({
  userLocation,
  selectedSeller,
  sellers,
}: {
  userLocation: [number, number] | null;
  selectedSeller: Seller | null;
  sellers: Seller[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) return;

    if (selectedSeller) {
      // Fit bounds to show both user and selected seller
      const bounds = L.latLngBounds([
        userLocation,
        [selectedSeller.latitude, selectedSeller.longitude],
      ]);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
        duration: 0.8,
      });
    } else if (sellers.length > 0) {
      // Fit bounds to show all sellers
      const allPoints = [
        userLocation,
        ...sellers.map(s => [s.latitude, s.longitude] as [number, number]),
      ];
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 0.8,
      });
    } else {
      // Center on user location
      map.setView(userLocation, 14, { animate: true, duration: 0.8 });
    }
  }, [map, userLocation, selectedSeller, sellers]);

  return null;
}

export default function MapSearch({ filters, onSellerSelect }: MapSearchProps) {
  console.log(`filter search ${filters.brand} ${filters.size} `);

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    loading: locationLoading,
    location: userLocation,
    error,
    setState,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds
    maximumAge: 300000, // 5 minutes
  });

  // Memoized custom icons
  const icons = useMemo(
    () => ({
      user: L.divIcon({
        html: `
        <div class="relative">
          <div class="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
          <div class="absolute inset-0 w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        </div>
      `,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }) as unknown as L.Icon,

      seller: L.divIcon({
        html: `
        <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      `,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }) as unknown as L.Icon,

      selectedSeller: L.divIcon({
        html: `
        <div class="relative">
          <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
            <span class="text-xs">✓</span>
          </div>
        </div>
      `,
        className: "",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      }) as unknown as L.Icon,
    }),
    []
  );

  const deg2rad = useCallback((deg: number) => deg * (Math.PI / 180), []);

  // Optimized distance calculation
  const calculateDistance = useCallback(
    ([lat1, lon1]: number[], [lat2, lon2]: number[]): number => {
      const R = 6371;
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
          Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [deg2rad]
  );

  // Optimized route fetching with abort controller
  const fetchRoute = useCallback(
    async (origin: [number, number], destination: [number, number]) => {
      const cacheKey = `${origin[0]},${origin[1]}-${destination[0]},${destination[1]}`;

      // Check cache first
      const cached = routeCache.get(cacheKey);
      if (cached) {
        setRouteCoords(cached);
        if (onSellerSelect && selectedSeller) {
          onSellerSelect(selectedSeller, cached);
        }
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setRouteLoading(true);
      setState({ error: null });

      try {
        const res = await axios.post(
          "https://api.openrouteservice.org/v2/directions/driving-car",
          {
            coordinates: [
              [origin[1], origin[0]],
              [destination[1], destination[0]],
            ],
          },
          {
            headers: {
              Authorization: process.env.NEXT_PUBLIC_OPENROUTESERVICE_KEY!,
              "Content-Type": "application/json",
            },
            signal: abortControllerRef.current.signal,
            timeout: 10000, // 10 second timeout
          }
        );

        if (!res.data?.routes?.length) {
          throw new Error("No route available");
        }

        const { geometry, summary } = res.data.routes[0];
        const decoded = polyline.decode(geometry) as [number, number][];

        // Cache the result
        routeCache.set(cacheKey, decoded);

        setRouteCoords(decoded);
        setRouteInfo({
          distance: summary.distance,
          duration: summary.duration,
        });

        if (onSellerSelect && selectedSeller) {
          onSellerSelect(selectedSeller, decoded);
        }
      } catch (err) {
        if (axios.isCancel(err)) return; // Ignore cancelled requests

        console.error("Route fetch error:", err);
        setState({ error: "Failed to load route. Please try again." });

        setRouteCoords([]);
        setRouteInfo(null);
      } finally {
        setRouteLoading(false);
      }
    },
    [onSellerSelect, selectedSeller, setState]
  );

  // Filter and sort sellers with memoization
  const filteredAndSortedSellers = useMemo(() => {
    if (!userLocation) return [];

    const filtered = mockSellers.filter(
      seller =>
        seller.brand.toLowerCase().includes(filters.brand.toLowerCase()) &&
        seller.size.toLowerCase().includes(filters.size.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const distA = calculateDistance(userLocation, [a.latitude, a.longitude]);
      const distB = calculateDistance(userLocation, [b.latitude, b.longitude]);
      return distA - distB;
    });
  }, [filters, userLocation, calculateDistance]);

  // Handle seller click with debouncing
  const handleSellerClick = useCallback(
    (seller: Seller) => {
      if (selectedSeller?.id === seller.id) return; // Prevent duplicate clicks

      setSelectedSeller(seller);
      if (userLocation) {
        fetchRoute(userLocation, [seller.latitude, seller.longitude]);
      }
    },
    [selectedSeller, userLocation, fetchRoute]
  );

  // Clear route and selection
  const clearRoute = useCallback(() => {
    setRouteCoords([]);
    setRouteInfo(null);
    setSelectedSeller(null);
    setRouteLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Initial load effect

  // Update sellers when query or location changes
  useEffect(() => {
    setSellers(filteredAndSortedSellers);
    setLoading(false);
  }, [filteredAndSortedSellers]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Render loading state
  if (loading || locationLoading || !userLocation) {
    return (
      <div className='h-full bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='relative'>
            <Loader2 className='h-12 w-12 animate-spin text-orange-500 mx-auto' />
            <div className='absolute inset-0 h-12 w-12 border-4 border-orange-200 rounded-full animate-pulse'></div>
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-700 mb-1'>
              {locationLoading ? "Getting your location..." : "Loading map..."}
            </h3>
            <p className='text-sm text-gray-500'>
              {locationLoading
                ? "Please allow location access for better results"
                : "Preparing your gas delivery map"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render no sellers found
  if (!loading && sellers.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-orange-50 text-center px-6'>
        <div className='bg-white rounded-3xl p-8 shadow-lg max-w-sm'>
          <div className='text-6xl mb-4'>🔍</div>
          <h3 className='text-xl font-semibold text-gray-800 mb-2'>
            No Sellers Found
          </h3>
          <p className='text-sm text-gray-600 mb-4 leading-relaxed'>
            We couldn&apos;t find any{" "}
            <span className='font-semibold text-orange-600'>
              {filters.size} {filters.brand}
            </span>{" "}
            gas bottles in your area right now.
          </p>
        </div>
      </div>
    );
  }

  // map buttons

  function ZoomControls() {
    const map = useMap();

    return (
      <div className='absolute bottom-20 right-4  z-[999] flex flex-col gap-2'>
        <button
          onClick={e => {
            e.preventDefault();
            map.zoomIn();
          }}
          className='p-3 bg-white cursor-pointer shadow-lg rounded-full hover:shadow-xl transition-all duration-200 border border-gray-100'
          aria-label='Zoom in'
        >
          <span className='text-lg font-bold text-gray-600'>+</span>
        </button>
        <button
          onClick={e => {
            e.preventDefault();
            map.zoomOut();
          }}
          className='p-3 bg-white shadow-lg cursor-pointer rounded-full hover:shadow-xl transition-all duration-200 border border-gray-100'
          aria-label='Zoom out'
        >
          <span className='text-lg font-bold text-gray-600'>−</span>
        </button>
      </div>
    );
  }
  function RecenterButton() {
    const map = useMap();
    return (
      <button
        onClick={() =>
          map.setView(userLocation as LatLngExpression, 14, { animate: true })
        }
        className='absolute bottom-20 left-4 z-[999] cursor-pointer p-3 bg-white shadow-lg rounded-full hover:shadow-xl transition-all duration-200 border border-gray-100'
        aria-label='Recenter on your location'
      >
        <Navigation className='h-5 w-5 text-blue-600' />
      </button>
    );
  }

  // Main map render
  return (
    <div className='relative h-full'>
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        className='z-10'
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Map controller for automatic bounds adjustment */}
        <MapController
          userLocation={userLocation}
          selectedSeller={selectedSeller}
          sellers={sellers}
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={icons.user}>
            <Popup>
              <div className='text-center p-2'>
                <div className='text-blue-600 mb-2'>📍</div>
                <p className='font-semibold text-gray-800'>Your Location</p>
                <p className='text-xs text-gray-600'>
                  We&apos;ll deliver gas here
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Seller markers */}
        {sellers.map(seller => {
          const isSelected = selectedSeller?.id === seller.id;
          const distance = userLocation
            ? calculateDistance(userLocation, [
                seller.latitude,
                seller.longitude,
              ]).toFixed(1)
            : "0";

          return (
            <Marker
              key={seller.id}
              position={[seller.latitude, seller.longitude]}
              icon={isSelected ? icons.selectedSeller : icons.seller}
              eventHandlers={{
                click: () => handleSellerClick(seller),
              }}
            >
              <Popup className='font-sans' maxWidth={300}>
                <div className='p-3 space-y-3'>
                  {/* Header */}
                  <div className='text-center border-b border-gray-100 pb-3'>
                    <h3 className='font-bold text-gray-800 mb-1'>
                      {seller.shopName}
                    </h3>
                    <div className='flex items-center justify-center gap-2 text-sm'>
                      <span className='bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium'>
                        {seller.brand}
                      </span>
                      <span className='font-bold text-green-600'>
                        {seller.price} XAF
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='text-center'>
                      <div className='text-blue-600 font-semibold'>
                        📍 {distance} km
                      </div>
                      <div className='text-gray-500'>Distance</div>
                    </div>
                    <div className='text-center'>
                      <div className='flex items-center justify-center gap-1'>
                        <Star className='h-3 w-3 text-yellow-500 fill-yellow-500' />
                        <span className='font-semibold'>{seller.rating}</span>
                      </div>
                      <div className='text-gray-500'>
                        ({seller.reviewCount})
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className='grid grid-cols-3 gap-2'>
                    <Button
                      asChild
                      size='sm'
                      className='bg-green-500 hover:bg-green-600 text-white h-9'
                    >
                      <a href={`tel:${seller.phone}`}>
                        <Phone className='h-4 w-4' />
                      </a>
                    </Button>

                    <Button
                      size='sm'
                      className='bg-blue-500 hover:bg-blue-600 text-white h-9'
                      onClick={() => {
                        const isIOS = /iPad|iPhone|iPod/.test(
                          navigator.userAgent
                        );
                        const origin = `${userLocation![0]},${
                          userLocation![1]
                        }`;
                        const dest = `${seller.latitude},${seller.longitude}`;
                        const url = isIOS
                          ? `https://maps.apple.com/?saddr=${origin}&daddr=${dest}&dirflg=d`
                          : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
                        window.open(url, "_blank");
                      }}
                    >
                      <Navigation className='h-4 w-4' />
                    </Button>

                    <Button
                      asChild
                      size='sm'
                      className='bg-emerald-500 hover:bg-emerald-600 text-white h-9'
                    >
                      <a
                        href={`https://wa.me/?text=Gas%20at%20${encodeURIComponent(
                          seller.shopName
                        )}%20-%20${
                          seller.price
                        }XAF%20(${distance}km%20away)%0A${encodeURIComponent(
                          `https://www.google.com/maps/dir/?api=1&origin=${
                            userLocation![0]
                          },${userLocation![1]}&destination=${
                            seller.latitude
                          },${seller.longitude}`
                        )}`}
                        target='_blank'
                      >
                        <Share2 className='h-4 w-4' />
                      </a>
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            color='#3b82f6'
            weight={4}
            opacity={0.8}
            dashArray='10, 5'
            className='animate-pulse'
          />
        )}

        <ZoomControls />
        <RecenterButton />
      </MapContainer>

      {/* Floating UI Elements */}

      {/* Error notification */}
      {error && toast.error(error)}

      {/* Route info card */}
      {routeInfo && !routeLoading && (
        <div className='absolute top-1/4 md:top-4 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 backdrop-blur-sm shadow-lg px-4 py-3 rounded-xl border border-gray-100'>
          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-1 text-blue-600'>
              <Route className='h-4 w-4' />
              <span className='font-semibold'>
                {(routeInfo.distance / 1000).toFixed(1)} km
              </span>
            </div>
            <div className='flex items-center gap-1 text-green-600'>
              <Clock className='h-4 w-4' />
              <span className='font-semibold'>
                {Math.round(routeInfo.duration / 60)} min
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Route loading indicator */}
      {routeLoading && (
        <div className='absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 backdrop-blur-sm shadow-lg px-4 py-3 rounded-xl border border-gray-100'>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>Calculating route...</span>
          </div>
        </div>
      )}

      {/* Clear route button */}
      {(routeCoords.length > 0 || selectedSeller) && (
        <button
          onClick={clearRoute}
          className='absolute top-1/4 md:top-4 right-4 z-40 p-3 bg-white shadow-lg rounded-full hover:shadow-xl transition-all duration-200 border border-gray-100'
          aria-label='Clear route and selection'
        >
          <X className='h-5 w-5 text-gray-600' />
        </button>
      )}
    </div>
  );
}
