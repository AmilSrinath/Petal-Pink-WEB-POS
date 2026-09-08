import React, { useEffect, useState, useRef } from 'react';
import {
  SearchIcon,
  XIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  RefreshCwIcon,
} from 'lucide-react';

export interface CourierBag {
  itemId: number;
  itemBarCode: number;
  itemName: string;
  itemCodePrefix: string;
  subItemCategoryName: string;
  status: number;
}

// ─── Courier Bag Combobox ─────────────────────────────────────────────────────

interface CourierBagComboboxProps {
  bags: CourierBag[];
  selectedId: number | null;
  onChange: (bag: CourierBag | null) => void;
  isLoading: boolean;
}

const BAG_SIZE_META: Record<string, { emoji: string; color: string; border: string; dot: string }> = {
  small:  { emoji: '🟡', color: 'bg-amber-50 text-amber-800',   border: 'border-amber-300',  dot: 'bg-amber-400' },
  medium: { emoji: '🔵', color: 'bg-blue-50 text-blue-800',     border: 'border-blue-300',   dot: 'bg-blue-400' },
  large:  { emoji: '🟢', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-400' },
};

const getBagMeta = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('small'))  return BAG_SIZE_META.small;
  if (lower.includes('medium')) return BAG_SIZE_META.medium;
  if (lower.includes('large'))  return BAG_SIZE_META.large;
  return { emoji: '📦', color: 'bg-gray-50 text-gray-700', border: 'border-gray-300', dot: 'bg-gray-400' };
};

export const CourierBagCombobox = ({ bags, selectedId, onChange, isLoading }: CourierBagComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedBag = bags.find(b => b.itemId === selectedId) ?? null;

  const filtered = search.trim()
    ? bags.filter(b => b.itemName.toLowerCase().includes(search.toLowerCase()))
    : bags;

  const open = () => {
    setIsOpen(true);
    setSearch('');
    setHighlightedIdx(0);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const close = () => {
    setIsOpen(false);
    setSearch('');
  };

  const select = (bag: CourierBag | null) => {
    onChange(bag);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIdx === 0) select(null);
      else if (filtered[highlightedIdx - 1]) select(filtered[highlightedIdx - 1]);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlightedIdx] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIdx]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-9 items-center gap-2 text-xs text-gray-500">
        <RefreshCwIcon className="h-3.5 w-3.5 animate-spin text-teal-500" />
        Loading bags…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => isOpen ? close() : open()}
        className={`flex h-9 w-full items-center gap-2 rounded-md border px-3 text-sm transition-all bg-white
          ${isOpen
            ? 'border-teal-500 ring-1 ring-teal-500'
            : selectedBag
              ? `border-teal-300 ${getBagMeta(selectedBag.itemName).color}`
              : 'border-gray-300 text-gray-500 hover:border-gray-400'
          }`}
      >
        {selectedBag ? (
          <>
            <span className="text-base leading-none">{getBagMeta(selectedBag.itemName).emoji}</span>
            <span className="flex-1 text-left text-xs font-semibold truncate">{selectedBag.itemName}</span>
            <span className="text-xs font-mono text-gray-400 shrink-0">{selectedBag.itemCodePrefix}</span>
          </>
        ) : (
          <>
            <ShoppingBagIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-left text-gray-400">Select courier bag…</span>
          </>
        )}
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {selectedBag && !isOpen && (
        <div className={`mt-1.5 flex items-center justify-between rounded-lg border px-3 py-2 ${getBagMeta(selectedBag.itemName).border} ${getBagMeta(selectedBag.itemName).color}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${getBagMeta(selectedBag.itemName).dot}`} />
            <span className="text-xs font-semibold truncate">{selectedBag.itemName}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); select(null); }}
            className="ml-2 shrink-0 rounded-full p-0.5 hover:bg-black/10 transition-colors"
            title="Clear selection"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="border-b border-gray-100 p-2">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5">
              <SearchIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setHighlightedIdx(0); }}
                placeholder="Search bags…"
                className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => { setSearch(''); setHighlightedIdx(0); }} className="text-gray-400 hover:text-gray-600">
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <ul ref={listRef} className="max-h-52 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => select(null)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors
                  ${highlightedIdx === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                onMouseEnter={() => setHighlightedIdx(0)}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-gray-300 text-gray-400">
                  <XIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-gray-500 italic">No bag selected</span>
                {selectedId === null && <CheckCircleIcon className="ml-auto h-4 w-4 text-teal-500" />}
              </button>
            </li>

            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-gray-400">No bags match your search.</li>
            )}

            {filtered.map((bag, idx) => {
              const meta = getBagMeta(bag.itemName);
              const isHighlighted = highlightedIdx === idx + 1;
              const isSelected = selectedId === bag.itemId;
              return (
                <li key={bag.itemId}>
                  <button
                    type="button"
                    onClick={() => select(bag)}
                    onMouseEnter={() => setHighlightedIdx(idx + 1)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors
                      ${isHighlighted ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-lg ${meta.border} ${meta.color}`}>
                      {meta.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-teal-700' : 'text-gray-800'}`}>
                          {bag.itemName}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Code: <span className="font-mono font-medium text-gray-500">{bag.itemCodePrefix}</span>
                      </div>
                    </div>
                    {isSelected && <CheckCircleIcon className="h-4 w-4 text-teal-500 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5">
            <p className="text-[10px] text-gray-400">↑↓ navigate · Enter select · Esc close</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierBagCombobox;
