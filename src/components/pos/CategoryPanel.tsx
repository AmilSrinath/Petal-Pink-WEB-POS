import React from 'react';
import { MainCategory } from './posTypes';

interface CategoryPanelProps {
  categories: MainCategory[];
  activeMain: string | null;
  activeSub: string | null;
  onSelectMain: (id: string) => void;
  onSelectSub: (id: string | null) => void;
}

// ─── CategoryPanel ──────────────────────────────────────────────────────────
// Two-level category navigation. Row 1 is the main categories; picking one
// reveals its sub-categories in row 2. Both rows scroll horizontally so the
// full category list stays reachable on a compact checkout screen.
export function CategoryPanel({ categories, activeMain, activeSub, onSelectMain, onSelectSub }: CategoryPanelProps) {
  const activeCategory = categories.find((c) => c.id === activeMain);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => {
            onSelectMain('');
            onSelectSub(null);
          }}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            !activeMain
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              onSelectMain(cat.id);
              onSelectSub(null);
            }}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeMain === cat.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {activeCategory && (
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => onSelectSub(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !activeSub
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            All {activeCategory.label}
          </button>
          {activeCategory.subCategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => onSelectSub(sub.id)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeSub === sub.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
