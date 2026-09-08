import React from 'react';
import { PackageIcon, PlusIcon } from 'lucide-react';
import { Product } from './posTypes';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

// ─── ProductCard ────────────────────────────────────────────────────────────
export function ProductCard({ product, onAdd }: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <button
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div
        className="flex h-24 items-center justify-center"
        style={{ backgroundColor: `${product.color}1a` }}
      >
        <PackageIcon className="h-10 w-10" style={{ color: product.color }} />
      </div>

      <span
        className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          outOfStock
            ? 'bg-red-100 text-red-600'
            : lowStock
            ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'
        }`}
      >
        {outOfStock ? 'Out of stock' : `Stock: ${product.stock}`}
      </span>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-gray-800">{product.name}</p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-base font-bold text-green-700">Rs. {product.price.toLocaleString()}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white transition-colors group-hover:bg-green-700">
            <PlusIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}
