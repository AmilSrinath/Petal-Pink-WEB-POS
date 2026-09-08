import React, { useRef } from 'react';
import { SearchIcon, XIcon, ScanLineIcon } from 'lucide-react';

interface BarcodeSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

// ─── BarcodeSearch ──────────────────────────────────────────────────────────
// Large, scanner-friendly search field. A handheld barcode scanner types the
// code followed by Enter, so submitting on Enter (in addition to a manual
// search) lets this field work with both a scanner and a keyboard/mouse.
export function BarcodeSearch({ value, onChange, onSubmit }: BarcodeSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
        <ScanLineIcon className="h-6 w-6" />
      </div>
      <input
        ref={inputRef}
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Scan Barcode or Search Product..."
        className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-14 pr-24 text-lg font-medium text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-100 transition-colors"
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        {value && (
          <button
            onClick={handleClear}
            title="Clear"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => value.trim() && onSubmit(value.trim())}
          title="Search"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
