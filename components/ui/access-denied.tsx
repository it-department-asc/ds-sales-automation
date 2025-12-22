import { ShieldX } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col items-center text-center">
        <ShieldX className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
        <p className="text-gray-600">You do not have permission to access this page. Only administrators can upload and manage files.</p>
      </div>
    </div>
  );
}