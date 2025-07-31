"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const MapSearch = dynamic(() => import("@/components/MapSearch"), {
  ssr: false,
  loading: () => (
    <div className='h-96 flex items-center justify-center'>Loading map...</div>
  ),
});

export default function Home() {
  const [query, setQuery] = useState("6kg");
  const [bottleType, setBottleType] = useState("6kg");

  const handleSearch = () => {
    setQuery(bottleType);
  };

  return (
    <div className='min-h-screen bg-background'>
      <header className='bg-primary text-primary-foreground p-6 shadow'>
        <h1 className='text-2xl font-bold'>AlloGaz</h1>
        <p className='opacity-90'>Fast gas delivery in Cameroon</p>
      </header>

      <main className='p-6 max-w-4xl mx-auto space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Search for Gas Bottle</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Select value={bottleType} onValueChange={setBottleType}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select bottle size' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='6kg'>6kg Bottle</SelectItem>
                  <SelectItem value='12kg'>12kg Bottle</SelectItem>
                  <SelectItem value='50kg'>50kg Bottle</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className='shrink-0'>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sellers near you ({query})</CardTitle>
          </CardHeader>
          <CardContent>
            <MapSearch query={query} />
          </CardContent>
        </Card>
      </main>

      <footer className='text-center p-4 text-muted-foreground text-sm'>
        AlloGaz — Bringing gas to your doorstep
      </footer>
    </div>
  );
}
