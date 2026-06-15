import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  DollarSignIcon,
  TruckIcon,
  HelpCircleIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  PackageIcon,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const API_BASE = `${API_BASE_URL}/api`;

const STATUS_STYLES = {
  Completed:  'bg-green-100 text-green-800',
  Delivered:  'bg-green-100 text-green-800',
  Pending:    'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Active:     'bg-blue-100 text-blue-800',
  Wrapping:   'bg-purple-100 text-purple-800',
  Despatch:   'bg-indigo-100 text-indigo-800',
  Return:     'bg-red-100 text-red-800',
  Cancel:     'bg-gray-100 text-gray-600',
};
const statusStyle = (s) => STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-600';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const fmtDate = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Returns { label, startDate, endDate } for a given month offset (0 = this month, -1 = last, -2 = before)
function getMonthRange(offset) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0);
  const label = start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const toISO = (d) => d.toISOString().split('T')[0];
  return { label, startDate: toISO(start), endDate: toISO(end) };
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} aria-hidden="true" />;
}

function KpiCard({ name, value, icon: Icon, color, loading, error }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{name}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-28" />
          ) : error ? (
            <p className="mt-2 text-sm text-red-500">Failed to load</p>
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 h-4" />
    </div>
  );
}

// ── Today's Item Sale Count Panel ─────────────────────────────────────────────
function TodayItemSalesPanel({ items, loading, error }) {
  const totalUnits = items.reduce((sum, r) => sum + (r.totalQuantitySold ?? 0), 0);
  const maxQty     = items.length > 0 ? items[0].totalQuantitySold : 1; // items sorted DESC

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-teal-500" />
            <h3 className="text-lg font-medium text-gray-900">Today's Item Sales</h3>
            {!loading && !error && items.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {!loading && !error && totalUnits > 0 && (
            <span className="text-sm font-semibold text-teal-600">
              {totalUnits} units sold
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {error ? (
          <div className="px-6 py-10 text-center text-sm text-red-500">
            Failed to load: {error}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  {['#', 'Item Name', 'Qty Sold', 'Revenue'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {[1, 2, 3, 4].map((j) => (
                          <td key={j} className="px-6 py-4">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : items.length === 0
                  ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                        No items sold today yet.
                      </td>
                    </tr>
                  )
                  : items.map((row, index) => {
                      const barWidth = maxQty > 0
                        ? Math.round((row.totalQuantitySold / maxQty) * 100)
                        : 0;
                      return (
                        <tr key={row.itemId ?? index} className="hover:bg-teal-50/30 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400 w-8">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[200px]">
                            <span className="block truncate" title={row.itemName}>
                              {row.itemName ?? '—'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <span className="w-8 text-right font-semibold text-teal-700">
                                {row.totalQuantitySold}
                              </span>
                              {/* Mini progress bar */}
                              <div className="h-2 w-20 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-teal-400 transition-all"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-800">
                            {row.totalItemRevenue != null ? fmt(row.totalItemRevenue) : '—'}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && !error && items.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-2 text-xs text-gray-400">
          Showing {items.length} item{items.length !== 1 ? 's' : ''} sold today
        </div>
      )}
    </div>
  );
}

// ── Unpaid Payments Panel ─────────────────────────────────────────────────────
function UnpaidPaymentsPanel() {
  const months = [0, -1, -2].map((offset) => getMonthRange(offset));
  const [activeTab, setActiveTab] = useState(0);

  const [data, setData]       = useState([[], [], []]);
  const [loading, setLoading] = useState([true, true, true]);
  const [errors, setErrors]   = useState([null, null, null]);

  const fetchMonth = async (index) => {
    const { startDate, endDate } = months[index];
    try {
      const res = await fetch(
        `${API_BASE}/payments/not-paid?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData((prev) => { const n = [...prev]; n[index] = json; return n; });
    } catch (err) {
      setErrors((prev) => { const n = [...prev]; n[index] = err.message; return n; });
    } finally {
      setLoading((prev) => { const n = [...prev]; n[index] = false; return n; });
    }
  };

  useEffect(() => {
    months.forEach((_, i) => fetchMonth(i));
  }, []);

  const rows    = data[activeTab]   ?? [];
  const isLoad  = loading[activeTab];
  const isError = errors[activeTab];

  const totalUnpaid = rows.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium text-gray-900">Not Paid</h3>
            {!isLoad && !isError && rows.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                {rows.length}
              </span>
            )}
          </div>
          {!isLoad && !isError && rows.length > 0 && (
            <span className="text-sm font-semibold text-red-600">{fmt(totalUnpaid)}</span>
          )}
        </div>

        {/* Month tabs */}
        <div className="mt-3 flex gap-1">
          {months.map(({ label }, i) => {
            const tabRows = data[i] ?? [];
            const tabLoading = loading[i];
            return (
              <button
                key={label}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === i
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {i === 0 ? 'This Month' : i === 1 ? 'Last Month' : label.split(' ')[0]}
                {!tabLoading && tabRows.length > 0 && (
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none ${
                    activeTab === i ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600'
                  }`}>
                    {tabRows.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        {isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-500">
            Failed to load: {isError}
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  {['Tracking', 'Customer No', 'Total Amount'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoad
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {[1, 2, 3].map((j) => (
                          <td key={j} className="px-6 py-4">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.length === 0
                  ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-400">
                        No unpaid payments for this period.
                      </td>
                    </tr>
                  )
                  : rows.map((row, i) => (
                      <tr key={row.paymentId ?? i} className="hover:bg-red-50/40 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {row.orderCode ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {row.customerNumber ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-red-600">
                          {row.totalAmount != null ? fmt(row.totalAmount) : '—'}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!isLoad && !isError && rows.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-2 text-xs text-gray-400">
          Showing {rows.length} unpaid record{rows.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [summary, setSummary]               = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError]     = useState(null);

  const [orders, setOrders]               = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError]     = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      setSummaryError(null);
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSummary(await res.json());
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersError(null);
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(
        `${API_BASE}/sales/delivery-orders?startDate=${today}&endDate=${today}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders([...data].reverse().slice(0, 5));
    } catch (err) {
      setOrdersError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const statusLabel = (statusId) => {
    const map = {
      1: 'Active', 2: 'Pending', 3: 'Wrapping', 4: 'Despatch',
      5: 'Delivered', 6: 'Return', 7: 'Cancel', 10: 'Delivered',
      12: 'Returning', 13: 'Checking', 14: 'Returned', 15: 'Cancel',
    };
    return map[statusId] ?? `Status ${statusId}`;
  };

  useEffect(() => {
    fetchSummary();
    fetchOrders();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSummaryLoading(true);
    setOrdersLoading(true);
    await Promise.all([fetchSummary(), fetchOrders()]);
    setRefreshing(false);
  };

  // Item sale counts come embedded in the summary response
  const itemSaleCounts = summary?.todayItemSaleCounts ?? [];

  const stats = [
    {
      name: "Today's Orders",
      value: summary?.todayOrdersCount ?? '—',
      icon: ShoppingCartIcon,
      color: 'bg-teal-50 text-teal-600',
      loading: summaryLoading,
      error: summaryError,
    },
    {
      name: 'Total Revenue',
      value: summary ? fmt(summary.todayRevenue) : '—',
      icon: DollarSignIcon,
      color: 'bg-emerald-50 text-emerald-600',
      loading: summaryLoading,
      error: summaryError,
    },
    {
      name: 'Pending Deliveries',
      value: summary?.pendingDeliveriesCount ?? '—',
      icon: TruckIcon,
      color: 'bg-amber-50 text-amber-600',
      loading: summaryLoading,
      error: summaryError,
    },
    {
      name: 'Active Inquiries',
      value: summary?.activeInquiriesCount ?? '—',
      icon: HelpCircleIcon,
      color: 'bg-rose-50 text-rose-500',
      loading: summaryLoading,
      error: summaryError,
    },
  ];

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCwIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <KpiCard key={stat.name} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Today's Orders Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900">Today's Orders</h3>
          </div>
          <div className="overflow-x-auto">
            {ordersError ? (
              <div className="px-6 py-10 text-center text-sm text-red-500">
                Failed to load orders: {ordersError}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order Code', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {ordersLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <Skeleton className="h-4 w-full" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : orders.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                          No orders found for today.
                        </td>
                      </tr>
                    )
                    : orders.map((order) => {
                        const label = statusLabel(order.statusId);
                        return (
                          <tr key={order.deliveryId} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-teal-600">
                              {order.orderCode || `-`}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {order.customerName ?? '—'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {order.totalOrderPrice != null ? fmt(order.totalOrderPrice) : '—'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusStyle(label)}`}>
                                {label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {fmtDate(order.createdDate)}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Unpaid Payments Panel */}
        <UnpaidPaymentsPanel />

      </div>

      {/* ── Today's Item Sale Counts (full width) ───────────────────────────── */}
      <TodayItemSalesPanel
        items={itemSaleCounts}
        loading={summaryLoading}
        error={summaryError}
      />

    </div>
  );
}