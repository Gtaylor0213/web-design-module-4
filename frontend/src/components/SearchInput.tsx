import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

/** Search input with leading icon and a clear button. Used in each
 *  section's list view to filter entries client-side as you type. */
export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative mb-4">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search'}
        className="pl-9 pr-9"
        aria-label={placeholder ?? 'Search'}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
