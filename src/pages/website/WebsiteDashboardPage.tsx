import React, { useEffect, useState } from 'react';
import {
  ShoppingBagIcon,
  UsersIcon,
  DollarSignIcon,
  ClockIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  PackageIcon,
} from 'lucide-react';
import {
  fetchWebsiteDashboard,
  orderApi,
  WsDashboard,
  WsOrder,
} from '../../services/websiteService';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_STYLES: Record<string, string> = {
  Pending:    'bg-yellow-100 text-yellow-800',
  Confirmed:  'bg-blue-100 text-blue-800',
  Shipped:    'bg-purple-100 text-purple-800',
  Delivered:  'bg-green-100 text-green-800',
  Cancel:     'bg-red-100 text-red-600',
};
const statusStyle = (s: string) => STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-600';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n ?? 0);
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function KpiCard({
  label, value, icon: Icon, color, loading,
}: { label: string; value: string; icon: React.ElementType; color: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-28" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`h-11 w-11 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function WebsiteDashboardPage() {
  const [data, setData]       = useState<WsDashboard | null>(null);
  const [orders, setOrders]   = useState<WsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, allOrders] = await Promise.all([
        fetchWebsiteDashboard(),
        orderApi.getAll(),
      ]);
      setData(dash);
      // Show last 10 orders sorted newest first
      const sorted = [...(allOrders as WsOrder[])].sort(
        (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );
      setOrders(sorted.slice(0, 10));
    } catch (e: any) {
      setError(e.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Bar chart: max value for scale
  const maxSales = data ? Math.max(...data.monthlySales, 1) : 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live overview of petalpink.lk</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Orders"
          value={data ? data.totalOrders.toLocaleString() : '—'}
          icon={ShoppingBagIcon}
          color="bg-teal-100 text-teal-700"
          loading={loading}
        />
        <KpiCard
          label="Total Customers"
          value={data ? data.totalCustomers.toLocaleString() : '—'}
          icon={UsersIcon}
          color="bg-blue-100 text-blue-700"
          loading={loading}
        />
        <KpiCard
          label="Today's Sales"
          value={data ? fmt(data.todaySales) : '—'}
          icon={DollarSignIcon}
          color="bg-green-100 text-green-700"
          loading={loading}
        />
        <KpiCard
          label="Pending Orders"
          value={data ? data.pendingOrders.toLocaleString() : '—'}
          icon={ClockIcon}
          color="bg-yellow-100 text-yellow-700"
          loading={loading}
        />
      </div>

      {/* Monthly Sales Bar Chart */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5 text-teal-600" />
          <h2 className="font-semibold text-gray-800">Monthly Sales — {new Date().getFullYear()}</h2>
        </div>
        {loading ? (
          <Skeleton className="h-36 w-full" />
        ) : (
          <div className="flex items-end gap-1.5 h-36">
            {MONTH_LABELS.map((month, i) => {
              const val = data?.monthlySales[i] ?? 0;
              const pct = Math.round((val / maxSales) * 100);
              const isCurrentMonth = i === new Date().getMonth();
              return (
                <div key={month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
                    <div
                      title={`${month}: ${fmt(val)}`}
                      className={`w-full rounded-t-md transition-all cursor-default ${
                        isCurrentMonth ? 'bg-teal-500' : 'bg-teal-200 hover:bg-teal-300'
                      }`}
                      style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{month}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <PackageIcon className="h-5 w-5 text-teal-600" />
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-teal-600">{o.orderId}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{o.payment}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(o.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(o.orderStatus)}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(o.createdDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-gray-400">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}