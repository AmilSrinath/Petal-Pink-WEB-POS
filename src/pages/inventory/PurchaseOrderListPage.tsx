import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { api } from './Integratedpages';

export function PurchaseOrderListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPurchaseOrders()
      .then(data => setOrders(data))
      .catch(() => setError('Failed to load purchase orders'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: number) => {
    const colors: Record<number, string> = {
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      0: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: number) => {
    const labels: Record<number, string> = { 0: 'Cancelled', 1: 'Pending', 2: 'Confirmed', 3: 'Delivered' };
    return labels[status] || 'Unknown';
  };

  const columns: Column<any>[] = [
    { header: 'PO Code', accessor: (row) => row.poCodePrefix ? `${row.poCodePrefix}-${row.poCode}` : `PO-${row.poId}` },
    { header: 'Supplier', accessor: 'supplierName' },
    { header: 'Order Date', accessor: 'poDate' },
    { header: 'Expected Delivery', accessor: 'expectedDate' },
    { header: 'Total', accessor: (row) => `Rs. ${row.totalPrice?.toFixed(2) ?? '0.00'}` },
    { header: 'Payment Type', accessor: (row) => row.paymentType === 1 ? 'Cash' : row.paymentType === 2 ? 'Credit' : '-' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(row.status)}`}>
        {getStatusLabel(row.status)}
      </span>
    )},
  ];

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500">Loading purchase orders...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
        <DataTable columns={columns} data={orders} />
      </div>
    </div>
  );
}