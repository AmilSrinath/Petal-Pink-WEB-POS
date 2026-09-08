import React from 'react';
import { QtyToggleValue } from './posTypes';

interface QuantityTogglePanelProps {
  selected: QtyToggleValue;
  customQty: number;
  onSelect: (value: QtyToggleValue) => void;
}

const PRESETS: QtyToggleValue[] = [1, 2, 3, 4];

// ─── QuantityTogglePanel ────────────────────────────────────────────────────
// Exactly one of these 5 buttons is active at a time. Whatever is active is
// the quantity that gets applied automatically the next time a product is
// clicked in the grid.
export function QuantityTogglePanel({ selected, customQty, onSelect }: QuantityTogglePanelProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Qty</span>
      {PRESETS.map((qty) => (
        <button
          key={qty}
          onClick={() => onSelect(qty)}
          className={`h-11 w-11 rounded-xl text-base font-bold transition-colors ${
            selected === qty
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {qty}
        </button>
      ))}
      <button
        onClick={() => onSelect('custom')}
        className={`h-11 rounded-xl px-4 text-sm font-bold transition-colors ${
          selected === 'custom'
            ? 'bg-green-600 text-white shadow-sm'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {selected === 'custom' ? `Qty: ${customQty}` : 'Enter Qty'}
      </button>
    </div>
  );
}
