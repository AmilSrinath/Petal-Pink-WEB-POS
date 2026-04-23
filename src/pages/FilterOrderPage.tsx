import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import {
  PrinterIcon,
  CheckCircle,
  XCircle,
  Loader2,
  PencilIcon,
  ClockIcon,
  PackageIcon,
  SendIcon,
  CheckCircleIcon,
  RotateCcwIcon,
  XCircleIcon,
  AlertCircleIcon,
  FileTextIcon,
  RefreshCwIcon,
  XIcon,
  EyeIcon,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Order {
  orderId: number;
  customerId: number;
  billNo: string;
  subTotalPrice: number;
  totalDiscountPrice: number | null;
  deliveryFee: number;
  totalOrderPrice: number;
  paymentTypeId: number;
  createdDate: string;
  statusId: number;
  paidAmount: number;
  customerName: string;
  address: string;
  phoneOne: string;
  phoneTwo: string;
  customerNumber: string;
  remark: string;
  orderType: string | null;
  deliveryId?: number;
  weight?: string | null;
  orderCode?: string;
}

interface PaymentType {
  paymentTypeId: number;
  paymentType: string;
}

interface StatusType {
  statusId: number;
  statusType: string;
}

interface OrderType {
  id: number;
  type: string;
}

interface FilterValues {
  orderCode: string;
  customerCode: string;
  from: string;
  to: string;
  paymentType: string;
  status: string;
  orderType: string;
}

type ToastType = 'success' | 'error' | 'loading';

interface Toast {
  type: ToastType;
  message: string;
}

// ─── Shared shape expected by OrderActionModal ────────────────────────────────

interface ModalOrder {
  deliveryId: number;
  orderId: number;
  orderCode: string;
  customerName: string;
  phoneOne: string;
  phoneTwo: string;
  cod: number;
  totalAmount: number;
  orderType: string;
  date: string;
  statusId: number;
}

interface StatusTypeOption {
  statusId: number;
  statusType: string;
}

// ─── Order detail item (for view modal) ──────────────────────────────────────

interface OrderDetailItem {
  orderDetailId: number;
  itemId: number;
  itemName: string;
  itemBarCode: number | null;
  unitTypeId: number | null;
  printerTypeId: number | null;
  quantity: number;
  perItemPrice: number;
  totalDiscountPrice: number;
  totalItemPrice: number;
  remark: string;
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

const isSuperAdmin = (): boolean => {
  try {
    return localStorage.getItem('username') === 'Super Admin';
  } catch {
    return false;
  }
};

const isStatusButtonAllowed = (currentStatusId: number, targetStatusId: number): boolean => {
  if (isSuperAdmin()) return true;
  if (currentStatusId === 5 || currentStatusId === 7) return false;

  const allowedNext: Record<number, number> = {
    2:  3,
    3:  4,
    4:  5,
    12: 6,
  };

  return allowedNext[currentStatusId] === targetStatusId;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusBadgeClass = (statusId: number): string => {
  switch (statusId) {
    case 1:  return 'bg-blue-200 text-blue-900';
    case 2:  return 'bg-yellow-200 text-yellow-900';
    case 3:  return 'bg-indigo-200 text-indigo-900';
    case 4:  return 'bg-purple-200 text-purple-900';
    case 5:  return 'bg-green-200 text-green-900';
    case 6:  return 'bg-pink-200 text-pink-900';
    case 7:  return 'bg-gray-300 text-gray-800';
    case 12: return 'bg-rose-200 text-rose-900';
    case 13: return 'bg-cyan-200 text-cyan-900';
    default: return 'bg-gray-200 text-gray-700';
  }
};

// ─── Action Button Config ─────────────────────────────────────────────────────

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  textColor: string;
  action: string;
  statusId?: number;
}

const actionButtons: ActionButton[] = [
  { label: 'Edit',         icon: <PencilIcon className="h-4 w-4" />,        color: 'bg-blue-500',   hoverColor: 'hover:bg-blue-600',   textColor: 'text-white', action: 'edit' },
  { label: 'Pending',      icon: <ClockIcon className="h-4 w-4" />,         color: 'bg-yellow-400', hoverColor: 'hover:bg-yellow-500', textColor: 'text-white', action: 'status',  statusId: 2  },
  { label: 'Wrapping',     icon: <PackageIcon className="h-4 w-4" />,       color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-600', textColor: 'text-white', action: 'status',  statusId: 3  },
  { label: 'Despatch',     icon: <SendIcon className="h-4 w-4" />,          color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600', textColor: 'text-white', action: 'status',  statusId: 4  },
  { label: 'Delivered',    icon: <CheckCircleIcon className="h-4 w-4" />,   color: 'bg-green-500',  hoverColor: 'hover:bg-green-600',  textColor: 'text-white', action: 'status',  statusId: 5  },
  { label: 'Return',       icon: <RotateCcwIcon className="h-4 w-4" />,     color: 'bg-pink-500',   hoverColor: 'hover:bg-pink-600',   textColor: 'text-white', action: 'status',  statusId: 6  },
  { label: 'Cancel',       icon: <XCircleIcon className="h-4 w-4" />,       color: 'bg-gray-500',   hoverColor: 'hover:bg-gray-600',   textColor: 'text-white', action: 'status',  statusId: 7  },
  { label: 'Returning',    icon: <RotateCcwIcon className="h-4 w-4" />,     color: 'bg-rose-400',   hoverColor: 'hover:bg-rose-500',   textColor: 'text-white', action: 'status',  statusId: 12 },
  { label: 'Checking',     icon: <AlertCircleIcon className="h-4 w-4" />,   color: 'bg-cyan-500',   hoverColor: 'hover:bg-cyan-600',   textColor: 'text-white', action: 'status',  statusId: 13 },
  { label: 'Special Note', icon: <FileTextIcon className="h-4 w-4" />,      color: 'bg-violet-500', hoverColor: 'hover:bg-violet-600', textColor: 'text-white', action: 'remark'  },
];

// ─── Order Action Modal ───────────────────────────────────────────────────────

interface OrderActionModalProps {
  order: ModalOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (order: ModalOrder, action: string, statusId?: number, note?: string) => Promise<void>;
  statusTypes: StatusTypeOption[];
}

const OrderActionModal = ({ order, isOpen, onClose, onAction, statusTypes }: OrderActionModalProps) => {
  const [specialNote, setSpecialNote]         = useState('');
  const [showNoteInput, setShowNoteInput]     = useState(false);
  const [showRemarkInput, setShowRemarkInput] = useState(false);
  const [remarkText, setRemarkText]           = useState('');
  const [isLoadingRemark, setIsLoadingRemark] = useState(false);
  const [isSavingRemark, setIsSavingRemark]   = useState(false);
  const [remarkError, setRemarkError]         = useState<string | null>(null);
  const [loadingStatusId, setLoadingStatusId] = useState<number | null>(null);
  const [actionError, setActionError]         = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSpecialNote('');
      setShowNoteInput(false);
      setShowRemarkInput(false);
      setRemarkText('');
      setIsLoadingRemark(false);
      setIsSavingRemark(false);
      setRemarkError(null);
      setLoadingStatusId(null);
      setActionError(null);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const isAnyLoading = loadingStatusId !== null || isLoadingRemark || isSavingRemark;

  const isButtonDisabled = (btn: ActionButton): boolean => {
    if (isAnyLoading) return true;
    if (btn.action === 'status' && btn.statusId !== undefined) {
      if (btn.statusId === 13 && !order?.orderCode?.trim()) return true;
      if (!isStatusButtonAllowed(order.statusId, btn.statusId)) return true;
    }
    if (btn.action === 'edit' && !isSuperAdmin()) {
      if (order.statusId === 4 || order.statusId === 5 || order.statusId === 7) return true;
    }
    return false;
  };

  const getButtonTitle = (btn: ActionButton): string | undefined => {
    if (btn.action === 'status' && btn.statusId === 13 && !order?.orderCode?.trim()) {
      return 'Requires a tracking number / order code';
    }
    if (btn.action === 'status' && btn.statusId !== undefined && !isStatusButtonAllowed(order.statusId, btn.statusId)) {
      return 'Not available at this stage';
    }
    if (btn.action === 'edit' && !isSuperAdmin() && (order.statusId === 5 || order.statusId === 7)) {
      return 'Cannot edit a completed or cancelled order';
    }
    return undefined;
  };

  const handleActionClick = async (btn: ActionButton) => {
    if (isButtonDisabled(btn)) return;

    if (btn.action === 'special_note') { setShowNoteInput(true); return; }

    if (btn.action === 'remark') {
      setShowRemarkInput(true);
      setRemarkError(null);
      setIsLoadingRemark(true);
      try {
        const res = await fetch(`http://localhost:8080/api/sales/${order.deliveryId}/remark`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        setRemarkText((await res.text()) ?? '');
      } catch (err: any) {
        setRemarkError(err.message ?? 'Failed to load remark');
        setRemarkText('');
      } finally {
        setIsLoadingRemark(false);
      }
      return;
    }

    if (btn.action === 'edit') { await onAction(order, 'edit'); onClose(); return; }

    if (btn.action === 'status' && btn.statusId === 3) {
      setLoadingStatusId(3);
      setActionError(null);
      try {
        const res = await fetch(`http://localhost:8080/api/sales/${order.deliveryId}/generate-tracking`, { method: 'POST' });
        if (!res.ok) { const t = await res.text(); throw new Error(t || `Server error: ${res.status}`); }
        await onAction(order, 'wrapping', 3, await res.text());
        onClose();
      } catch (err: any) {
        setActionError(err.message ?? 'Failed to generate tracking');
      } finally {
        setLoadingStatusId(null);
      }
      return;
    }

    if (btn.action === 'status' && btn.statusId !== undefined) {
      setLoadingStatusId(btn.statusId);
      setActionError(null);
      try {
        await onAction(order, 'status', btn.statusId);
        onClose();
      } catch (err: any) {
        setActionError(err.message ?? 'Failed to update status');
      } finally {
        setLoadingStatusId(null);
      }
    }
  };

  const handleSaveNote = async () => { await onAction(order, 'special_note', undefined, specialNote); onClose(); };

  const handleSaveRemark = async () => {
    setIsSavingRemark(true);
    setRemarkError(null);
    try {
      const res = await fetch(`http://localhost:8080/api/sales/${order.deliveryId}/remark`, {
        method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: remarkText,
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `Server error: ${res.status}`); }
      onClose();
    } catch (err: any) {
      setRemarkError(err.message ?? 'Failed to save remark');
    } finally {
      setIsSavingRemark(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isAnyLoading) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-white">Order Actions</h3>
            <p className="text-xs text-teal-100 mt-0.5">{order.orderCode || '—'} · {order.customerName}</p>
          </div>
          <button onClick={onClose} disabled={isAnyLoading} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-gray-50 border-b border-gray-100 px-5 py-3">
          <div className="text-xs text-gray-500"><span className="font-medium text-gray-700">Delivery ID:</span> #{order.deliveryId}</div>
          <div className="text-xs text-gray-500"><span className="font-medium text-gray-700">Order ID:</span> #{order.orderId}</div>
          <div className="text-xs text-gray-500"><span className="font-medium text-gray-700">Phone:</span> {order.phoneOne || '—'}</div>
          <div className="text-xs text-gray-500"><span className="font-medium text-gray-700">Total:</span> {order.totalAmount.toFixed(2)}</div>
          <div className="ml-auto">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(order.statusId)}`}>
              {statusTypes.find(s => s.statusId === order.statusId)?.statusType ?? order.statusId}
            </span>
          </div>
        </div>

        {actionError && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-700">Status update failed</p>
              <p className="text-xs text-red-600 mt-0.5 break-words">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)} className="shrink-0 text-red-400 hover:text-red-600"><XIcon className="h-3.5 w-3.5" /></button>
          </div>
        )}

        <div className="p-5">
          {!showNoteInput && !showRemarkInput ? (
            <div className="grid grid-cols-2 gap-2.5">
              {actionButtons.map((btn) => {
                const isThisLoading = btn.action === 'status' && loadingStatusId === btn.statusId;
                const disabled = isButtonDisabled(btn);
                return (
                  <button
                    key={btn.label}
                    onClick={() => handleActionClick(btn)}
                    disabled={disabled}
                    title={getButtonTitle(btn)}
                    className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 shadow-sm ${btn.color} ${btn.hoverColor} ${btn.textColor} hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100`}
                  >
                    {isThisLoading ? <RefreshCwIcon className="h-4 w-4 animate-spin" /> : btn.icon}
                    <span>{isThisLoading ? 'Updating…' : btn.label}</span>
                  </button>
                );
              })}
            </div>

          ) : showNoteInput ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileTextIcon className="h-4 w-4 text-orange-500" />Add Special Note
              </div>
              <textarea value={specialNote} onChange={(e) => setSpecialNote(e.target.value)} placeholder="Enter special note for this order…" rows={4} autoFocus className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNoteInput(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
                <button onClick={handleSaveNote} disabled={!specialNote.trim()} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">Save Note</button>
              </div>
            </div>

          ) : showRemarkInput ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileTextIcon className="h-4 w-4 text-violet-500" />Order Remark
              </div>
              {remarkError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <p className="text-xs text-red-600 break-words flex-1">{remarkError}</p>
                  <button onClick={() => setRemarkError(null)} className="shrink-0 text-red-400 hover:text-red-600"><XIcon className="h-3.5 w-3.5" /></button>
                </div>
              )}
              {isLoadingRemark ? (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                  <RefreshCwIcon className="h-4 w-4 animate-spin text-violet-500" />Loading remark…
                </div>
              ) : (
                <textarea value={remarkText} onChange={(e) => setRemarkText(e.target.value)} placeholder="Enter remark for this order…" rows={6} autoFocus className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none" />
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowRemarkInput(false); setRemarkError(null); }} disabled={isSavingRemark} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Back</button>
                <button onClick={handleSaveRemark} disabled={isLoadingRemark || isSavingRemark} className="flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSavingRemark ? <><RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />Saving…</> : 'Save Remark'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── Order View Modal ─────────────────────────────────────────────────────────

