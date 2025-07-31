"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { Button } from "@/components/ui/button";
import polyline from "@mapbox/polyline";
import { X } from "lucide-react";
import { mockSellers, Seller } from "@/lib/sellers";

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

// Route cache
const routeCache = new Map<string, [number, number][]>();

type MapSearchProps = {
  query: string;
  onSellerSelect?: (seller: Seller, routeCoords: [number, number][]) => void;
  onTry6kg?: () => void;
};

export default function MapSearch({
  query,
  onSellerSelect,
  onTry6kg,
}: MapSearchProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);

  // Custom Icons
  const userIcon = L.divIcon({
    html: `
      <div class="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow flex items-center justify-center">
        <div class="w-3 h-3 bg-white rounded-full"></div>
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }) as unknown as L.Icon;

  const sellerIcon = L.divIcon({
    html: `
      <div class="w-8 h-8 bg-orange-500 rounded-full border-2 border-white shadow flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }) as unknown as L.Icon;

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  // Fetch route
  const fetchRoute = async (
    origin: [number, number],
    destination: [number, number]
  ) => {
    const cacheKey = `${origin[0]},${origin[1]}-${destination[0]},${destination[1]}`;
    if (routeCache.has(cacheKey)) {
      const cached = routeCache.get(cacheKey)!;
      setRouteCoords(cached);
      if (onSellerSelect && selectedSeller)
        onSellerSelect(selectedSeller, cached);
      return;
    }

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
        }
      );

      if (!res.data?.routes?.length) {
        setError("No route available between these points");
        setRouteCoords([]);
        setRouteInfo(null);
        return;
      }

      const { geometry, summary } = res.data.routes[0];
      const decoded = polyline.decode(geometry) as [number, number][];
      const coords = decoded;

      routeCache.set(cacheKey, coords);
      setRouteCoords(coords);
      setRouteInfo({
        distance: summary.distance, // meters
        duration: summary.duration, // seconds
      });

      if (onSellerSelect && selectedSeller) {
        onSellerSelect(selectedSeller, coords);
      }
      setError(null);
    } catch (err) {
      console.error("OpenRouteService error:", err);
      setError("Failed to load route");
      setRouteCoords([]);
      setRouteInfo(null);
    }
  };

  // Effect: Load user location and sellers
  useEffect(() => {
    setError(null);
    setLoading(true);
    setRouteCoords([]);
    setRouteInfo(null);
    setSellers([]);

    // Distance calculation
    const calculateDistance = (
      [lat1, lon1]: number[],
      [lat2, lon2]: number[]
    ): number => {
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
    };

    // Filter and sort sellers
    const filterAndSortSellers = (userPos: [number, number]) => {
      const filtered = mockSellers.filter(s =>
        s.bottleType.toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length === 0) {
        setSellers([]);
      } else {
        const sorted = filtered.sort((a, b) => {
          const distA = calculateDistance(userPos, [a.latitude, a.longitude]);
          const distB = calculateDistance(userPos, [b.latitude, b.longitude]);
          return distA - distB;
        });
        setSellers(sorted);
      }
      setLoading(false);
    };

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      const fallback: [number, number] = [3.848, 11.502];
      setUserLocation(fallback);
      filterAndSortSellers(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const loc: [number, number] = [latitude, longitude];
        setUserLocation(loc);
        filterAndSortSellers(loc);
      },
      err => {
        console.warn("Geolocation error:", err);
        const fallback: [number, number] = [3.848, 11.502];
        setUserLocation(fallback);
        filterAndSortSellers(fallback);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [query]);

  // Handle seller click
  const handleSellerClick = (seller: Seller) => {
    setSelectedSeller(seller);
    if (userLocation) {
      fetchRoute(userLocation, [seller.latitude, seller.longitude]);
    }
  };

  // Render: Loading
  if (loading && !userLocation) {
    return <div className='h-full bg-gray-100 animate-pulse'></div>;
  }

  // Render: No sellers found
  if (!loading && sellers.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-full bg-gray-50 text-center px-6'>
        <span className='text-6xl mb-4'>🔴</span>
        <h3 className='text-lg font-medium text-gray-700'>No Sellers Found</h3>
        <p className='text-sm text-gray-500 mt-1'>
          We couldn&apos;t find any <strong>{query}</strong> gas bottles nearby.
        </p>
        <Button
          variant='outline'
          className='mt-4 text-orange-600 border-orange-600 hover:bg-orange-50 text-sm'
          onClick={onTry6kg}
        >
          Show 6kg Bottles
        </Button>
      </div>
    );
  }

  const calculateDistance = (
    [lat1, lon1]: number[],
    [lat2, lon2]: number[]
  ): number => {
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
  };

  // Main Map Render
  return (
    <MapContainer
      center={userLocation || [3.848, 11.502]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      className='z-10'
    >
      <TileLayer
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Error Message */}
      {error && (
        <div className='absolute top-4 left-4 z-50 bg-yellow-100 text-yellow-800 p-2 rounded text-sm max-w-xs'>
          {error}
        </div>
      )}

      {/* Route Info */}
      {routeInfo && (
        <div className='absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white shadow-md px-4 py-2 rounded-lg text-center max-w-xs'>
          <p className='text-sm font-medium text-gray-800'>
            🚗 {Math.round(routeInfo.distance / 100) / 10} km ·{" "}
            {Math.round(routeInfo.duration / 60)} min
          </p>
        </div>
      )}

      {/* Clear Route Button */}
      {routeCoords.length > 0 && (
        <button
          onClick={() => {
            setRouteCoords([]);
            setRouteInfo(null);
            setSelectedSeller(null);
          }}
          className='absolute top-4 right-4 z-50 p-2 bg-white shadow rounded-full hover:shadow-lg transition'
          aria-label='Clear route'
        >
          <X className='h-5 w-5 text-gray-600' />
        </button>
      )}

      {/* User Marker */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {/* Seller Markers */}
      {sellers.map(seller => {
        const dist = calculateDistance(
          [userLocation![0], userLocation![1]],
          [seller.latitude, seller.longitude]
        ).toFixed(1);

        return (
          <Marker
            key={seller.id}
            position={[seller.latitude, seller.longitude]}
            icon={sellerIcon}
            eventHandlers={{ click: () => handleSellerClick(seller) }}
          >
            <Popup className='font-sans'>
              <div className='p-2 max-w-xs text-sm'>
                <h3 className='font-bold text-gray-800'>{seller.shopName}</h3>
                <p className='text-gray-600 mt-1'>
                  {seller.bottleType} • <strong>{seller.price} XAF</strong>
                </p>
                <p className='text-blue-700 font-medium'>📍 {dist} km away</p>

                <div className='flex items-center mt-1 space-x-1'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 text-yellow-500 fill-yellow-500'
                    viewBox='0 0 24 24'
                  >
                    <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                  </svg>
                  <span className='text-xs text-gray-600'>
                    {seller.rating} ({seller.reviewCount})
                  </span>
                </div>

                <div className='grid grid-cols-3 gap-2 mt-3'>
                  <Button
                    asChild
                    size='sm'
                    variant='default'
                    className='bg-green-500 hover:bg-green-600 text-white text-xs h-8 px-2'
                  >
                    <a href={`tel:${seller.phone}`}>📞</a>
                  </Button>

                  <Button
                    size='sm'
                    variant='default'
                    className='bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 px-2'
                    onClick={() => {
                      const isIOS = /iPad|iPhone|iPod/.test(
                        navigator.userAgent
                      );
                      const origin = `${userLocation![0]},${userLocation![1]}`;
                      const dest = `${seller.latitude},${seller.longitude}`;
                      const url = isIOS
                        ? `https://maps.apple.com/?saddr=${origin}&daddr=${dest}&dirflg=d`
                        : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
                      window.open(url, "_blank");
                    }}
                  >
                    🚗
                  </Button>

                  <Button
                    asChild
                    size='sm'
                    variant='default'
                    className='bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 px-2'
                  >
                    <a
                      href={`https://wa.me/?text=Gas%20at%20${encodeURIComponent(
                        seller.shopName
                      )}:%20${
                        seller.price
                      }XAF%20%E2%80%A2%20${dist}km%20away%0A${encodeURIComponent(
                        `https://www.google.com/maps/dir/?api=1&origin=${
                          userLocation![0]
                        },${userLocation![1]}&destination=${seller.latitude},${
                          seller.longitude
                        }`
                      )}`}
                      target='_blank'
                    >
                      💬
                    </a>
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Route Line */}
      {routeCoords.length > 0 && (
        <Polyline
          positions={routeCoords}
          color='#1d4ed8'
          weight={5}
          opacity={0.8}
        />
      )}
    </MapContainer>
  );
}
