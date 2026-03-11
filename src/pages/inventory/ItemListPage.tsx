import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { EditIcon, TrashIcon } from 'lucide-react';

interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitType: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
}

const mockItems: Item[] = [
  { id: '1', sku: 'SKU-001', name: 'Coca Cola 500ml', category: 'Soft Drinks', unitType: 'Piece', costPrice: 20, sellingPrice: 35, currentStock: 150, reorderLevel: 50 },
  { id: '2', sku: 'SKU-002', name: 'Orange Juice 1L', category: 'Juices', unitType: 'Piece', costPrice: 45, sellingPrice: 65, currentStock: 80, reorderLevel: 30 },
  { id: '3', sku: 'SKU-003', name: 'Parle G Biscuits', category: 'Biscuits', unitType: 'Pack', costPrice: 15, sellingPrice: 25, currentStock: 200, reorderLevel: 100 },
  { id: '4', sku: 'SKU-004', name: 'Lays Chips 30g', category: 'Chips', unitType: 'Pack', costPrice: 10, sellingPrice: 20, currentStock: 120, reorderLevel: 60 },
  { id: '5', sku: 'SKU-005', name: 'Amul Milk 500ml', category: 'Dairy', unitType: 'Piece', costPrice: 30, sellingPrice: 45, currentStock: 90, reorderLevel: 40 },
  { id: '6', sku: 'SKU-006', name: 'Sprite 500ml', category: 'Soft Drinks', unitType: 'Piece', costPrice: 20, sellingPrice: 35, currentStock: 110, reorderLevel: 50 },
  { id: '7', sku: 'SKU-007', name: 'Britannia Cake', category: 'Biscuits', unitType: 'Pack', costPrice: 25, sellingPrice: 40, currentStock: 75, reorderLevel: 40 },
  { id: '8', sku: 'SKU-008', name: 'Doritos 40g', category: 'Chips', unitType: 'Pack', costPrice: 15, sellingPrice: 30, currentStock: 60, reorderLevel: 30 },
];

export function ItemListPage() {
  const [items, setItems] = useState(mockItems);
  const [filterCategory, setFilterCategory] = useState('All');

  const filteredItems = filterCategory === 'All' 
    ? items 
    : items.filter(item => item.category === filterCategory);

  const columns: Column<Item>[] = [
    { header: 'SKU', accessor: 'sku' },
    { header: 'Item Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Unit', accessor: 'unitType' },
    { header: 'Cost Price', accessor: (row) => `₹${row.costPrice.toFixed(2)}` },
    { header: 'Selling Price', accessor: (row) => `₹${row.sellingPrice.toFixed(2)}` },
    { header: 'Current Stock', accessor: (row) => (
      <span className={row.currentStock <= row.reorderLevel ? 'text-red-600 font-semibold' : ''}>
        {row.currentStock}
      </span>
    )},
    { header: 'Reorder Level', accessor: 'reorderLevel' },
    { header: 'Actions', accessor: () => (
      <div className="flex gap-2">
        <button className="text-blue-600 hover:text-blue-800"><EditIcon className="h-4 w-4" /></button>
        <button className="text-red-600 hover:text-red-800"><TrashIcon className="h-4 w-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Item List</h2>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option>All</option>
            <option>Soft Drinks</option>
            <option>Juices</option>
            <option>Biscuits</option>
            <option>Chips</option>
            <option>Dairy</option>
          </select>
        </div>

        <div className="rounded-lg bg-white shadow-sm">
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Items with stock below reorder level are highlighted in red.
            </p>
          </div>
        </div>

        <DataTable columns={columns} data={filteredItems} emptyMessage="No items found" />
      </div>
    </div>
  );
}