interface OrderViewModalProps {
  order: ModalOrder | null;
  isOpen: boolean;
  onClose: () => void;
  statusTypes: StatusTypeOption[];
  paymentTypeMap: Record<number, string>;
  rawOrder: Order | null;
}

const OrderViewModal = ({ order, isOpen, onClose, statusTypes, paymentTypeMap, rawOrder }: OrderViewModalProps) => {
  const [orderItems, setOrderItems] = useState<OrderDetailItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !order?.orderId) return;
    setOrderItems([]);
    setItemsError(null);
    setLoadingItems(true);
    fetch(`http://localhost:8080/api/sales/orders/${order.orderId}/items`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data: OrderDetailItem[]) => setOrderItems(data))
      .catch((err) => setItemsError(err.message ?? 'Failed to load items'))
      .finally(() => setLoadingItems(false));
  }, [isOpen, order?.orderId]);

  if (!isOpen || !order) return null;

  const fields = [
    { label: 'Order Code',    value: order.orderCode    || '—' },
    { label: 'Customer Name', value: order.customerName || '—' },
    { label: 'Phone One',     value: order.phoneOne     || '—' },
    { label: 'Phone Two',     value: order.phoneTwo     || '—' },
    { label: 'Order Type',    value: order.orderType    || '—' },
    { label: 'Date',          value: order.date         || '—' },
    { label: 'Address',       value: rawOrder?.address  || '—' },
    { label: 'Customer No.',  value: rawOrder?.customerNumber || '—' },
    { label: 'Payment Type',  value: rawOrder ? (paymentTypeMap[rawOrder.paymentTypeId] ?? '—') : '—' },
    { label: 'COD Amount',    value: `Rs. ${order.cod.toFixed(2)}` },
    { label: 'Total Amount',  value: `Rs. ${order.totalAmount.toFixed(2)}` },
    { label: 'Remark',        value: rawOrder?.remark || '—' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-gray-700 to-gray-800 px-5 py-4 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">Order Details</h3>
            <p className="text-xs text-gray-300 mt-0.5">{order.orderCode || 'No Tracking'}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">

          {/* Status badge */}
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.statusId)}`}>
              {statusTypes.find(s => s.statusId === order.statusId)?.statusType ?? order.statusId}
            </span>
          </div>

          {/* Fields */}
          <div className="px-5 pb-2 space-y-0 divide-y divide-gray-100">
            {fields.map((f) => (
              <div key={f.label} className="flex items-start justify-between py-2.5 gap-4">
                <span className="text-xs font-medium text-gray-500 shrink-0">{f.label}</span>
                <span className="text-sm font-semibold text-gray-800 text-right break-words max-w-[60%]">{f.value}</span>
              </div>
            ))}
          </div>

          {/* Order Items */}
          <div className="px-5 pb-5 mt-2">
            <div className="flex items-center gap-2 mb-3 border-t border-gray-100 pt-3">
              <PackageIcon className="h-4 w-4 text-teal-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">Order Items</span>
            </div>

            {loadingItems && (
              <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                <RefreshCwIcon className="h-4 w-4 animate-spin text-teal-500" />
                Loading items…
              </div>
            )}

            {itemsError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                Failed to load items: {itemsError}
              </div>
            )}

            {!loadingItems && !itemsError && orderItems.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400">No items found for this order.</div>
            )}

            {!loadingItems && orderItems.length > 0 && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-teal-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white">Item Name</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-white">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white">Unit Price</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white">Discount</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {orderItems.map((item, idx) => (
                      <tr key={item.orderDetailId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-gray-900">{item.itemName}</td>
                        <td className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700">
                          <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded bg-gray-100 px-1.5 text-gray-800">{item.quantity}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-700">{item.perItemPrice.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right text-xs">
                          {item.totalDiscountPrice > 0
                            ? <span className="text-red-500">{item.totalDiscountPrice.toFixed(2)}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-bold text-teal-800">{item.totalItemPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-gray-500">
                        {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} · {orderItems.reduce((sum, i) => sum + i.quantity, 0)} units
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-red-400 font-semibold">
                        -{orderItems.reduce((sum, i) => sum + i.totalDiscountPrice, 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-bold text-teal-800">
                        {orderItems.reduce((sum, i) => sum + i.totalItemPrice, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 shrink-0 border-t border-gray-100">
          <button onClick={onClose} className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Helper: map Order → ModalOrder ──────────────────────────────────────────

const toModalOrder = (o: Order): ModalOrder => ({
  deliveryId:   o.deliveryId ?? o.orderId,
  orderId:      o.orderId,
  orderCode:    o.billNo ?? '',
  customerName: o.customerName ?? '',
  phoneOne:     o.phoneOne ?? '',
  phoneTwo:     o.phoneTwo ?? '',
  cod:          o.totalOrderPrice ?? 0,
  totalAmount:  o.totalOrderPrice ?? 0,
  orderType:    o.orderType ?? '',
  date:         o.createdDate ? o.createdDate.split('T')[0] : '',
  statusId:     o.statusId,
});

// ─── FilterOrderPage ──────────────────────────────────────────────────────────

export function FilterOrderPage() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [printing, setPrinting]     = useState(false);
  const [toast, setToast]           = useState<Toast | null>(null);

  const [paymentTypes,  setPaymentTypes]  = useState<{ label: string; value: string }[]>([]);
  const [statusTypes,   setStatusTypes]   = useState<{ label: string; value: string }[]>([]);
  const [orderTypes,    setOrderTypes]    = useState<{ label: string; value: string }[]>([]);

  const [paymentTypeMap,    setPaymentTypeMap]    = useState<Record<number, string>>({});
  const [statusTypeMap,     setStatusTypeMap]     = useState<Record<number, string>>({});
  const [statusTypeOptions, setStatusTypeOptions] = useState<StatusTypeOption[]>([]);

  // Modal state
  const [actionModalOrder, setActionModalOrder] = useState<ModalOrder | null>(null);
  const [viewModalOrder,   setViewModalOrder]   = useState<ModalOrder | null>(null);
  const [viewModalRaw,     setViewModalRaw]     = useState<Order | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState<FilterValues>({
    orderCode: '',
    customerCode: '',
    from: today,
    to: today,
    paymentType: '',
    status: '',
    orderType: '',
  });

  const showToast = (type: ToastType, message: string, duration = 4000) => {
    setToast({ type, message });
    if (type !== 'loading') setTimeout(() => setToast(null), duration);
  };

  // ── Fetch all data ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, paymentRes, statusRes, orderTypeRes] = await Promise.all([
        fetch('http://localhost:8080/api/sales/get-all-orders'),
        fetch('http://localhost:8080/api/payment-types'),
        fetch('http://localhost:8080/api/status/types/1'),
        fetch('http://localhost:8080/api/order-types'),
      ]);

      const ordersData: Order[]        = await ordersRes.json();
      const paymentData: PaymentType[] = await paymentRes.json();
      const statusData: StatusType[]   = await statusRes.json();
      const orderTypeData: OrderType[] = await orderTypeRes.json();

      setOrders(ordersData);

      const pMap: Record<number, string> = {};
      paymentData.forEach((p) => { pMap[p.paymentTypeId] = p.paymentType; });
      setPaymentTypeMap(pMap);

      const sMap: Record<number, string> = {};
      statusData.forEach((s) => { sMap[s.statusId] = s.statusType; });
      setStatusTypeMap(sMap);

      setStatusTypeOptions(statusData.map((s) => ({ statusId: s.statusId, statusType: s.statusType })));
      setPaymentTypes(paymentData.map((p) => ({ label: p.paymentType, value: String(p.paymentTypeId) })));
      setStatusTypes(statusData.map((s) => ({ label: s.statusType, value: String(s.statusId) })));
      setOrderTypes(orderTypeData.map((o) => ({ label: o.type, value: String(o.type) })));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  // ── Filtered orders ─────────────────────────────────────────────────────────

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdDate);

      if (filters.orderCode    && !order.billNo?.toLowerCase().includes(filters.orderCode.toLowerCase()))            return false;
      if (filters.customerCode && !order.customerNumber?.toLowerCase().includes(filters.customerCode.toLowerCase())) return false;
      if (filters.from         && orderDate < new Date(filters.from))                                                 return false;
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) return false;
      }
      if (filters.paymentType  && String(order.paymentTypeId) !== filters.paymentType) return false;
      if (filters.status       && String(order.statusId)       !== filters.status)      return false;
      if (filters.orderType) {
        if (!order.orderType || order.orderType.toLowerCase() !== filters.orderType.toLowerCase()) return false;
      }
      return true;
    });
  }, [orders, filters]);

  const wrappingOrders = useMemo(() => filteredOrders.filter((o) => o.statusId === 3), [filteredOrders]);

  // ── Open view modal ─────────────────────────────────────────────────────────

  const handleViewOrder = (row: Order) => {
    setViewModalRaw(row);
    setViewModalOrder(toModalOrder(row));
  };

  // ── Action handler ──────────────────────────────────────────────────────────

  const handleOrderAction = useCallback(async (
    order: ModalOrder,
    action: string,
    statusId?: number,
    note?: string
  ): Promise<void> => {
    if (action === 'edit') {
      console.log('Edit action — wire up navigation if needed.');
      return;
    }

    if (action === 'special_note') {
      if (note) console.log(`Special note for ${order.orderCode}: ${note}`);
      return;
    }

    if (action === 'wrapping' && statusId !== undefined) {
      setOrders((prev) =>
        prev.map((o) =>
          (o.deliveryId ?? o.orderId) === order.deliveryId
            ? { ...o, statusId: 3, billNo: note ?? o.billNo }
            : o
        )
      );
      return;
    }

    if (action === 'status' && statusId !== undefined) {
      const res = await fetch(
        `http://localhost:8080/api/sales/${order.deliveryId}/status?statusId=${statusId}`,
        { method: 'PATCH' }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server error: ${res.status}`);
      }
      setOrders((prev) =>
        prev.map((o) =>
          (o.deliveryId ?? o.orderId) === order.deliveryId ? { ...o, statusId } : o
        )
      );
    }
  }, []);

  // ── Print wrapping ──────────────────────────────────────────────────────────

  const handlePrintWrapping = async () => {
    if (wrappingOrders.length === 0) {
      showToast('error', 'No Wrapping orders found in the current filter.');
      return;
    }

    setPrinting(true);
    showToast('loading', 'Preparing Excel file...');

    try {
      const wsData = [
        ['TrackingNumber', 'Reference', 'PackageDescription', 'ReceiverName', 'ReceiverAddress', 'ReceiverCity', 'ReceiverContactNo', 'NoOfPcs', 'Kilo', 'Gram', 'Amount', 'Exchange', 'Remark'],
        ...wrappingOrders.map((o) => {
          const totalGrams = parseFloat(o.weight ?? '0') || 0;
          const kilo = Math.floor(totalGrams / 1000);
          const gram  = Math.round(totalGrams % 1000);
          return [
            o.billNo ?? '', o.orderId ?? '', '0',
            o.customerName ?? '', o.address ?? '', '0',
            `${o.phoneOne ?? ''}${o.phoneTwo ? ` / ${o.phoneTwo}` : ' /'}`,
            1, kilo, gram, o.totalOrderPrice ?? 0, '0', '0',
          ];
        }),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 22 }, { wch: 30 },
        { wch: 16 }, { wch: 16 }, { wch: 8 },  { wch: 8 },  { wch: 8 },
        { wch: 12 }, { wch: 10 }, { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Wrapping Orders');

      let fileHandle: FileSystemFileHandle | null = null;
      try {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: `wrapping_orders_${today}.xlsx`,
          types: [{ description: 'Excel Spreadsheet', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') { setPrinting(false); setToast(null); return; }
        throw err;
      }

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const writable = await fileHandle.createWritable();
      await writable.write(new Blob([wbout], { type: 'application/octet-stream' }));
      await writable.close();

      showToast('loading', `Saved! Updating ${wrappingOrders.length} orders to Despatch...`);

      const results = await Promise.allSettled(
        wrappingOrders.map((o) => {
          const id = o.deliveryId ?? o.orderId;
          return fetch(`http://localhost:8080/api/sales/${id}/status?statusId=4`, { method: 'PATCH' });
        })
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      const refreshed = await fetch('http://localhost:8080/api/sales/get-all-orders');
      setOrders(await refreshed.json());

      if (failed === 0) {
        showToast('success', `✓ Excel saved & ${wrappingOrders.length} orders moved to Despatch.`);
      } else {
        showToast('error', `Excel saved, but ${failed} status update(s) failed. Please retry.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Something went wrong. Check console for details.');
    } finally {
      setPrinting(false);
    }
  };

  // ── Table columns ───────────────────────────────────────────────────────────

  const columns: Column<Order>[] = [
    { header: 'Order Code',   accessor: (row) => row.billNo || '-', className: 'font-medium text-teal-600' },
    { header: 'Customer',     accessor: 'customerName' },
    { header: 'Cust. No',     accessor: 'customerNumber' },
    { header: 'Phone One',    accessor: 'phoneOne' },
    { header: 'Phone Two',    accessor: 'phoneTwo' },
    { header: 'Address',      accessor: 'address', className: 'max-w-[150px] truncate' },
    { header: 'Payment',      accessor: (row) => paymentTypeMap[row.paymentTypeId] ?? '-' },
    { header: 'Delivery Fee', accessor: (row) => `${(row.deliveryFee ?? 0).toFixed(2)}` },
    { header: 'Total',        accessor: (row) => `${(row.totalOrderPrice ?? 0).toFixed(2)}`, className: 'font-semibold' },
    {
      header: 'Status',
      accessor: (row) => {
        const statusStyles: Record<number, { bg: string; fg: string }> = {
          1:  { bg: 'rgb(145,200,228)',      fg: 'rgb(92,136,196)'    },
          2:  { bg: 'rgba(206,206,206,1)',   fg: 'rgba(100,100,100,1)' },
          3:  { bg: 'rgb(255,255,102)',      fg: 'rgb(128,128,0)'     },
          4:  { bg: 'rgb(230,204,255)',      fg: 'rgb(102,0,153)'     },
          5:  { bg: 'rgb(198,239,206)',      fg: 'rgb(0,97,0)'        },
          6:  { bg: 'rgb(255,178,102)',      fg: 'rgb(207,83,0)'      },
          7:  { bg: 'rgb(255,204,204)',      fg: 'rgb(178,34,34)'     },
          12: { bg: 'rgb(255,180,180)',      fg: 'rgb(255,68,52)'     },
          13: { bg: 'rgb(152,161,188)',      fg: 'rgb(85,88,121)'     },
        };
        const label = statusTypeMap[row.statusId] ?? '-';
        const style = statusStyles[row.statusId] ?? { bg: '#fff', fg: '#000' };
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: style.bg, color: style.fg }}>
            {label}
          </span>
        );
      },
    },
    { header: 'Date',         accessor: (row) => new Date(row.createdDate).toLocaleDateString() },
    { header: 'Order Type',   accessor: (row) => row.orderType ?? '-' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          {/* View button */}
          <button
            onClick={() => handleViewOrder(row)}
            title="View order details"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 active:scale-95"
          >
            <EyeIcon className="h-3.5 w-3.5" />
          </button>
          {/* Actions button */}
          <button
            onClick={() => setActionModalOrder(toModalOrder(row))}
            title="Order actions"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-600 shadow-sm transition-all hover:border-teal-300 hover:bg-teal-100 hover:text-teal-700 active:scale-95"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col relative">

      {/* Action Modal */}
      <OrderActionModal
        order={actionModalOrder}
        isOpen={!!actionModalOrder}
        onClose={() => setActionModalOrder(null)}
        onAction={handleOrderAction}
        statusTypes={statusTypeOptions}
      />

      {/* View Modal */}
      <OrderViewModal
        order={viewModalOrder}
        isOpen={!!viewModalOrder}
        onClose={() => { setViewModalOrder(null); setViewModalRaw(null); }}
        statusTypes={statusTypeOptions}
        paymentTypeMap={paymentTypeMap}
        rawOrder={viewModalRaw}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl text-sm font-medium transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-600 text-white'
          : toast.type === 'error' ? 'bg-red-600 text-white'
          : 'bg-gray-900 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
          {toast.type === 'error'   && <XCircle     className="h-4 w-4 shrink-0" />}
          {toast.type === 'loading' && <Loader2     className="h-4 w-4 shrink-0 animate-spin" />}
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Advanced Order Filter</h1>
        {wrappingOrders.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            {wrappingOrders.length} Wrapping order{wrappingOrders.length > 1 ? 's' : ''} ready
          </span>
        )}
      </div>

      <FilterBar
        filters={[
          { type: 'text',   label: 'Order Code',    value: filters.orderCode,    onChange: (v) => setFilters((f) => ({ ...f, orderCode: v })) },
          { type: 'text',   label: 'Customer Code', value: filters.customerCode, onChange: (v) => setFilters((f) => ({ ...f, customerCode: v })) },
          { type: 'date',   label: 'From',          value: filters.from,         onChange: (v) => setFilters((f) => ({ ...f, from: v })) },
          { type: 'date',   label: 'To',            value: filters.to,           onChange: (v) => setFilters((f) => ({ ...f, to: v })) },
          { type: 'select', label: 'Payment Type',  options: paymentTypes,  value: filters.paymentType, onChange: (v) => setFilters((f) => ({ ...f, paymentType: v })) },
          { type: 'select', label: 'Status',        options: statusTypes,   value: filters.status,      onChange: (v) => setFilters((f) => ({ ...f, status: v })) },
          { type: 'select', label: 'Order Type',    options: orderTypes,    value: filters.orderType,   onChange: (v) => setFilters((f) => ({ ...f, orderType: v })) },
        ]}
        totalCount={filteredOrders.length}
      />

      <div className="flex-1 overflow-auto mb-16">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <svg className="mr-3 h-5 w-5 animate-spin text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading orders...
          </div>
        ) : (
          <DataTable columns={columns} data={filteredOrders} />
        )}
      </div>

      {/* Print Wrapping button */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={handlePrintWrapping}
          disabled={printing || wrappingOrders.length === 0}
          className="flex items-center rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {printing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PrinterIcon className="mr-2 h-5 w-5" />}
          {printing ? 'Processing...' : `Print Wrapping${wrappingOrders.length > 0 ? ` (${wrappingOrders.length})` : ''}`}
        </button>
      </div>
    </div>
  );
}