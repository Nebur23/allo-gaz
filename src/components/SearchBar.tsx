"use client";

import { Search, X, ChevronDown, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const BRANDS = [
  "SCTM",
  "BOCOM",
  "OILIBYA",
  "CAMGAZ",
  "TOTAL",
  "TRADEX",
] as const;

export function SearchBar({
  onSearch,
  onReset,
}: {
  onSearch: (brand: string, size: string) => void;
  onReset: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [size, setSize] = useState("");
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredBrands = BRANDS.filter(brand =>
    brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasFilters = searchQuery.trim() || size;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Trigger search automatically when user types or selects
  useEffect(() => {
    if (searchQuery.trim() || size) {
      onSearch(searchQuery.trim(), size.trim());
    } else {
      onReset();
    }
  }, [searchQuery, size, onSearch, onReset]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsAutocompleteOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  const selectBrand = (selectedBrand: string) => {
    setSearchQuery(selectedBrand);
    setIsAutocompleteOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const clearBrand = () => {
    setSearchQuery("");
    setIsAutocompleteOpen(false);
    setSelectedIndex(-1);
    // Keep size filter if it exists
    if (size) {
      onSearch("", size);
    } else {
      onReset();
    }
  };

  const clearSize = () => {
    setSize("");
    // Keep search query if it exists
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), "");
    } else {
      onReset();
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSize("");
    setIsAutocompleteOpen(false);
    setSelectedIndex(-1);
    setIsExpanded(false);
    onReset();
  };

  const handleSearchIconClick = () => {
    if (isMobile) {
      setIsExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleInputBlur = () => {
    // Close autocomplete after a delay to allow for clicks
    setTimeout(() => {
      setIsAutocompleteOpen(false);
      setSelectedIndex(-1);
    }, 150);

    // Only collapse on mobile if there's no search query
    if (isMobile && !searchQuery.trim() && !size) {
      setTimeout(() => setIsExpanded(false), 150);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isAutocompleteOpen || filteredBrands.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredBrands.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectBrand(filteredBrands[selectedIndex]);
        }
        break;
      case "Escape":
        setIsAutocompleteOpen(false);
        setSelectedIndex(-1);
        if (isMobile && !searchQuery.trim() && !size) {
          setIsExpanded(false);
        }
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAutocompleteOpen(false);
        setSelectedIndex(-1);
      }
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSizeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mobile collapsed state
  if (isMobile && !isExpanded) {
    return (
      <div className='absolute top-4 right-4 z-50'>
        <button
          onClick={handleSearchIconClick}
          className='w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-300 transform hover:scale-110'
        >
          <Search className='h-5 w-5 text-gray-600' />
        </button>
      </div>
    );
  }

  return (
    <div className='absolute top-4 left-4 right-4 z-50 max-w-md mx-auto space-y-2'>
      {/* Search Input Box */}
      <div className='relative' ref={dropdownRef}>
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 z-10' />
            <input
              ref={inputRef}
              type='text'
              placeholder='Search gas stations (e.g. Total, SCTM)'
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery && setIsAutocompleteOpen(true)}
              onBlur={handleInputBlur}
              className='w-full pl-12 pr-12 py-4 text-base bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400'
            />
            {searchQuery && (
              <button
                onClick={clearBrand}
                className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10'
              >
                <X className='h-4 w-4 text-gray-400' />
              </button>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {isAutocompleteOpen && searchQuery && (
          <div className='absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50'>
            <div className='max-h-60 overflow-y-auto'>
              {filteredBrands.length > 0 ? (
                <>
                  {/* Exact matches first */}
                  {filteredBrands.map((brand, index) => (
                    <button
                      key={brand}
                      onMouseDown={e => {
                        e.preventDefault(); // Prevent input blur
                        selectBrand(brand);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full px-4 py-3 text-left transition-colors text-base ${
                        selectedIndex === index
                          ? "bg-orange-50 text-orange-600"
                          : "hover:bg-gray-50 text-gray-700"
                      } ${index === 0 ? "" : "border-t border-gray-50"}`}
                    >
                      <div className='flex items-center gap-3'>
                        <Search className='h-4 w-4 text-gray-400' />
                        <div>
                          <div className='font-medium'>{brand}</div>
                          <div className='text-xs text-gray-500'>
                            Gas station brand
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Current search query option */}
                  {!filteredBrands.some(
                    brand => brand.toLowerCase() === searchQuery.toLowerCase()
                  ) && (
                    <button
                      onClick={() => {
                        setIsAutocompleteOpen(false);
                        setSelectedIndex(-1);
                      }}
                      className='w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-base text-gray-700 border-t border-gray-100'
                    >
                      <div className='flex items-center gap-3'>
                        <Search className='h-4 w-4 text-gray-400' />
                        <div>
                          <div className='font-medium'>
                            Search for &quot;{searchQuery}&quot;
                          </div>
                          <div className='text-xs text-gray-500'>
                            Press Enter to search
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <div className='px-4 py-6 text-center text-gray-500'>
                  <Search className='h-8 w-8 mx-auto mb-2 text-gray-300' />
                  <div className='text-sm'>No brands found</div>
                  <div className='text-xs text-gray-400 mt-1'>
                    Try searching for &quot;{searchQuery}&quot;
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Size Filter Box */}
      {(searchQuery || size) && (
        <div className='relative' ref={sizeDropdownRef}>
          <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
            <div className='px-4 py-3'>
              <button
                onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                className='w-full flex items-center justify-between text-left'
              >
                <span className='text-gray-600 text-sm font-medium'>
                  Filter by size
                </span>
                <div className='flex items-center gap-2'>
                  <span className='text-gray-800 font-medium text-sm'>
                    {size ? (size === "small" ? "Small" : "Big") : "All Sizes"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      isSizeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Size Dropdown */}
          {isSizeDropdownOpen && (
            <div className='absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-40'>
              {["", "small", "big"].map(sizeOption => (
                <button
                  key={sizeOption}
                  onClick={() => {
                    setSize(sizeOption);
                    setIsSizeDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm ${
                    size === sizeOption
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>
                      {sizeOption === ""
                        ? "All Sizes"
                        : sizeOption === "small"
                        ? "Small"
                        : "Big"}
                    </span>
                    {size === sizeOption && (
                      <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasFilters && (
        <div className='flex flex-wrap gap-2 px-1'>
          {searchQuery && (
            <div className='flex items-center gap-2 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-orange-200'>
              <Search className='h-3 w-3' />
              <span>&quot;{searchQuery}&quot;</span>
              <button
                onClick={clearBrand}
                className='hover:bg-orange-200 rounded-full p-1 transition-colors'
              >
                <X className='h-3 w-3' />
              </button>
            </div>
          )}
          {size && (
            <div className='flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-blue-200'>
              <span>{size === "small" ? "Small" : "Big"} Size</span>
              <button
                onClick={clearSize}
                className='hover:bg-blue-200 rounded-full p-1 transition-colors'
              >
                <X className='h-3 w-3' />
              </button>
            </div>
          )}

          {/* Reset All Button */}
          <button
            onClick={handleReset}
            className='flex items-center gap-1 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-full bg-gray-100 transition-colors text-sm'
          >
            <RefreshCw className='h-3 w-3' />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
