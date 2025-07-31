"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Skeleton } from "@/components/ui/skeleton";

interface IconDefault extends L.Icon.Default {
  _getIconUrl?: string;
}

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Seller = {
  id: string;
  shopName: string;
  latitude: number;
  longitude: number;
  bottleType: string;
  price: number;
};

export default function MapSearch({ query }: { query: string }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mockSellers: Seller[] = [
    {
      id: "1",
      shopName: "GazPlus Yaoundé",
      latitude: 3.848,
      longitude: 11.502,
      bottleType: "6kg",
      price: 2500,
    },
    {
      id: "2",
      shopName: "SafeGaz Douala",
      latitude: 4.051,
      longitude: 9.768,
      bottleType: "6kg",
      price: 2700,
    },
    {
      id: "3",
      shopName: "QuickGaz Bonapriso",
      latitude: 4.09,
      longitude: 9.714,
      bottleType: "12kg",
      price: 5000,
    },
    {
      id: "4",
      shopName: "EcoGaz Ngoa-Ekelle",
      latitude: 3.885,
      longitude: 11.477,
      bottleType: "6kg",
      price: 2400,
    },
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);

    const filterAndSortSellers = (userPos: [number, number]) => {
      const filtered = mockSellers.filter(s =>
        s.bottleType.toLowerCase().includes(query.toLowerCase())
      );

      const sorted = filtered.sort((a, b) => {
        const distA = calculateDistance(userPos, [a.latitude, a.longitude]);
        const distB = calculateDistance(userPos, [b.latitude, b.longitude]);
        return distA - distB;
      });

      setSellers(sorted);
      setLoading(false);
    };

    // Get real user location
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setUserLocation([3.848, 11.502]); // Fallback to Yaoundé
      filterAndSortSellers([3.848, 11.502]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const userPos: [number, number] = [latitude, longitude];
        setUserLocation(userPos);
        filterAndSortSellers(userPos);
      },
      err => {
        console.warn("Geolocation error:", err);
        setError("Unable to get your location. Using Yaoundé as fallback.");
        const fallback: [number, number] = [3.848, 11.502];
        setUserLocation(fallback);
        filterAndSortSellers(fallback);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [query]);

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

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  if (loading && !userLocation) {
    return <Skeleton className='w-full h-96 rounded-none' />;
  }

  return (
    <div className='rounded-lg overflow-hidden'>
      {error && (
        <div className='bg-yellow-50 text-yellow-800 p-3 text-sm mb-2 rounded'>
          {error}
        </div>
      )}

      <MapContainer
        center={userLocation || [3.848, 11.502]}
        zoom={12}
        style={{ height: "500px", width: "100%" }}
        scrollWheelZoom={false}
        className='z-10'
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {userLocation && (
          <Marker position={userLocation}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {sellers.map(seller => {
          const dist = calculateDistance(
            [userLocation![0], userLocation![1]],
            [seller.latitude, seller.longitude]
          ).toFixed(1);

          return (
            <Marker
              key={seller.id}
              position={[seller.latitude, seller.longitude]}
            >
              <Popup>
                <div>
                  <strong>{seller.shopName}</strong>
                  <br />
                  {seller.bottleType} bottle:{" "}
                  <strong>{seller.price} XAF</strong>
                  <br />
                  Distance: {dist} km
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
