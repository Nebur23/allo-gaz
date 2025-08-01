"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Fuel, RefreshCw } from "lucide-react";

export function SearchBar({
  onSearch,
  onReset,
}: {
  onSearch: (brand: string, size: string) => void;
  onReset: () => void;
}) {
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");

  const handleSearch = () => {
    if (brand.trim() || size.trim()) {
      onSearch(brand.trim(), size.trim());
    }
  };

  return (
    <div className='absolute md:w-1/3 top-4 left-4 right-4 z-50 space-y-2'>
      <div className='flex gap-2'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none' />
          <Input
            placeholder='Search by brand (e.g. Total, SCTM)'
            value={brand}
            onChange={e => setBrand(e.target.value)}
            className='pl-10 bg-white border-gray-300 focus:border-orange-500'
          />
        </div>
        <select
          value={size}
          onChange={e => setSize(e.target.value)}
          className='p-2 border border-gray-300 rounded-lg bg-white text-sm min-w-24'
        >
          <option value=''>All Sizes</option>
          <option value='small'>Small</option>
          <option value='big'>Big</option>
        </select>
      </div>

      <div className='flex gap-2'>
        <Button
          onClick={handleSearch}
          className='flex-1 bg-orange-500 hover:bg-orange-600 text-white'
        >
          <Fuel /> Search
        </Button>
        {(brand || size) && (
          <Button
            variant='outline'
            onClick={() => {
              setBrand("");
              setSize("");
              onReset();
            }}
            className='text-gray-700 hover:bg-white hover:bg-opacity-20 transition-all duration-200'
          >
            <RefreshCw className='h-4 w-4 mr-1' />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
