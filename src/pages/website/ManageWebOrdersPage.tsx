import React, { useState } from 'react';
import { SearchIcon, RefreshCwIcon } from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface WebOrder {
  id: string;
  customerName: string;
  phone: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
  type: 'cosmetics' | 'fashion' | 'mixed';
}

const MOCK_ORDERS: WebOrder[] = [
  { id: 'WO-1001', customerName: 'Nimal Perera', phone: '071-234-5678', items: 3, total: 4850, status: 'pending', date: '2025-06-07', type: 'cosmetics' },
  { id: 'WO-1002', customerName: 'Kamala Silva', phone: '077-876-5432', items: 1, total: 3500, status: 'confirmed', date: '2025-06-07', type: 'fashion' },
  { id: 'WO-1003', customerName: 'Saman Fernando', phone: '076-543-2109', items: 5, total: 9200, status: 'shipped', date: '2025-06-06', type: 'mixed' },
  { id: 'WO-1004', customerName: 'Dilani Jayasinghe', phone: '070-111-2233', items: 2, total: 2700, status: 'delivered', date: '2025-06-05', type: 'cosmetics' },
  { id: 'WO-1005', customerName: 'Ruwan Bandara', phone: '075-667-8899', items: 1, total: 4200, status: 'cancelled', date: '2025-06-05', type: 'fashion' },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function ManageWebOrdersPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [orders] = useState<WebOrder[]>(MOCK_ORDERS);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Orders placed via petalpink.lk</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
          <RefreshCwIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Status summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
            className={`rounded-lg p-3 text-left transition-all ${
              filterStatus === status
                ? STATUS_STYLES[status] + ' ring-2 ring-offset-1 ring-current'
                : 'bg-white border border-gray-200 hover:shadow-sm'
            }`}
          >
            <p className="text-lg font-bold">{orders.filter(o => o.status === status).length}</p>
            <p className="text-xs capitalize font-medium mt-0.5">{status}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order ID or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3 text-right">Total (LKR)</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-3 font-mono font-medium text-teal-600">{order.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{order.customerName}</td>
                <td className="px-4 py-3 text-gray-600">{order.phone}</td>
                <td className="px-4 py-3 text-center text-gray-700">{order.items}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{order.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    order.type === 'cosmetics' ? 'bg-pink-100 text-pink-700'
                    : order.type === 'fashion' ? 'bg-purple-100 text-purple-700'
                    : 'bg-orange-100 text-orange-700'
                  }`}>
                    {order.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{order.date}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}