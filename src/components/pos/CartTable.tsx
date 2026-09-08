import React from 'react';
import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { CartItem } from './posTypes';

interface CartTableProps {
  items: CartItem[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

// ─── CartTable ──────────────────────────────────────────────────────────────
export function CartTable({ items, onIncrement, onDecrement, onRemove }: CartTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-gray-400">
        <p className="text-sm">Cart is empty</p>
        <p className="text-xs">Scan or tap a product to add it</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="py-2 text-left font-semibold">Product</th>
            <th className="py-2 text-center font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Price</th>
            <th className="py-2 text-right font-semibold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(({ product, qty }) => (
            <tr key={product.id}>
              <td className="py-2 pr-2 align-top">
                <p className="font-medium text-gray-800">{product.name}</p>
                <p className="text-xs text-gray-400">Rs. {product.price.toLocaleString()} each</p>
              </td>
              <td className="py-2 align-top">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onDecrement(product.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-800">{qty}</span>
                  <button
                    onClick={() => onIncrement(product.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                </div>
              </td>
              <td className="py-2 text-right align-top font-semibold text-gray-800">
                {(product.price * qty).toLocaleString()}
              </td>
              <td className="py-2 pl-2 text-right align-top">
                <button
                  onClick={() => onRemove(product.id)}
                  title="Remove"
                  className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
