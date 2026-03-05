import React from 'react';
import { SearchIcon } from 'lucide-react';

export interface FilterConfig {
  type: 'text' | 'date' | 'select';
  label: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: {
    label: string;
    value: string;
  }[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  totalCount: number;
  totalLabel?: string;
  onSearch?: () => void;
}

export function FilterBar({
  filters,
  totalCount,
  totalLabel = 'Total Orders',
  onSearch,
}: FilterBarProps) {
  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        {filters.map((filter, idx) => (
          <div key={idx} className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">
              {filter.label}
            </label>

            {filter.type === 'text' && (
              <input
                type="text"
                placeholder={filter.placeholder}
                value={filter.value ?? ''}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            )}

            {filter.type === 'date' && (
              <input
                type="date"
                value={filter.value ?? filter.defaultValue ?? ''}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            )}

            {filter.type === 'select' && (
              <select
                value={filter.value ?? ''}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Any</option>
                {filter.options?.map((opt, oIdx) => (
                  <option key={oIdx} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        <button
          onClick={onSearch}
          className="flex h-9 items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <SearchIcon className="mr-2 h-4 w-4" />
          Search
        </button>

        <div className="ml-auto flex items-center space-x-2 rounded-md bg-gray-50 px-4 py-2 border border-gray-200">
          <span className="text-sm font-medium text-gray-600">{totalLabel}:</span>
          <span className="text-lg font-bold text-teal-700">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}