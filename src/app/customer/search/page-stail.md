"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Phone, Share2, Car } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { mockSellers } from "@/lib/sellers";

// Dynamically import MapSearch (SSR-safe)
const MapSearch = dynamic(() => import("@/components/MapSearch"), {
  ssr: false,
  loading: () => <div className='h-full bg-gray-100 animate-pulse'></div>,
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

export default function Home() {
  const [query, setQuery] = useState("6kg");
  const [bottleType, setBottleType] = useState("6kg");
  const [showList, setShowList] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // Handle seller selection from map
  const handleSellerSelect = (seller: Seller, coords: [number, number][]) => {
    setSelectedSeller(seller);
    setRouteCoords(coords);
    setShowList(true); // Show list when seller clicked
  };

  const handleSearch = () => {
    setQuery(bottleType);
    setSelectedSeller(null);
    setRouteCoords([]);
  };

  const handlers = useSwipeable({
    onSwipedDown: () => setShowList(false),
    onSwipedUp: () => setShowList(true),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div className='flex flex-col h-screen bg-background'>
      {/* Header */}
      <header className='bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center'>
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
      </header>

      {/* Search Bar */}
      <div className='p-4 bg-background border-b border-gray-200 shadow-sm'>
        <div className='flex gap-2'>
          <select
            value={bottleType}
            onChange={e => setBottleType(e.target.value)}
            className='flex-1 p-3 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none'
          >
            <option value='6kg'>6kg Gas Bottle</option>
            <option value='12kg'>12kg Gas Bottle</option>
            <option value='50kg'>50kg Gas Bottle</option>
          </select>
          <Button
            onClick={handleSearch}
            size='icon'
            className='bg-orange-500 hover:bg-orange-600'
          >
            <Car className='h-5 w-5' />
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className='flex-1 relative'>
        <MapSearch
          query={query}
          onSellerSelect={handleSellerSelect}
          onTry6kg={() => {
            setBottleType("6kg");
            setQuery("6kg");
          }}
        />

        {/* Toggle List Button */}
        <button
          onClick={() => setShowList(!showList)}
          className='absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-2 bg-white shadow-lg rounded-full text-gray-700 font-medium text-sm flex items-center gap-1'
        >
          {showList ? "Hide List" : "View Sellers"}
        </button>
      </div>

      {/* Bottom Sheet: Nearby Sellers */}
      {showList && (
        <div
          {...handlers}
          className='bg-white rounded-t-2xl shadow-lg border-t h-1/3 transform transition-transform duration-300'
        >
          {/* Handle Bar */}
          <div className='flex items-center justify-center py-2'>
            <div className='w-12 h-1 bg-gray-300 rounded-full'></div>
          </div>

          {/* Scrollable List */}
          <ScrollArea className='h-full px-4'>
            <div className='space-y-3 pb-4'>
              {mockSellers
                .filter(s =>
                  s.bottleType.toLowerCase().includes(query.toLowerCase())
                )
                .map(seller => {
                  const isSelected = selectedSeller?.id === seller.id;
                  return (
                    <Card
                      key={seller.id}
                      className={`overflow-hidden cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-orange-400 scale-102" : ""
                      }`}
                      onClick={() => {
                        setSelectedSeller(seller);
                        // You can also pan map to this seller if needed
                      }}
                    >
                      <CardContent className='p-3'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <h3 className='font-bold text-gray-800'>
                                {seller.shopName}
                              </h3>
                              {isSelected && (
                                <span className='text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full'>
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className='text-sm text-gray-600'>
                              {seller.bottleType} • {seller.price} XAF
                            </p>
                            <div className='flex items-center mt-1'>
                              <Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                              <span className='text-xs text-gray-500 ml-1'>
                                {seller.rating} ({seller.reviewCount})
                              </span>
                            </div>
                          </div>

                          <div className='flex gap-1'>
                            <Button
                              size='icon'
                              variant='outline'
                              className='h-8 w-8'
                              asChild
                            >
                              <a
                                href={`tel:${seller.phone}`}
                                aria-label='Call seller'
                              >
                                <Phone className='h-3 w-3' />
                              </a>
                            </Button>
                            <Button
                              size='icon'
                              variant='outline'
                              className='h-8 w-8'
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
                                <Share2 className='h-3 w-3' />
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
