"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Navigation, X, Loader2 } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { mockSellers, Seller } from "@/lib/sellers";
import { SearchBar } from "@/components/SearchBar";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SellerCardSkeleton } from "@/components/skeleton/seller";
import { SellerCard } from "@/components/SellerCard";
import { useFavorites } from "@/hooks/useFavorites";

// Optimized dynamic import with better loading state
const MapSearch = dynamic(() => import("@/components/MapSearch"), {
  ssr: false,
  loading: () => (
    <div className='h-full bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='h-8 w-8 animate-spin text-orange-500 mx-auto mb-2' />
        <p className='text-sm text-gray-600'>Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [filters, setFilters] = useState({ brand: "", size: "" });
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [activeTab, setActiveTab] = useState<"nearby" | "favorites">("nearby");
  const [listViewMode, setListViewMode] = useState<"half" | "full" | "minimal">(
    "half"
  );

  const { favorites } = useFavorites();
  const favoriteSellers = mockSellers.filter(s => favorites.includes(s.id));

  const {
    setState,
    error,
    location: userLocation,
    loading: locationLoading,
    permissionState,
    requestPermission,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 30000, // Increased for mobile
    maximumAge: 300000,
    requestPermissionOnMount: true, // Auto-request in map component
  });

  // Handle location permission states
  const handleLocationPermission = useCallback(async () => {
    if (permissionState === "denied") {
      // Show user how to enable location
      return;
    }

    if (permissionState === "prompt") {
      const granted = await requestPermission();
      if (!granted) {
        // Handle permission denied
        console.log("Location permission denied");
      }
    }
  }, [permissionState, requestPermission]);

  const renderLocationPermissionUI = () => {
    if (locationLoading) {
      return (
        <div className='absolute top-0 left-0 right-0 z-[100] bg-blue-50 border-b border-blue-200 p-3'>
          <div className='flex items-center justify-center gap-2 text-blue-700'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span className='text-sm'>Getting your location...</span>
          </div>
        </div>
      );
    }

    if (permissionState === "denied") {
      return (
        <div className='absolute top-0 left-0 right-0 z-[100] bg-red-50 border-b border-red-200 p-3'>
          <div className='text-center'>
            <p className='text-sm text-red-700 mb-2'>
              Location access is required to find nearby gas sellers
            </p>
            <button
              onClick={() => window.location.reload()}
              className='text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700'
            >
              Enable Location & Refresh
            </button>
          </div>
        </div>
      );
    }

    if (permissionState === "prompt") {
      return (
        <div className='absolute top-0 left-0 right-0 z-[100] bg-orange-50 border-b border-orange-200 p-3'>
          <div className='text-center'>
            <p className='text-sm text-orange-700 mb-2'>
              Allow location access to find gas sellers near you
            </p>
            <button
              onClick={handleLocationPermission}
              className='text-xs bg-orange-600 text-white px-3 py-1 rounded-full hover:bg-orange-700'
            >
              Allow Location Access
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

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

  // Memoized filtered sellers for better performance
  const filteredSellers = useMemo(() => {
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
  // Handle seller selection from map with useCallback for performance
  const handleSellerSelect = useCallback(
    (seller: Seller, routeCoords: [number, number][]) => {
      setSelectedSeller(seller);
      //setRouteCoords(routeCoords);
      console.log("Selected routeCoords:", routeCoords);
      if (listViewMode === "minimal") {
        setListViewMode("half");
      }
    },
    [listViewMode]
  );

  const handleSearch = useCallback((brand: string, size: string) => {
    setFilters({ brand, size });
    setSelectedSeller(null);
  }, []);

  const resetView = useCallback(() => {
    setSelectedSeller(null);
    //setRouteCoords([]);
    setFilters({ brand: "", size: "" });
  }, []);

  const handleReset = useCallback(() => {
    setFilters({ brand: "", size: "" });
    setSelectedSeller(null);
    //setRouteCoords([]);
  }, []);

  // Optimized swipe handlers
  const handlers = useSwipeable({
    onSwipedDown: () => {
      if (listViewMode === "full") setListViewMode("half");
      else if (listViewMode === "half") setListViewMode("minimal");
    },
    onSwipedUp: () => {
      if (listViewMode === "minimal") setListViewMode("half");
      else if (listViewMode === "half") setListViewMode("full");
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 50, // Minimum swipe distance
  });

  // Get list height based on view mode
  const getListHeight = () => {
    switch (listViewMode) {
      case "full":
        return "h-5/6";
      case "half":
        return "h-2/4";
      case "minimal":
        return "h-20";
      default:
        return "h-2/5";
    }
  };

  return (
    <div
      className='flex flex-col overflow-hidden'
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        height: "100dvh",
      }}
    >
      {renderLocationPermissionUI()}
      <SearchBar onSearch={handleSearch} onReset={handleReset} />

      <div className='flex-1 relative overflow-hidden'>
        <MapSearch
          filters={filters}
          onSellerSelect={handleSellerSelect}
          userLocation={userLocation as [number, number]}
          setState={setState}
          error={error}
        />

        <div className='absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex gap-2'>
          <button
            onClick={() =>
              setListViewMode(listViewMode === "minimal" ? "half" : "minimal")
            }
            className='px-6 py-3 bg-white shadow-lg rounded-full text-gray-700 font-medium text-sm flex items-center gap-2 hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-gray-100'
          >
            <Navigation className='h-4 w-4' />
            {listViewMode === "minimal" ? "Show Sellers" : "Hide List"}
          </button>

          {selectedSeller && (
            <button
              onClick={resetView}
              className='p-3 hidden bg-red-500 text-white shadow-lg rounded-full hover:bg-red-600 hover:shadow-xl transition-all duration-200'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        {/* Route info overlay */}
        {selectedSeller && (
          <div className='hidden absolute top-1/4 md:w-1/2 mx-auto left-4 right-4 z-40'>
            <Card className='bg-white/95 backdrop-blur-sm border-0 shadow-lg'>
              <CardContent className='p-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-semibold text-gray-800'>
                      {selectedSeller.shopName}
                    </h3>
                    <p className='text-sm text-orange-600'>
                      {selectedSeller.price} XAF • {selectedSeller.brand} •
                      {selectedSeller.size === "small" ? "6kg" : "12kg"}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center'>
                      <Star className='h-3 w-3 text-yellow-500 fill-yellow-500' />
                      <span className='text-xs text-gray-600 ml-1'>
                        {selectedSeller.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Sheet */}
      {listViewMode !== "minimal" && (
        <div
          {...handlers}
          className={`bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 ${getListHeight()} transform transition-all duration-300 ease-out`}
          style={{
            boxShadow:
              "0 -10px 25px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Enhanced Handle Bar */}
          <div className='flex items-center justify-center py-3 cursor-grab active:cursor-grabbing'>
            <div className='w-12 h-1.5 bg-gray-300 rounded-full transition-colors duration-200 hover:bg-gray-400'></div>
          </div>

          <div className='px-4 pb-2 border-b border-gray-100'>
            <div className='flex space-x-1'>
              <Button
                variant={activeTab === "nearby" ? "default" : "outline"}
                size='sm'
                onClick={() => setActiveTab("nearby")}
                className='rounded-full text-xs px-3'
              >
                Nearby
              </Button>
              <Button
                variant={activeTab === "favorites" ? "default" : "outline"}
                size='sm'
                onClick={() => setActiveTab("favorites")}
                className='rounded-full text-xs px-3'
              >
                Favorites ({favorites.length})
              </Button>
            </div>
          </div>

          {activeTab === "nearby" && (
            <>
              <div className='px-4 pb-2 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-lg font-semibold text-gray-800'>
                    Nearby Sellers ({filteredSellers.length})
                  </h2>
                  <div className='flex gap-1'>
                    <button
                      onClick={() => setListViewMode("half")}
                      className={`p-2 rounded-lg transition-colors ${
                        listViewMode === "half"
                          ? "bg-orange-100 text-orange-600"
                          : "text-gray-400"
                      }`}
                    >
                      <div className='w-4 h-2 bg-current rounded'></div>
                    </button>
                    <button
                      onClick={() => setListViewMode("full")}
                      className={`p-2 rounded-lg transition-colors ${
                        listViewMode === "full"
                          ? "bg-orange-100 text-orange-600"
                          : "text-gray-400"
                      }`}
                    >
                      <div className='w-4 h-4 bg-current rounded'></div>
                    </button>
                  </div>
                </div>
              </div>

              <ScrollArea className='flex-1 px-4 h-full'>
                <div className='space-y-3 py-4'>
                  {filteredSellers.length === 0
                    ? // Loading skeletons
                      Array.from({ length: 3 }).map((_, i) => (
                        <SellerCardSkeleton key={i} />
                      ))
                    : filteredSellers.map(seller => {
                        const isSelected = selectedSeller?.id === seller.id;
                        return (
                          <SellerCard
                            key={seller.id}
                            seller={seller}
                            isSelected={isSelected}
                            userLocation={userLocation as [number, number]}
                            onClick={() => setSelectedSeller(seller)}
                          />
                        );
                      })}
                </div>
              </ScrollArea>
            </>
          )}

          {activeTab === "favorites" && (
            <div className='space-y-3 py-4'>
              {favoriteSellers.length === 0 ? (
                <p className='text-center text-gray-500 text-sm p-4'>
                  No favorites yet
                </p>
              ) : (
                favoriteSellers.map(seller => (
                  <SellerCard
                    key={seller.id}
                    seller={seller}
                    /* props */ isSelected={false}
                    onClick={function (): void {
                      throw new Error("Function not implemented.");
                    }} /* props */
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
