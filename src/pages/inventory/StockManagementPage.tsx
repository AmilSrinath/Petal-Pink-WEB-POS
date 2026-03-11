import React from 'react';
import { DataTable, Column } from '../../components/DataTable';

interface Stock {
  id: string;
  sku: string;
  itemName: string;
  warehouse: string;
  currentStock: number;
  reorderLevel: number;
  status: 'Optimal' | 'Low' | 'Critical' | 'Overstock';
  lastUpdated: string;
}

const mockStocks: Stock[] = [
  { id: '1', sku: 'SKU-001', itemName: 'Coca Cola 500ml', warehouse: 'Warehouse A', currentStock: 250, reorderLevel: 100, status: 'Optimal', lastUpdated: '2024-01-18' },
  { id: '2', sku: 'SKU-002', itemName: 'Orange Juice 1L', warehouse: 'Warehouse A', currentStock: 45, reorderLevel: 80, status: 'Critical', lastUpdated: '2024-01-18' },
  { id: '3', sku: 'SKU-003', itemName: 'Parle G Biscuits', warehouse: 'Warehouse B', currentStock: 500, reorderLevel: 200, status: 'Overstock', lastUpdated: '2024-01-17' },
  { id: '4', sku: 'SKU-004', itemName: 'Lays Chips 30g', warehouse: 'Warehouse B', currentStock: 75, reorderLevel: 100, status: 'Low', lastUpdated: '2024-01-18' },
  { id: '5', sku: 'SKU-005', itemName: 'Amul Milk 500ml', warehouse: 'Warehouse C', currentStock: 180, reorderLevel: 100, status: 'Optimal', lastUpdated: '2024-01-18' },
];

export function StockManagementPage() {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Optimal': 'bg-green-100 text-green-800',
      'Low': 'bg-yellow-100 text-yellow-800',
      'Critical': 'bg-red-100 text-red-800',
      'Overstock': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || '';
  };

  const columns: Column<Stock>[] = [
    { header: 'SKU', accessor: 'sku' },
    { header: 'Item Name', accessor: 'itemName' },
    { header: 'Warehouse', accessor: 'warehouse' },
    { header: 'Current Stock', accessor: 'currentStock' },
    { header: 'Reorder Level', accessor: 'reorderLevel' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(row.status)}`}>
        {row.status}
      </span>
    )},
    { header: 'Last Updated', accessor: 'lastUpdated' },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="text-2xl font-bold text-green-700">4</div>
            <p className="text-sm text-green-600">Optimal Stock</p>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="text-2xl font-bold text-yellow-700">1</div>
            <p className="text-sm text-yellow-600">Low Stock</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-2xl font-bold text-red-700">1</div>
            <p className="text-sm text-red-600">Critical Stock</p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="text-2xl font-bold text-purple-700">1</div>
            <p className="text-sm text-purple-600">Overstock</p>
          </div>
        </div>

        <DataTable columns={columns} data={mockStocks} />
      </div>
    </div>
  );
}
