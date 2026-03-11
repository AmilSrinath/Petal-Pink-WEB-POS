import React from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { Eye } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  items: number;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
}

const mockPOs: PurchaseOrder[] = [
  { id: '1', poNumber: 'PO-001', supplier: 'Fresh Supplies Ltd', orderDate: '2024-01-10', expectedDelivery: '2024-01-15', items: 5, totalAmount: 5500, status: 'Confirmed' },
  { id: '2', poNumber: 'PO-002', supplier: 'Quick Distributors', orderDate: '2024-01-12', expectedDelivery: '2024-01-18', items: 3, totalAmount: 3200, status: 'Pending' },
  { id: '3', poNumber: 'PO-003', supplier: 'Premium Foods Inc', orderDate: '2024-01-08', expectedDelivery: '2024-01-12', items: 8, totalAmount: 8900, status: 'Delivered' },
  { id: '4', poNumber: 'PO-004', supplier: 'Quality Imports', orderDate: '2024-01-14', expectedDelivery: '2024-01-20', items: 4, totalAmount: 6750, status: 'Pending' },
  { id: '5', poNumber: 'PO-005', supplier: 'Fresh Supplies Ltd', orderDate: '2024-01-06', expectedDelivery: '2024-01-10', items: 6, totalAmount: 4200, status: 'Delivered' },
];

export function PurchaseOrderListPage() {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || '';
  };

  const columns: Column<PurchaseOrder>[] = [
    { header: 'PO Number', accessor: 'poNumber' },
    { header: 'Supplier', accessor: 'supplier' },
    { header: 'Order Date', accessor: 'orderDate' },
    { header: 'Expected Delivery', accessor: 'expectedDelivery' },
    { header: 'Items', accessor: 'items' },
    { header: 'Total Amount', accessor: (row) => `₹${row.totalAmount.toFixed(2)}` },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(row.status)}`}>
        {row.status}
      </span>
    )},
    { header: 'Actions', accessor: () => (
      <button className="text-blue-600 hover:text-blue-800"><EyeIcon className="h-4 w-4" /></button>
    )},
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
        <DataTable columns={columns} data={mockPOs} />
      </div>
    </div>
  );
}

function EyeIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
