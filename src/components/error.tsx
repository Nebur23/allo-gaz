import { X } from "lucide-react";
import { Button } from "./ui/button";

const ErrorMsg = ({ error }: { error: string }) => {
  return (
    <div className='absolute top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm'>
      <div className='flex items-center gap-2'>
        <div className='text-red-500'>⚠️</div>
        <p className='text-sm font-medium'>{error}</p>
        <Button
          size='sm'
          variant='ghost'
          // onClick={() => setError(null)}
          className='ml-auto h-6 w-6 p-0'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
};

export default ErrorMsg;
