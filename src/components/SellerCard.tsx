"use client";

import {
  Star,
  Phone,
  Share2,
  MapPin,
  Clock,
  CheckCircle,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";
import { Seller } from "@/lib/sellers";
import { useFavorites } from "@/hooks/useFavorites";

type Props = {
  seller: Seller;
  isSelected: boolean;
  userLocation?: [number, number];
  onClick: () => void;
};

export function SellerCard({
  seller,
  isSelected,
  userLocation,
  onClick,
}: Props) {
  const isOpen = useMemo(() => {
    if (!seller.openHours) return true;
    const now = new Date();
    const currentHour = now.getHours() * 100 + now.getMinutes();
    const open = parseInt(seller.openHours.open.replace(":", ""));
    const close = parseInt(seller.openHours.close.replace(":", ""));
    return currentHour >= open && currentHour <= close;
  }, [seller.openHours]);

  const { isFavorite, toggleFavorite } = useFavorites();

  const distance = useMemo(() => {
    if (!userLocation || !seller.latitude) return null;
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(seller.latitude - userLocation[0]);
    const dLon = toRad(seller.longitude - userLocation[1]);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation[0])) *
        Math.cos(toRad(seller.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  }, [userLocation, seller.latitude, seller.longitude]);

  return (
    <Card
      className={`overflow-hidden md:mx-5 cursor-pointer transition-all duration-200 hover:shadow-md border-0 ${
        isSelected
          ? "ring-2 ring-orange-400 shadow-lg transform scale-[1.01]"
          : ""
      }`}
      onClick={onClick}
    >
      <div className='flex gap-3 p-3'>
        {/* Image */}
        <div className='relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden'>
          <Image
            src={`/images${seller.image}`}
            alt={seller.shopName}
            fill
            className='object-cover'
          />
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between'>
            <h3 className='font-semibold text-gray-800 text-sm line-clamp-1'>
              {seller.shopName}
            </h3>
            {seller.verified && (
              <CheckCircle className='h-4 w-4 text-green-500 ml-1 flex-shrink-0' />
            )}
          </div>

          {/* Badges */}
          <div className='flex gap-1 mt-1'>
            {seller.reviewCount > 100 && (
              <span className='bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium'>
                🔥 Popular
              </span>
            )}
            {seller.deliveryTime && seller.deliveryTime < 30 && (
              <span className='bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium'>
                🚀 Fast Delivery
              </span>
            )}
            {seller.discount && (
              <span className='bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium'>
                💰 {seller.discount}% Off
              </span>
            )}
          </div>

          {/* Brand & Address */}
          <div className='flex items-center gap-2 mt-1'>
            <span className='bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium'>
              {seller.brand}
            </span>
            <span className='text-xs text-gray-500 truncate flex-1'>
              {seller.address || "Address not available"}
            </span>
          </div>

          {/* Rating & Distance */}
          <div className='flex items-center gap-3 mt-2'>
            <div className='flex items-center'>
              <Star className='h-3 w-3 text-yellow-500 fill-yellow-500' />
              <span className='text-xs text-gray-600 ml-1'>
                {seller.rating} ({seller.reviewCount})
              </span>
            </div>
            {distance && (
              <div className='flex items-center text-blue-600'>
                <MapPin className='h-3 w-3' />
                <span className='text-xs ml-0.5'>{distance} km</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className='flex items-center gap-2 mt-2'>
            <span className='font-bold text-orange-600 text-sm'>
              {seller.price} XAF
            </span>
            <span className='text-xs text-gray-500'>
              {seller.size === "small" ? "6kg" : "12kg"} bottle
            </span>
          </div>

          {/* Open/Closed */}
          {seller.openHours && (
            <div className='flex items-center mt-2'>
              <Clock className='h-3 w-3 text-gray-400 mr-1' />
              <span className='text-xs text-gray-500'>
                {seller.openHours.open} - {seller.openHours.close}
              </span>
              <span
                className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  isOpen
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isOpen ? "Open" : "Closed"}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col gap-1 ml-2'>
          <Button
            size='icon'
            variant={isFavorite(seller.id) ? "default" : "outline"}
            className={
              isFavorite(seller.id)
                ? "h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
                : "h-8 w-8 border-gray-200 hover:border-red-400 hover:bg-red-50"
            }
            onClick={e => {
              e.stopPropagation();
              toggleFavorite(seller.id);
            }}
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                isFavorite(seller.id) ? "fill-white" : "text-red-600"
              }`}
            />
          </Button>
          <Button
            size='icon'
            variant='outline'
            className='h-8 w-8 p-0 border-gray-200 hover:border-green-400 hover:bg-green-50'
            asChild
          >
            <a href={`tel:${seller.phone}`} aria-label='Call seller'>
              <Phone className='h-3.5 w-3.5 text-green-600' />
            </a>
          </Button>
          <Button
            size='icon'
            variant='outline'
            className='h-8 w-8 p-0 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
            asChild
          >
            <a
              href={`https://wa.me/?text=Gas at ${encodeURIComponent(
                seller.shopName
              )}: ${seller.price}XAF`}
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Share on WhatsApp'
            >
              <Share2 className='h-3.5 w-3.5 text-blue-600' />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
