import { Search, Users, FileX } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-users' | 'no-results';
  searchTerm?: string;
  onClearFilters?: () => void;
}

export function EmptyState({ type, searchTerm, onClearFilters }: EmptyStateProps) {
  if (type === 'no-users') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No users yet
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Get started by adding your first user to the system. Users can be added through the registration process or imported in bulk.
        </p>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No results found
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
          We couldn't find any users matching "{searchTerm}". Try adjusting your search terms or filters.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
          >
            <FileX className="w-4 h-4" />
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return null;
}