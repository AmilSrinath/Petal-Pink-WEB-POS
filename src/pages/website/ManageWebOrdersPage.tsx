import React, { useState, useEffect, useCallback } from 'react';
import {
  SearchIcon,
  RefreshCwIcon,
  XIcon,
  TruckIcon,
  PackageIcon,
  ChevronRightIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { orderApi, WsOrder, WsOrderDetails, WsOrderItem } from '../../services/websiteService';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

const STATUS_STYLES: Record<string, string> = {
  Pending:   'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Shipped:   'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

// ─── Component ────────────────────────────────────────────────────────────────

export function ManageWebOrdersPage() {
  const [orders, setOrders]           = useState<WsOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  // Detail modal
  const [selectedOrder, setSelectedOrder]   = useState<WsOrderDetails | null>(null);
  const [selectedItems, setSelectedItems]   = useState<WsOrderItem[]>([]);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [detailError, setDetailError]       = useState<string | null>(null);

  // Status update
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus]           = useState<string>('');

  // Tracking number
  const [trackingInput, setTrackingInput]   = useState('');
  const [trackingUpdating, setTrackingUpdating] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getAll();
      setOrders(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openOrderDetail = async (orderId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedOrder(null);
    setSelectedItems([]);
    try {
      const res = await orderApi.getDetails(orderId);
      setSelectedOrder(res.order as WsOrderDetails);
      setSelectedItems(res.items);
      setNewStatus(res.order.orderStatus);
      setTrackingInput(res.order.trackingNumber ?? '');
    } catch (e: any) {
      setDetailError(e.message ?? 'Failed to load order details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    setStatusUpdating(true);
    try {
      await orderApi.updateStatus(selectedOrder.orderId, newStatus);
      setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      // Refresh list
      setOrders(prev =>
        prev.map(o => o.orderId === selectedOrder.orderId ? { ...o, orderStatus: newStatus } : o)
      );
    } catch (e: any) {
      alert('Status update failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleTrackingUpdate = async () => {
    if (!selectedOrder) return;
    setTrackingUpdating(true);
    try {
      await orderApi.updateTracking(selectedOrder.orderId, trackingInput);
      setSelectedOrder({ ...selectedOrder, trackingNumber: trackingInput });
    } catch (e: any) {
      alert('Tracking update failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setTrackingUpdating(false);
    }
  };

  // ─── Filtering ──────────────────────────────────────────────────────────────

  const filtered = orders.filter(o => {
    const matchSearch = o.orderId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' ||
      o.orderStatus?.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const countByStatus = (s: OrderStatus) =>
    orders.filter(o => o.orderStatus?.toLowerCase() === s.toLowerCase()).length;

  // Show Size / Color columns only when the order contains a Clothing product
  const hasClothingItem = selectedItems.some(
    item => item.mainCategoryName?.toLowerCase() === 'clothing'
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Orders placed via petalpink.lk · Order type: <span className="font-medium text-teal-600">Website</span>
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Status summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_OPTIONS.map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
            className={`rounded-lg p-3 text-left transition-all ${
              filterStatus === status
                ? (STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700') + ' ring-2 ring-offset-1 ring-current'
                : 'bg-white border border-gray-200 hover:shadow-sm'
            }`}
          >
            <p className="text-lg font-bold">{countByStatus(status)}</p>
            <p className="text-xs font-medium mt-0.5">{status}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading orders…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-right">Sub Total (LKR)</th>
                <th className="px-4 py-3 text-right">Delivery (LKR)</th>
                <th className="px-4 py-3 text-right">Total (LKR)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Tracking</th>
                <th className="px-4 py-3 text-center">Sales Page</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => (
                <tr
                  key={order.orderId}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openOrderDetail(order.orderId)}
                >
                  <td className="px-4 py-3 font-mono font-medium text-teal-600">{order.orderId}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {order.createdDate ? new Date(order.createdDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{order.payment ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {order.subTotal?.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {order.delivery?.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {order.total?.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.orderStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.orderStatus ?? 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {order.trackingNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {order.deliveryOrderId ? (
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                        Synced
                      </span>
                    ) : (
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                        Not synced
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <ChevronRightIcon className="h-4 w-4" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Order Detail Modal ──────────────────────────────────────────────── */}
      {(detailLoading || selectedOrder || detailError) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-10 px-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl mb-10">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Order Details
                {selectedOrder && (
                  <span className="ml-2 font-mono text-teal-600 text-base">{selectedOrder.orderId}</span>
                )}
              </h2>
              <button
                onClick={() => { setSelectedOrder(null); setSelectedItems([]); setDetailError(null); }}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <XIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {detailLoading && (
              <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
            )}

            {detailError && (
              <div className="m-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {detailError}
              </div>
            )}

            {selectedOrder && (
              <div className="px-6 py-4 space-y-6">

                {/* Customer info */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <InfoRow label="Name"    value={`${selectedOrder.firstName} ${selectedOrder.lastName}`} />
                    <InfoRow label="Phone"   value={selectedOrder.phone1} />
                    <InfoRow label="Email"   value={selectedOrder.email} />
                    <InfoRow label="Phone 2" value={selectedOrder.phone2 || '—'} />
                    <InfoRow label="Address" value={[selectedOrder.address1, selectedOrder.address2, selectedOrder.city, selectedOrder.province, selectedOrder.country].filter(Boolean).join(', ')} />
                  </div>
                </section>

                {/* Order summary */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Order Summary</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <InfoRow label="Payment Method" value={selectedOrder.payment} />
                    <InfoRow label="Date"           value={new Date(selectedOrder.createdDate).toLocaleString()} />
                    <InfoRow label="Sub Total"      value={`LKR ${selectedOrder.subTotal?.toLocaleString()}`} />
                    <InfoRow label="Delivery Fee"   value={`LKR ${selectedOrder.delivery?.toLocaleString()}`} />
                    <InfoRow label="Total"          value={`LKR ${selectedOrder.total?.toLocaleString()}`} bold />
                  </div>
                </section>

                {/* Items */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                    <PackageIcon className="h-3.5 w-3.5" /> Items
                  </h3>
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Product</th>
                          {hasClothingItem && <th className="px-3 py-2 text-left">Size</th>}
                          {hasClothingItem && <th className="px-3 py-2 text-left">Color</th>}
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Unit Price</th>
                          <th className="px-3 py-2 text-right">Sub Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedItems.map((item, i) => {
                          const isClothing = item.mainCategoryName?.toLowerCase() === 'clothing';
                          return (
                            <tr key={i}>
                              <td className="px-3 py-2 font-medium text-gray-800">{item.productName}</td>
                              {hasClothingItem && (
                                <td className="px-3 py-2 text-gray-600">
                                  {isClothing ? (item.selectedSize || '—') : '—'}
                                </td>
                              )}
                              {hasClothingItem && (
                                <td className="px-3 py-2 text-gray-600">
                                  {isClothing ? (item.selectedColor || '—') : '—'}
                                </td>
                              )}
                              <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{item.price?.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-800">{item.subTotal?.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Status update */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Update Status</h3>
                  <div className="flex items-center gap-3">
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={statusUpdating || newStatus === selectedOrder.orderStatus}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {statusUpdating ? 'Saving…' : 'Update'}
                    </button>
                  </div>
                </section>

                {/* Tracking number */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                    <TruckIcon className="h-3.5 w-3.5" /> Tracking Number
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={e => setTrackingInput(e.target.value)}
                      placeholder="Enter tracking number…"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      onClick={handleTrackingUpdate}
                      disabled={trackingUpdating}
                      className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
                    >
                      {trackingUpdating ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </section>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helper component ───────────────────────────────────────────────────

function InfoRow({ label, value, bold }: { label: string; value?: string | null; bold?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-gray-800 ${bold ? 'font-bold text-base' : ''}`}>{value || '—'}</span>
    </div>
  );
}