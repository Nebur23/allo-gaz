"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Phone,
  Share2,
  Car,
  MapPin,
  Navigation,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { mockSellers } from "@/lib/sellers";

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

type Seller = {
  id: string;
  shopName: string;
  latitude: number;
  longitude: number;
  bottleType: string;
  price: number;
  phone: string;
  rating: number;
  reviewCount: number;
};

// Loading skeleton component
const SellerCardSkeleton = () => (
  <Card className='overflow-hidden animate-pulse'>
    <CardContent className='p-3'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
          <div className='h-3 bg-gray-200 rounded w-1/2 mb-2'></div>
          <div className='flex items-center gap-2'>
            <div className='h-3 w-3 bg-gray-200 rounded'></div>
            <div className='h-3 bg-gray-200 rounded w-16'></div>
          </div>
        </div>
        <div className='flex gap-1'>
          <div className='h-8 w-8 bg-gray-200 rounded'></div>
          <div className='h-8 w-8 bg-gray-200 rounded'></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Home() {
  const [query, setQuery] = useState("6kg");
  const [bottleType, setBottleType] = useState("6kg");
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [listViewMode, setListViewMode] = useState<"half" | "full" | "minimal">(
    "half"
  );

  // Memoized filtered sellers for better performance
  const filteredSellers = useMemo(() => {
    return mockSellers.filter(s =>
      s.bottleType.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  // Handle seller selection from map with useCallback for performance
  const handleSellerSelect = useCallback(
    (seller: Seller, coords: [number, number][]) => {
      setSelectedSeller(seller);
      setRouteCoords(coords);
      if (listViewMode === "minimal") {
        setListViewMode("half");
      }
    },
    [listViewMode]
  );

  const handleSearch = useCallback(() => {
    setIsMapLoading(true);
    setQuery(bottleType);
    setSelectedSeller(null);
    setRouteCoords([]);
    // Simulate loading time - in real app this would be handled by map component
    setTimeout(() => setIsMapLoading(false), 500);
  }, [bottleType]);

  const resetView = useCallback(() => {
    setSelectedSeller(null);
    setRouteCoords([]);
    setListViewMode("half");
    setQuery(bottleType);
  }, [bottleType]);

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
        return "h-2/5";
      case "minimal":
        return "h-20";
      default:
        return "h-2/5";
    }
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50 overflow-hidden'>
      {/* Enhanced Header with gradient */}
      <header className='bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 shadow-lg sticky top-0 z-50 backdrop-blur-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                className='text-white'
              >
                <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
                <polyline points='9 22 9 12 15 12 15 22'></polyline>
              </svg>
            </div>
            <div>
              <h1 className='text-lg font-bold'>AlloGaz</h1>
              <p className='text-xs opacity-90'>Gas delivered in minutes</p>
            </div>
          </div>

          {/* Reset button */}
          {(selectedSeller || routeCoords.length > 0) && (
            <Button
              onClick={resetView}
              size='sm'
              variant='ghost'
              className='text-white hover:bg-white hover:bg-opacity-20 transition-all duration-200'
            >
              <RefreshCw className='h-4 w-4 mr-1' />
              Reset
            </Button>
          )}
        </div>
      </header>

      {/* Enhanced Search Bar with better styling */}
      <div className='p-4 bg-white border-b border-gray-100 shadow-sm'>
        <div className='flex gap-3 items-center'>
          <div className='flex-1 relative'>
            <select
              value={bottleType}
              onChange={e => setBottleType(e.target.value)}
              className='w-full p-3 pl-10 border border-gray-200 rounded-2xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent appearance-none shadow-sm transition-all duration-200'
            >
              <option value='6kg'>6kg Gas Bottle</option>
              <option value='12kg'>12kg Gas Bottle</option>
              <option value='50kg'>50kg Gas Bottle</option>
            </select>
            <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isMapLoading}
            className='bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 rounded-2xl'
          >
            {isMapLoading ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <Car className='h-5 w-5' />
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Map Container */}
      <div className='flex-1 relative overflow-hidden'>
        <Suspense
          fallback={
            <div className='h-full bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center'>
              <div className='text-center'>
                <Loader2 className='h-8 w-8 animate-spin text-orange-500 mx-auto mb-2' />
                <p className='text-sm text-gray-600'>Loading map...</p>
              </div>
            </div>
          }
        >
          <MapSearch
            query={query}
            onSellerSelect={handleSellerSelect}
            onTry6kg={() => {
              setBottleType("6kg");
              setQuery("6kg");
            }}
          />
        </Suspense>

        {/* Enhanced Toggle List Button */}
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
              className='p-3 bg-red-500 text-white shadow-lg rounded-full hover:bg-red-600 hover:shadow-xl transition-all duration-200'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        {/* Route info overlay */}
        {selectedSeller && (
          <div className='absolute top-4 left-4 right-4 z-40'>
            <Card className='bg-white/95 backdrop-blur-sm border-0 shadow-lg'>
              <CardContent className='p-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-semibold text-gray-800'>
                      {selectedSeller.shopName}
                    </h3>
                    <p className='text-sm text-orange-600'>
                      {selectedSeller.price} XAF • {selectedSeller.bottleType}
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

          {/* Header */}
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

          {/* Scrollable List */}
          <ScrollArea className='flex-1 px-4'>
            <div className='space-y-3 py-4'>
              {filteredSellers.length === 0
                ? // Loading skeletons
                  Array.from({ length: 3 }).map((_, i) => (
                    <SellerCardSkeleton key={i} />
                  ))
                : filteredSellers.map(seller => {
                    const isSelected = selectedSeller?.id === seller.id;
                    return (
                      <Card
                        key={seller.id}
                        className={`overflow-hidden cursor-pointer transition-all duration-200 border-0 shadow-sm hover:shadow-md ${
                          isSelected
                            ? "ring-2 ring-orange-400 shadow-lg transform scale-[1.02]"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedSeller(seller);
                        }}
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-1'>
                                <h3 className='font-semibold text-gray-800 text-base'>
                                  {seller.shopName}
                                </h3>
                                {isSelected && (
                                  <span className='text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium'>
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className='text-sm text-gray-600 mb-2'>
                                {seller.bottleType} •{" "}
                                <span className='font-semibold text-orange-600'>
                                  {seller.price} XAF
                                </span>
                              </p>
                              <div className='flex items-center'>
                                <Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                                <span className='text-sm text-gray-600 ml-1'>
                                  {seller.rating} ({seller.reviewCount} reviews)
                                </span>
                              </div>
                            </div>

                            <div className='flex gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                className='h-9 w-9 p-0 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200'
                                asChild
                              >
                                <a
                                  href={`tel:${seller.phone}`}
                                  aria-label='Call seller'
                                >
                                  <Phone className='h-4 w-4 text-green-600' />
                                </a>
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='h-9 w-9 p-0 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200'
                                asChild
                              >
                                <a
                                  href={`https://wa.me/?text=Gas%20at%20${encodeURIComponent(
                                    seller.shopName
                                  )}:%20${
                                    seller.price
                                  }XAF%0Ahttps://maps.google.com/?q=${
                                    seller.latitude
                                  },${seller.longitude}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  aria-label='Share on WhatsApp'
                                >
                                  <Share2 className='h-4 w-4 text-blue-600' />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
