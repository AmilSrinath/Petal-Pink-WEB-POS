import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon } from 'lucide-react';

export interface FilterConfig {
  type: 'text' | 'date' | 'select';
  label: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: { label: string; value: string }[];
}

interface CountItem {
  label: string;
  value: number;
  className?: string; // tailwind classes for the value text, e.g. 'text-green-700'
}

interface FilterBarProps {
  filters: FilterConfig[];
  totalCount: number;
  totalLabel?: string;
  counts?: CountItem[];
  onSearch?: () => void;
}

export function FilterBar({
  filters,
  totalCount,
  totalLabel = 'Total Orders',
  counts = [],
  onSearch,
}: FilterBarProps) {
  // ── Draft state: text inputs are buffered locally until Search is pressed ──
  const [drafts, setDrafts] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    filters.forEach((f, idx) => {
      if (f.type === 'text') init[idx] = f.value ?? '';
    });
    return init;
  });

  // Keep drafts in sync if the parent resets values externally (e.g. clear button)
  const prevValues = useRef<Record<number, string>>({});
  useEffect(() => {
    filters.forEach((f, idx) => {
      if (f.type === 'text') {
        const ext = f.value ?? '';
        if (prevValues.current[idx] !== ext) {
          setDrafts((d) => ({ ...d, [idx]: ext }));
          prevValues.current[idx] = ext;
        }
      }
    });
  }, [filters]);

  // Push all buffered text values to parent and fire onSearch
  const commitAll = () => {
    filters.forEach((f, idx) => {
      if (f.type === 'text') f.onChange?.(drafts[idx] ?? '');
    });
    onSearch?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitAll();
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        {filters.map((filter, idx) => (
          <div key={idx} className="flex flex-col space-y-1">
            <label className="text-xs font-medium text-gray-700">
              {filter.label}
            </label>

            {/* ── Text input: buffered, icon inside ── */}
            {filter.type === 'text' && (
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={filter.placeholder ?? 'Search…'}
                  value={drafts[idx] ?? ''}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [idx]: e.target.value }))
                  }
                  onKeyDown={handleKeyDown}
                  className="h-9 w-40 rounded-md border border-gray-300 pl-8 pr-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            )}

            {/* ── Date input: fires immediately (no buffering needed) ── */}
            {filter.type === 'date' && (
              <input
                type="date"
                value={filter.value ?? filter.defaultValue ?? ''}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            )}

            {/* ── Select input: fires immediately ── */}
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
          onClick={commitAll}
          className="flex h-9 items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <SearchIcon className="mr-2 h-4 w-4" />
          Search
        </button>

        {/* ── Stats strip: Total + any extra counts ── */}
        <div className="ml-auto flex items-stretch gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200">
          {/* Total */}
          <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2">
            <span className="text-sm font-medium text-gray-600">{totalLabel}:</span>
            <span className="text-lg font-bold text-teal-700">{totalCount}</span>
          </div>

          {/* Extra counts (e.g. Paid, Not Paid) */}
          {counts.map((c, i) => (
            <div key={i} className="flex items-center space-x-2 bg-gray-50 px-4 py-2">
              <span className="text-sm font-medium text-gray-600">{c.label}:</span>
              <span className={`text-lg font-bold ${c.className ?? 'text-gray-800'}`}>
                {c.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}