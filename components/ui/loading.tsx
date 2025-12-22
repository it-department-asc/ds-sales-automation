import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="mt-2 text-lg text-gray-600">Loading...</span>
      </div>
    </div>
  );
}