import { Card, CardContent } from "../ui/card";

export const SellerCardSkeleton = () => (
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