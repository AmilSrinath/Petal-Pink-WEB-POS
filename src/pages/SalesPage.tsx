import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  SearchIcon,
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  PercentIcon,
  TagIcon,
  PencilIcon,
  EyeIcon,
  XIcon,
  CheckCircleIcon,
  RotateCcwIcon,
  XCircleIcon,
  ClockIcon,
  PackageIcon,
  AlertCircleIcon,
  SendIcon,
  FileTextIcon,
} from 'lucide-react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Item {
  itemId: number;
  itemBarCode: number;
  itemName: string;
  unitType: string;
  unitPrice: number;
  costPrice: number;
  discount: number;
  weight: number;
  itemCodePrefix: string;
  sellingStatus: number;
  status: number;
}

interface CartItem {
  id: string;
  itemId: number;
  itemBarCode: number;
  itemWeight: number;
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
  amount: number;
}

interface Order {
  deliveryId: number;
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

interface OrderItem {
  itemId: number;
  itemBarCode: number;
  itemName: string;
  itemCodePrefix: string;
  unitPrice: number;
  unitType: string;
  discount: number;
  weight: number;
  quantity: number;
}

interface DeliveryOrderResponse {
  deliveryId: number;
  websiteOrderId: number | null;
  orderCode: string | null;
  codAmount: number;
  weight: string;
  remark: string;
  orderType: string;
  status: number;
  statusId: number;
  isFreeDelivery: number;
  isReturn: number;
  isExchange: number | null;
  userId: number;
  createdDate: string;
  deliveredDate: string | null;
  customerId: number;
  customerName: string;
  customerNumber: string;
  phoneOne: string;
  phoneTwo: string;
  address: string;
  orderId: number;
  billNo: string | null;
  subTotalPrice: number;
  totalDiscountPrice: number | null;
  deliveryFee: number;
  totalOrderPrice: number;
  paidAmount: number;
  paymentTypeId: number;
}

interface OrderTypeOption {
  id: number;
  type: string;
  status: number;
  createdAt: string;
  editedDate: string;
}

interface StatusTypeOption {
  statusId: number;
  statusType: string;
  regId: number;
  status: number;
}

interface PaymentTypeOption {
  paymentTypeId: number;
  paymentType: string;
  status: number;
  userId: number;
  visible: number;
}

// ─── Today's date helper ──────────────────────────────────────────────────────

const getTodayStr = (): string => new Date().toISOString().split('T')[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusBadgeClass = (statusId: number): string => {
  switch (statusId) {
    case 1:  return 'bg-blue-100 text-blue-800';
    case 2:  return 'bg-yellow-100 text-yellow-800';
    case 3:  return 'bg-indigo-100 text-indigo-800';
    case 4:  return 'bg-purple-100 text-purple-800';
    case 5:  return 'bg-green-100 text-green-800';
    case 6:  return 'bg-pink-100 text-pink-800';
    case 7:  return 'bg-gray-200 text-gray-700';
    case 12: return 'bg-rose-100 text-rose-800';
    case 13: return 'bg-cyan-100 text-cyan-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const mapApiToOrder = (d: DeliveryOrderResponse): Order => ({
  deliveryId: d.deliveryId,
  orderCode: d.orderCode?.trim() ?? '',
  customerName: d.customerName?.trim() ?? '',
  phoneOne: d.phoneOne ?? '',
  phoneTwo: d.phoneTwo ?? '',
  cod: d.codAmount ?? 0,
  totalAmount: d.totalOrderPrice ?? 0,
  orderType: d.orderType ?? '',
  date: d.createdDate ? d.createdDate.split('T')[0] : '',
  statusId: d.statusId,
});

// ─── Role helpers ─────────────────────────────────────────────────────────────

const isSuperAdmin = (): boolean => {
  try {
    return localStorage.getItem('username') === 'Super Admin';
  } catch {
    return false;
  }
};

/**
 * Returns true if the status transition is allowed for the current user.
 * Super Admin bypasses all restrictions.
 *
 * Allowed flows for non-admin:
 *   Pending (2)   → Wrapping (3)
 *   Wrapping (3)  → Despatch (4)
 *   Despatch (4)  → Delivered (5)
 *   Returning (12)→ Return (6)
 *   Delivered (5) → nothing
 *   Cancel (7)    → nothing
 */
const isStatusButtonAllowed = (currentStatusId: number, targetStatusId: number): boolean => {
  if (isSuperAdmin()) return true;
  if (currentStatusId === 5 || currentStatusId === 7) return false;

  const allowedNext: Record<number, number> = {
    2:  3,   // Pending   → Wrapping
    3:  4,   // Wrapping  → Despatch
    4:  5,   // Despatch  → Delivered
    12: 6,   // Returning → Return
  };

  return allowedNext[currentStatusId] === targetStatusId;
};

// ─── Shared style constants ───────────────────────────────────────────────────

const inputCls =
  'h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white';
const selectCls =
  'h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white';
const textareaCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none bg-white';

// ─── FieldRow ─────────────────────────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
  alignStart?: boolean;
}

const FieldRow = ({ label, children, alignStart = false }: FieldRowProps) => (
  <div className={`flex gap-3 ${alignStart ? 'items-start' : 'items-center'}`}>
    <label className="w-36 shrink-0 text-xs font-medium text-gray-600 leading-9">
      {label}
    </label>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

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
  {
    label: 'Edit',
    icon: <PencilIcon className="h-4 w-4" />,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    textColor: 'text-white',
    action: 'edit',
  },
  {
    label: 'Pending',
    icon: <ClockIcon className="h-4 w-4" />,
    color: 'bg-yellow-400',
    hoverColor: 'hover:bg-yellow-500',
    textColor: 'text-white',
    action: 'status',
    statusId: 2,
  },
  {
    label: 'Wrapping',
    icon: <PackageIcon className="h-4 w-4" />,
    color: 'bg-indigo-500',
    hoverColor: 'hover:bg-indigo-600',
    textColor: 'text-white',
    action: 'status',
    statusId: 3,
  },
  {
    label: 'Despatch',
    icon: <SendIcon className="h-4 w-4" />,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    textColor: 'text-white',
    action: 'status',
    statusId: 4,
  },
  {
    label: 'Delivered',
    icon: <CheckCircleIcon className="h-4 w-4" />,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    textColor: 'text-white',
    action: 'status',
    statusId: 5,
  },
  {
    label: 'Return',
    icon: <RotateCcwIcon className="h-4 w-4" />,
    color: 'bg-pink-500',
    hoverColor: 'hover:bg-pink-600',
    textColor: 'text-white',
    action: 'status',
    statusId: 6,
  },
  {
    label: 'Cancel',
    icon: <XCircleIcon className="h-4 w-4" />,
    color: 'bg-gray-500',
    hoverColor: 'hover:bg-gray-600',
    textColor: 'text-white',
    action: 'status',
    statusId: 7,
  },
  {
    label: 'Returning',
    icon: <RotateCcwIcon className="h-4 w-4" />,
    color: 'bg-rose-400',
    hoverColor: 'hover:bg-rose-500',
    textColor: 'text-white',
    action: 'status',
    statusId: 12,
  },
  {
    label: 'Checking',
    icon: <AlertCircleIcon className="h-4 w-4" />,
    color: 'bg-cyan-500',
    hoverColor: 'hover:bg-cyan-600',
    textColor: 'text-white',
    action: 'status',
    statusId: 13,
  },
  {
    label: 'Special Note',
    icon: <FileTextIcon className="h-4 w-4" />,
    color: 'bg-violet-500',
    hoverColor: 'hover:bg-violet-600',
    textColor: 'text-white',
    action: 'remark',
  },
];

// ─── Order Action Modal ───────────────────────────────────────────────────────

interface OrderActionModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (order: Order, action: string, statusId?: number, note?: string) => Promise<void>;
  statusTypes: StatusTypeOption[];
}

const OrderActionModal = ({ order, isOpen, onClose, onAction, statusTypes }: OrderActionModalProps) => {
  const [specialNote, setSpecialNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // ── Remark state ──
  const [showRemarkInput, setShowRemarkInput] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [isLoadingRemark, setIsLoadingRemark] = useState(false);
  const [isSavingRemark, setIsSavingRemark] = useState(false);
  const [remarkError, setRemarkError] = useState<string | null>(null);

  const [loadingStatusId, setLoadingStatusId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // ── Role-based disable logic ──────────────────────────────────────────────
  const isButtonDisabled = (btn: ActionButton): boolean => {
    if (isAnyLoading) return true;

    if (btn.action === 'status' && btn.statusId !== undefined) {
      if (btn.statusId === 13 && !order?.orderCode?.trim()) return true;
      if (!isStatusButtonAllowed(order.statusId, btn.statusId)) return true; // ← skipped for Super Admin
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
    if (
      btn.action === 'status' &&
      btn.statusId !== undefined &&
      !isStatusButtonAllowed(order.statusId, btn.statusId)
    ) {
      return 'Not available at this stage';
    }
    if (btn.action === 'edit' && !isSuperAdmin() && (order.statusId === 5 || order.statusId === 7)) {
      return 'Cannot edit a completed or cancelled order';
    }
    return undefined;
  };

  const handleActionClick = async (btn: ActionButton) => {
    if (isButtonDisabled(btn)) return;

    if (btn.action === 'special_note') {
      setShowNoteInput(true);
      return;
    }

    if (btn.action === 'remark') {
      setShowRemarkInput(true);
      setRemarkError(null);
      setIsLoadingRemark(true);
      try {
        const res = await fetch(`http://localhost:8080/api/sales/${order.deliveryId}/remark`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const text = await res.text();
        setRemarkText(text ?? '');
      } catch (err: any) {
        setRemarkError(err.message ?? 'Failed to load remark');
        setRemarkText('');
      } finally {
        setIsLoadingRemark(false);
      }
      return;
    }

    if (btn.action === 'edit') {
      await onAction(order, 'edit');
      onClose();
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

  const handleSaveNote = async () => {
    await onAction(order, 'special_note', undefined, specialNote);
    onClose();
  };

  const handleSaveRemark = async () => {
    setIsSavingRemark(true);
    setRemarkError(null);
    try {
      const res = await fetch(`http://localhost:8080/api/sales/${order.deliveryId}/remark`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: remarkText,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server error: ${res.status}`);
      }
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

        {/* Modal Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-white">Order Actions</h3>
            <p className="text-xs text-teal-100 mt-0.5">
              {order.orderCode || '—'} · {order.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isAnyLoading}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Order Info Strip */}
        <div className="flex items-center gap-4 bg-gray-50 border-b border-gray-100 px-5 py-3">
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Phone:</span> {order.phoneOne || '—'}
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Total:</span> {order.totalAmount.toFixed(2)}
          </div>
          <div className="ml-auto">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(order.statusId)}`}>
              {statusTypes.find(s => s.statusId === order.statusId)?.statusType ?? order.statusId}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {actionError && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-700">Status update failed</p>
              <p className="text-xs text-red-600 mt-0.5 break-words">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)} className="shrink-0 text-red-400 hover:text-red-600">
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Action Buttons Grid / Sub-forms */}
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
                    {isThisLoading ? (
                      <RefreshCwIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      btn.icon
                    )}
                    <span>{isThisLoading ? 'Updating…' : btn.label}</span>
                  </button>
                );
              })}
            </div>

          ) : showNoteInput ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileTextIcon className="h-4 w-4 text-orange-500" />
                Add Special Note
              </div>
              <textarea
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="Enter special note for this order…"
                rows={4}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNoteInput(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!specialNote.trim()}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Note
                </button>
              </div>
            </div>

          ) : showRemarkInput ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileTextIcon className="h-4 w-4 text-violet-500" />
                Order Remark
              </div>

              {remarkError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <p className="text-xs text-red-600 break-words flex-1">{remarkError}</p>
                  <button onClick={() => setRemarkError(null)} className="shrink-0 text-red-400 hover:text-red-600">
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {isLoadingRemark ? (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
                  <RefreshCwIcon className="h-4 w-4 animate-spin text-violet-500" />
                  Loading remark…
                </div>
              ) : (
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter remark for this order…"
                  rows={6}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                />
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowRemarkInput(false); setRemarkError(null); }}
                  disabled={isSavingRemark}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveRemark}
                  disabled={isLoadingRemark || isSavingRemark}
                  className="flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingRemark ? (
                    <>
                      <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save Remark'
                  )}
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
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  statusTypes: StatusTypeOption[];
}

const OrderViewModal = ({ order, isOpen, onClose, statusTypes }: OrderViewModalProps) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !order?.deliveryId) return;
    setOrderItems([]);
    setItemsError(null);
    setLoadingItems(true);
    fetch(`http://localhost:8080/api/sales/delivery-orders/${order.deliveryId}/items`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data: OrderItem[]) => setOrderItems(data))
      .catch((err) => setItemsError(err.message ?? 'Failed to load items'))
      .finally(() => setLoadingItems(false));
  }, [isOpen, order?.deliveryId]);

  if (!isOpen || !order) return null;

  const fields = [
    { label: 'Order Code',    value: order.orderCode    || '—' },
    { label: 'Customer Name', value: order.customerName || '—' },
    { label: 'Phone One',     value: order.phoneOne     || '—' },
    { label: 'Phone Two',     value: order.phoneTwo     || '—' },
    { label: 'Order Type',    value: order.orderType    || '—' },
    { label: 'Date',          value: order.date         || '—' },
    { label: 'COD Amount',    value: `Rs. ${order.cod.toFixed(2)}` },
    { label: 'Total Amount',  value: `Rs. ${order.totalAmount.toFixed(2)}` },
  ];

  const itemsTotal = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

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
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Status Banner */}
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.statusId)}`}>
              {statusTypes.find(s => s.statusId === order.statusId)?.statusType ?? order.statusId}
            </span>
          </div>

          {/* Order Fields */}
          <div className="px-5 pb-2 space-y-0 divide-y divide-gray-100">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2.5">
                <span className="text-xs font-medium text-gray-500">{f.label}</span>
                <span className="text-sm font-semibold text-gray-800">{f.value}</span>
              </div>
            ))}
          </div>

          {/* Items Section */}
          <div className="px-5 pb-5 mt-2">
            <div className="flex items-center gap-2 mb-3 border-t border-gray-100 pt-3">
              <PackageIcon className="h-4 w-4 text-teal-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                Order Items
              </span>
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
              <div className="text-center py-6 text-xs text-gray-400">
                No items found for this order.
              </div>
            )}

            {!loadingItems && orderItems.length > 0 && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-teal-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-white">Unit</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-white">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white">Price</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-white">Disc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {orderItems.map((item, idx) => (
                      <tr key={item.itemId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-gray-900">{item.itemName}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{item.unitType}</td>
                        <td className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700">
                          <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded bg-gray-100 px-1.5 text-gray-800">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-gray-900">
                          {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-500">
                          {item.discount > 0 ? (
                            <span className="text-red-500">{item.discount.toFixed(2)}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-gray-500">
                        {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} ·{' '}
                        {orderItems.reduce((sum, i) => sum + i.quantity, 0)} units
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-bold text-teal-800">
                        {itemsTotal.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 shrink-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SalesPage() {

  // ── Left Column: Customer ──
  const [phone, setPhone] = useState('');
  const [phoneTwo, setPhoneTwo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [address, setAddress] = useState('');
  const [remark, setRemark] = useState('');

  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null);

  const [phoneSuggestions, setPhoneSuggestions] = useState<DeliveryOrderResponse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // ── Items from API ──
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [qty, setQty] = useState(1);

  const selectedItem = items.find((i) => i.itemId === selectedItemId) ?? null;

  // ── Left Column: Cart & discounts ──
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountMode, setDiscountMode] = useState<'full' | 'item'>('full');
  const [fullOrderDiscount, setFullOrderDiscount] = useState(0);

  // ── Order types & payment types from API ──
  const [orderTypes, setOrderTypes] = useState<OrderTypeOption[]>([]);
  const [paymentTypeOptions, setPaymentTypeOptions] = useState<PaymentTypeOption[]>([]);
  const [statusTypes, setStatusTypes] = useState<StatusTypeOption[]>([]);

  // ── Left Column: Order details ──
  const [orderType, setOrderType] = useState('');
  const [weight, setWeight] = useState(0);
  const [paymentType, setPaymentType] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [isExchange, setIsExchange] = useState(false);
  const [isFreeShip, setIsFreeShip] = useState(false);

  // ── Edit mode: track which deliveryId is being edited ──
  const [editingDeliveryId, setEditingDeliveryId] = useState<number | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number>(2);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Right Column: Orders ──
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Date filters ──
  const [startDate, setStartDate] = useState<string>(getTodayStr);
  const [endDate, setEndDate] = useState<string>(getTodayStr);

  // ── Modal state ──
  const [actionModalOrder, setActionModalOrder] = useState<Order | null>(null);
  const [viewModalOrder, setViewModalOrder] = useState<Order | null>(null);

  // ── Delivery fee config ──
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(0);
  const [addCostPerKg, setAddCostPerKg] = useState(0);

  // ── Fetch delivery config ─────────────────────────────────────────────────

  useEffect(() => {
    const fetchDeliveryConfig = async () => {
      try {
        const [feeRes, perKgRes] = await Promise.all([
          fetch('http://localhost:8080/api/config/delivery-fee'),
          fetch('http://localhost:8080/api/config/add-cost-per-kg'),
        ]);
        if (feeRes.ok) {
          const feeText = await feeRes.text();
          setBaseDeliveryFee(parseFloat(feeText) || 0);
        }
        if (perKgRes.ok) {
          const perKgText = await perKgRes.text();
          setAddCostPerKg(parseFloat(perKgText) || 0);
        }
      } catch (err) {
        console.error('Failed to fetch delivery config:', err);
      }
    };
    fetchDeliveryConfig();
  }, []);

  // ── Fetch order types & payment types ────────────────────────────────────

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [otRes, ptRes] = await Promise.all([
          fetch('http://localhost:8080/api/order-types'),
          fetch('http://localhost:8080/api/payment-types'),
        ]);
        if (otRes.ok) {
          const otData: OrderTypeOption[] = await otRes.json();
          const active = otData.filter((o) => o.status === 1);
          setOrderTypes(active);
          if (active.length > 0) setOrderType(active[0].type);
        }
        if (ptRes.ok) {
          const ptData: PaymentTypeOption[] = await ptRes.json();
          const active = ptData.filter((p) => p.status === 1 && p.visible === 1);
          setPaymentTypeOptions(active);
          if (active.length > 0) setPaymentType(active[0].paymentType);
        }
        const stRes = await fetch('http://localhost:8080/api/status/types/1');
        if (stRes.ok) {
          const stData: StatusTypeOption[] = await stRes.json();
          setStatusTypes(stData.filter((s) => s.status === 1));
        }
      } catch (err) {
        console.error('Failed to fetch dropdowns:', err);
      }
    };
    fetchDropdowns();
  }, []);

  // ── Calculations ──
  const subTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const totalDiscount =
    discountMode === 'full'
      ? fullOrderDiscount
      : cart.reduce((sum, item) => sum + item.discount, 0);

  const weightKg = weight > 0 ? Math.max(1, Math.ceil(weight / 1000)) : 1;
  const calculatedDeliveryFee = baseDeliveryFee + (weightKg - 1) * addCostPerKg;
  const deliveryFee = isFreeShip ? 0 : calculatedDeliveryFee;
  const grandTotal = subTotal - totalDiscount + deliveryFee;

  // Resolve paymentTypeId from selected paymentType string
  const resolvedPaymentTypeId =
    paymentTypeOptions.find((pt) => pt.paymentType === paymentType)?.paymentTypeId ?? 1;

  // ── Fetch items ───────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const res = await fetch('http://localhost:8080/api/items');
      if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);
      const data: Item[] = await res.json();
      const active = data.filter((i) => i.status === 1 && i.sellingStatus === 1);
      setItems(active);
      if (active.length > 0) setSelectedItemId(active[0].itemId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, []);

  // ── Fetch orders ──────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const url = `http://localhost:8080/api/sales/delivery-orders?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
      const data: DeliveryOrderResponse[] = await res.json();
      setOrders(data.map(mapApiToOrder));
    } catch (err: any) {
      setFetchError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchOrders(); }, []);

  // ── Customer search cache ─────────────────────────────────────────────────

  const allOrdersRef = useRef<DeliveryOrderResponse[]>([]);

  const fetchAllOrdersForSearch = useCallback(async () => {
    if (allOrdersRef.current.length > 0) return;
    try {
      const url = `http://localhost:8080/api/sales/delivery-orders?startDate=2020-01-01&endDate=${getTodayStr()}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: DeliveryOrderResponse[] = await res.json();
      const seen = new Set<string>();
      allOrdersRef.current = data.filter((d) => {
        const key = String(d.customerId ?? d.phoneOne);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => { fetchAllOrdersForSearch(); }, []);

  const filterSuggestions = useCallback((query: string): DeliveryOrderResponse[] => {
    if (query.trim().length < 3) return [];
    const lower = query.toLowerCase();
    return allOrdersRef.current.filter(
      (d) =>
        (d.phoneOne ?? '').includes(query) ||
        (d.phoneTwo ?? '').includes(query) ||
        (d.customerNumber ?? '').includes(query) ||
        (d.customerName ?? '').toLowerCase().includes(lower)
    );
  }, []);

  const handlePhoneSearch = useCallback(async () => {
    const query = phone.trim();
    if (!query) return;
    setIsSearchingCustomer(true);
    setCustomerSearchError(null);
    setShowSuggestions(false);
    try {
      await fetchAllOrdersForSearch();
      const matched = filterSuggestions(query);
      if (matched.length === 0) {
        setCustomerSearchError('No customer found for that phone / name.');
        return;
      }
      if (matched.length === 1) {
        applyCustomer(matched[0]);
      } else {
        setPhoneSuggestions(matched);
        setShowSuggestions(true);
        setActiveSuggestion(-1);
      }
    } catch (err: any) {
      setCustomerSearchError(err.message ?? 'Search failed');
    } finally {
      setIsSearchingCustomer(false);
    }
  }, [phone, filterSuggestions, fetchAllOrdersForSearch]);

  const applyCustomer = (d: DeliveryOrderResponse) => {
    setPhone(d.phoneOne ?? '');
    setPhoneTwo(d.phoneTwo ?? '');
    setCustomerName(d.customerName?.trim() ?? '');
    setCustomerNumber(d.customerNumber ?? '');
    setAddress(d.address ?? '');
    setShowSuggestions(false);
    setPhoneSuggestions([]);
    setActiveSuggestion(-1);
    setCustomerSearchError(null);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setActiveSuggestion(-1);
    setCustomerSearchError(null);
    const suggestions = filterSuggestions(value);
    if (suggestions.length > 0) {
      setPhoneSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setPhoneSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (d: DeliveryOrderResponse) => applyCustomer(d);

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !showSuggestions) {
      e.preventDefault();
      handlePhoneSearch();
      return;
    }
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, phoneSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      handleSelectSuggestion(phoneSuggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        phoneInputRef.current &&
        !phoneInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Reset form ────────────────────────────────────────────────────────────

  const resetForm = () => {
    setEditingDeliveryId(null);
    setEditingStatusId(2);
    setCart([]);
    setCustomerName('');
    setPhone('');
    setPhoneTwo('');
    setCustomerNumber('');
    setAddress('');
    setRemark('');
    setOrderCode('');
    setFullOrderDiscount(0);
    setIsFreeShip(false);
    setIsExchange(false);
    setWeight(0);
    setPaidAmount(0);
    setSaveError(null);
  };

  // ── Cart handlers ─────────────────────────────────────────────────────────

  const handleAddItem = () => {
    if (!selectedItem) return;

    const itemDiscount = selectedItem.discount ?? 0;
    const existingIndex = cart.findIndex((c) => c.itemId === selectedItem.itemId);

    if (existingIndex !== -1) {
      setCart((prev) =>
        prev.map((c, i) => {
          if (i !== existingIndex) return c;
          const newQty = c.qty + qty;
          const newAmount = c.unitPrice * newQty - c.discount;
          return { ...c, qty: newQty, amount: newAmount > 0 ? newAmount : 0 };
        })
      );
    } else {
      const lineTotal = selectedItem.unitPrice * qty - itemDiscount;
      const newItem: CartItem = {
        id: Date.now().toString(),
        itemId: selectedItem.itemId,
        itemBarCode: selectedItem.itemBarCode,
        itemWeight: selectedItem.weight,
        name: `${selectedItem.itemName}`,
        qty,
        unitPrice: selectedItem.unitPrice,
        discount: itemDiscount,
        amount: lineTotal > 0 ? lineTotal : 0,
      };
      setCart((prev) => [...prev, newItem]);
    }

    setWeight((prev) => prev + selectedItem.weight * qty);
  };

  const handleRemoveItem = (id: string) => {
    const removing = cart.find((c) => c.id === id);
    if (removing) {
      setWeight((prev) => Math.max(0, prev - removing.itemWeight * removing.qty));
    }
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const handleItemDiscountChange = (id: string, newDiscount: number) => {
    setCart(
      cart.map((item) => {
        if (item.id !== id) return item;
        const newAmount = item.unitPrice * item.qty - newDiscount;
        return { ...item, discount: newDiscount, amount: newAmount > 0 ? newAmount : 0 };
      })
    );
  };

  // ── Build API payload ─────────────────────────────────────────────────────

  const buildPayload = () => {
    const codAmount = paymentType === 'Cash' ? grandTotal - paidAmount : 0;

    const apiItems = cart.map((c) => {
      const perItemDiscount = discountMode === 'item' ? c.discount : 0;
      return {
        itemId: c.itemId,
        itemBarCode: c.itemBarCode,
        quantity: c.qty,
        perItemPrice: c.unitPrice,
        totalDiscountPrice: perItemDiscount,
        totalItemPrice: c.unitPrice * c.qty - perItemDiscount,
        remark: '',
      };
    });

    return {
      customerName,
      phoneOne: phone,
      phoneTwo,
      address,
      customerNumber,
      codAmount,
      weight: String(weight),
      remark,
      orderType,
      isFreeDelivery: isFreeShip ? 1 : 0,
      isReturn: 0,
      isExchange: isExchange ? 1 : 0,
      userId: 1,
      statusId: editingDeliveryId ? editingStatusId : 2,
      subTotalPrice: subTotal,
      totalDiscountPrice: totalDiscount,
      deliveryFee,
      totalOrderPrice: grandTotal,
      paidAmount,
      paymentTypeId: resolvedPaymentTypeId,
      items: apiItems,
    };
  };

  // ── Save / Update order ───────────────────────────────────────────────────

  const handleSaveOrder = async () => {
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    setSaveError(null);
    setIsSaving(true);

    try {
      const isUpdate = editingDeliveryId !== null;
      const url = isUpdate
        ? 'http://localhost:8080/api/orders/update'
        : 'http://localhost:8080/api/orders/create';
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = {
        ...buildPayload(),
        ...(isUpdate
          ? { deliveryId: editingDeliveryId, orderCode }
          : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server error: ${res.status}`);
      }

      await fetchOrders();
      resetForm();
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save order');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Edit order: fetch order details + items, populate form ────────────────

  const handleEditOrder = useCallback(async (order: Order) => {
    setEditingDeliveryId(order.deliveryId);
    setEditingStatusId(order.statusId);
    setOrderCode(order.orderCode);
    setCustomerName(order.customerName);
    setPhone(order.phoneOne);
    setPhoneTwo(order.phoneTwo);
    setOrderType(order.orderType);
    setSaveError(null);

    try {
      const detailRes = await fetch(
        `http://localhost:8080/api/sales/delivery-orders?startDate=2020-01-01&endDate=${getTodayStr()}`
      );
      if (detailRes.ok) {
        const allData: DeliveryOrderResponse[] = await detailRes.json();
        const found = allData.find((d) => d.deliveryId === order.deliveryId);
        if (found) {
          setAddress(found.address ?? '');
          setCustomerNumber(found.customerNumber ?? '');
          setRemark(found.remark ?? '');
          setPaidAmount(found.paidAmount ?? 0);
          setIsFreeShip(found.isFreeDelivery === 1);
          setIsExchange(found.isExchange === 1);
          const matchedPt = paymentTypeOptions.find(
            (pt) => pt.paymentTypeId === found.paymentTypeId
          );
          if (matchedPt) setPaymentType(matchedPt.paymentType);
        }
      }
    } catch (err) {
      console.error('Failed to load order detail:', err);
    }

    try {
      const itemsRes = await fetch(
        `http://localhost:8080/api/sales/delivery-orders/${order.deliveryId}/items`
      );
      if (!itemsRes.ok) throw new Error(`Status ${itemsRes.status}`);
      const orderItems: OrderItem[] = await itemsRes.json();

      let totalWeightG = 0;
      const cartItems: CartItem[] = orderItems.map((oi) => {
        const lineDiscount = oi.discount ?? 0;
        const lineAmount = oi.unitPrice * oi.quantity - lineDiscount;
        totalWeightG += (oi.weight ?? 0) * oi.quantity;
        return {
          id: `edit-${oi.itemId}-${Date.now()}`,
          itemId: oi.itemId,
          itemBarCode: oi.itemBarCode ?? 0,
          itemWeight: oi.weight ?? 0,
          name: `${oi.itemName} (${oi.itemCodePrefix})`,
          qty: oi.quantity,
          unitPrice: oi.unitPrice,
          discount: lineDiscount,
          amount: lineAmount > 0 ? lineAmount : 0,
        };
      });

      setCart(cartItems);
      setWeight(totalWeightG);
    } catch (err) {
      console.error('Failed to load order items for edit:', err);
      setCart([]);
      setWeight(0);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paymentTypeOptions]);

  // ── Update order status via API ───────────────────────────────────────────

  const handleUpdateOrderStatus = useCallback(async (order: Order, statusId: number): Promise<void> => {
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
        o.deliveryId === order.deliveryId ? { ...o, statusId } : o
      )
    );
  }, []);

  // ── Modal action handler ──────────────────────────────────────────────────

  const handleOrderAction = useCallback(async (
    order: Order,
    action: string,
    statusId?: number,
    note?: string
  ): Promise<void> => {
    if (action === 'edit') {
      setActionModalOrder(null);
      await handleEditOrder(order);
      return;
    }

    if (action === 'special_note') {
      if (note) console.log(`Special note for ${order.orderCode}: ${note}`);
      return;
    }

    if (action === 'status' && statusId !== undefined) {
      await handleUpdateOrderStatus(order, statusId);
    }
  }, [handleEditOrder, handleUpdateOrderStatus]);

  // ── Table columns ─────────────────────────────────────────────────────────

  const orderColumns: Column<Order>[] = [
    { header: 'Order Code', accessor: 'orderCode', className: 'font-medium text-teal-600' },
    { header: 'Customer Name', accessor: 'customerName' },
    { header: 'Phone One', accessor: 'phoneOne' },
    { header: 'Phone Two', accessor: 'phoneTwo' },
    { header: 'COD', accessor: (row) => `${row.cod.toFixed(2)}` },
    { header: 'Total Amount', accessor: (row) => `${row.totalAmount.toFixed(2)}`, className: 'font-semibold' },
    { header: 'Order Type', accessor: 'orderType' },
    { header: 'Date', accessor: 'date' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusBadgeClass(row.statusId)}`}>
          {statusTypes.find(s => s.statusId === row.statusId)?.statusType ?? row.statusId}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewModalOrder(row)}
            title="View order details"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 active:scale-95"
          >
            <EyeIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setActionModalOrder(row)}
            title="Order actions"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-600 shadow-sm transition-all hover:border-teal-300 hover:bg-teal-100 hover:text-teal-700 active:scale-95"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Modals ── */}
      <OrderActionModal
        order={actionModalOrder}
        isOpen={!!actionModalOrder}
        onClose={() => setActionModalOrder(null)}
        onAction={handleOrderAction}
        statusTypes={statusTypes}
      />
      <OrderViewModal
        order={viewModalOrder}
        isOpen={!!viewModalOrder}
        onClose={() => setViewModalOrder(null)}
        statusTypes={statusTypes}
      />

      <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row gap-4 p-3 overflow-hidden bg-gray-50">

        {/* ════════════════════════════════════════════════
            LEFT COLUMN: Order Form (30%)
        ════════════════════════════════════════════════ */}
        <div className="flex w-full flex-col gap-4 lg:w-[30%] overflow-y-auto custom-scrollbar">

          {/* Edit Mode Banner */}
          {editingDeliveryId !== null && (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <PencilIcon className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">
                  Editing Order: <span className="font-bold">{orderCode || `#${editingDeliveryId}`}</span>
                </span>
              </div>
              <button
                onClick={resetForm}
                className="flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <XIcon className="h-3 w-3" />
                Cancel Edit
              </button>
            </div>
          )}

          {/* Save Error Banner */}
          {saveError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-700">Save failed</p>
                <p className="text-xs text-red-600 mt-0.5 break-words">{saveError}</p>
              </div>
              <button onClick={() => setSaveError(null)} className="shrink-0 text-red-400 hover:text-red-600">
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Customer Section ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-teal-800 border-b pb-2">
              Customer Details
            </h3>
            <div className="space-y-2">

              {/* Phone One with live suggestions */}
              <div className="flex items-center gap-3">
                <label className="w-36 shrink-0 text-xs font-medium text-gray-600">Phone One</label>
                <div className="relative flex flex-1 min-w-0 flex-col gap-1">
                  <div className="flex">
                    <input
                      ref={phoneInputRef}
                      type="text"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onKeyDown={handlePhoneKeyDown}
                      placeholder="Type phone or name…"
                      autoComplete="off"
                      className="h-9 w-full rounded-l-md border border-gray-300 px-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                    <button
                      onClick={handlePhoneSearch}
                      disabled={isSearchingCustomer || !phone.trim()}
                      className="flex h-9 shrink-0 items-center justify-center rounded-r-md bg-teal-600 px-3 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearchingCustomer
                        ? <RefreshCwIcon className="h-4 w-4 animate-spin" />
                        : <SearchIcon className="h-4 w-4" />}
                    </button>
                  </div>

                  {customerSearchError && (
                    <p className="text-xs text-red-500">{customerSearchError}</p>
                  )}

                  {showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                    >
                      {phoneSuggestions.map((d, index) => (
                        <div
                          key={d.customerId ?? d.phoneOne}
                          onMouseDown={() => handleSelectSuggestion(d)}
                          className={`flex flex-col px-3 py-2 cursor-pointer transition-colors ${
                            index === activeSuggestion
                              ? 'bg-teal-50 border-l-2 border-teal-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">{d.customerName}</span>
                            <span className="text-xs font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded shrink-0">{d.phoneOne}</span>
                          </div>
                          <span className="text-xs text-gray-500 mt-0.5 truncate">{d.address || d.customerNumber}</span>
                        </div>
                      ))}
                      <div className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50 border-t border-gray-100 sticky bottom-0">
                        ↑↓ navigate · Enter to select · Esc to close
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <FieldRow label="Phone Two">
                <input type="text" value={phoneTwo} onChange={(e) => setPhoneTwo(e.target.value)} placeholder="Optional second number" className={inputCls} />
              </FieldRow>

              <FieldRow label="Customer Name">
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
              </FieldRow>

              <FieldRow label="Customer Number">
                <input type="text" value={customerNumber} onChange={(e) => setCustomerNumber(e.target.value)} className={inputCls} />
              </FieldRow>

              <FieldRow label="Order Code">
                <input type="text" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} className={inputCls} />
              </FieldRow>

              <FieldRow label="Address" alignStart>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={textareaCls} />
              </FieldRow>

              <FieldRow label="Remark" alignStart>
                <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} className={textareaCls} />
              </FieldRow>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-md bg-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-600">Check</button>
              <button className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Edit</button>
              <button
                onClick={resetForm}
                className="rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ── Item Selection Section ── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="space-y-2 mb-3">

              <FieldRow label="Select Item">
                {isLoadingItems ? (
                  <div className="flex h-9 items-center gap-2 text-xs text-gray-500">
                    <RefreshCwIcon className="h-3.5 w-3.5 animate-spin text-teal-500" />
                    Loading items…
                  </div>
                ) : (
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(Number(e.target.value))}
                    className={selectCls}
                  >
                    {items.map((item) => (
                      <option key={item.itemId} value={item.itemId}>
                        {item.itemName}
                      </option>
                    ))}
                  </select>
                )}
              </FieldRow>

              <FieldRow label="Qty">
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  className={inputCls}
                />
              </FieldRow>
            </div>

            <div className="flex gap-2 border-b border-gray-100 pb-3">
              <button
                onClick={() => { setCart([]); setWeight(0); }}
                className="flex items-center rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                title="Clear all cart items and reset weight"
              >
                <Trash2Icon className="mr-1.5 h-3.5 w-3.5" /> Remove All
              </button>
              <button
                onClick={handleAddItem}
                disabled={!selectedItem}
                className="flex flex-1 items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="mr-1.5 h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            {/* Cart Table */}
            <div className="mt-3">
              <div className="mb-2 flex rounded-md bg-gray-100 p-1 w-fit">
                <button
                  onClick={() => setDiscountMode('full')}
                  className={`flex items-center rounded px-2 py-1 text-xs font-medium transition-colors ${discountMode === 'full' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <PercentIcon className="mr-1 h-3 w-3" /> Full Order
                </button>
                <button
                  onClick={() => setDiscountMode('item')}
                  className={`flex items-center rounded px-2 py-1 text-xs font-medium transition-colors ${discountMode === 'item' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <TagIcon className="mr-1 h-3 w-3" /> Item-wise
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Disc</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amt</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-xs text-gray-500">
                          Cart is empty. Add items to begin.
                        </td>
                      </tr>
                    ) : (
                      cart.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900">{item.name}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900">{item.qty}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900">{item.unitPrice.toFixed(2)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs">
                            {discountMode === 'item' ? (
                              <input
                                type="number"
                                min="0"
                                value={item.discount}
                                onChange={(e) => handleItemDiscountChange(item.id, parseFloat(e.target.value) || 0)}
                                className="w-16 rounded border border-gray-300 px-1.5 py-1 text-xs focus:border-teal-500 focus:outline-none"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-900">{item.amount.toFixed(2)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-center">
                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                              <Trash2Icon className="h-3.5 w-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Order Details & Summary Section ── */}
          <div className="grid grid-cols-1 gap-4">

            {/* Order Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">

              <FieldRow label="Order Type">
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className={selectCls}
                >
                  {orderTypes.length === 0 ? (
                    <option value="">Loading…</option>
                  ) : (
                    orderTypes.map((ot) => (
                      <option key={ot.id} value={ot.type}>
                        {ot.type}
                      </option>
                    ))
                  )}
                </select>
              </FieldRow>

              <FieldRow label="Weight (g)">
                <input
                  type="number"
                  value={weight}
                  readOnly
                  onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                  className='h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600'
                />
              </FieldRow>

              <FieldRow label="Payment Type">
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className={selectCls}
                >
                  {paymentTypeOptions.length === 0 ? (
                    <option value="">Loading…</option>
                  ) : (
                    paymentTypeOptions.map((pt) => (
                      <option key={pt.paymentTypeId} value={pt.paymentType}>
                        {pt.paymentType}
                      </option>
                    ))
                  )}
                </select>
              </FieldRow>

              <FieldRow label="Paid Amount">
                <div className="flex">
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="h-9 w-full rounded-l-md border border-gray-300 px-3 py-1 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                  <button className="flex h-9 shrink-0 items-center justify-center rounded-r-md bg-yellow-500 px-3 text-xs font-medium text-white hover:bg-yellow-600">
                    Add
                  </button>
                </div>
              </FieldRow>

              <FieldRow label="COD">
                <input
                  type="number"
                  value={paymentType === 'Cash' ? grandTotal - paidAmount : 0}
                  readOnly
                  className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600"
                />
              </FieldRow>

              <div className="flex gap-4 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isExchange}
                    onChange={(e) => setIsExchange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs text-gray-700">Exchange</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFreeShip}
                    onChange={(e) => setIsFreeShip(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-medium text-gray-700">Free Ship</span>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-teal-900">Sub Total :</span>
                  <span className="font-bold text-teal-900">{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-teal-900">Discount :</span>
                  {discountMode === 'full' ? (
                    <input
                      type="number"
                      min="0"
                      value={fullOrderDiscount}
                      onChange={(e) => setFullOrderDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 rounded border border-teal-300 px-2 py-1 text-right text-sm font-bold text-teal-900 focus:border-teal-500 focus:outline-none bg-white"
                    />
                  ) : (
                    <span className="font-bold text-teal-900">{totalDiscount.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-green-700">
                    Delivery Fee
                    {!isFreeShip && (
                      <span className="ml-1 text-xs text-gray-400 font-normal">
                        ({weightKg}kg)
                      </span>
                    )}
                    :
                  </span>
                  <span className="font-bold text-green-700">
                    {isFreeShip ? (
                      <span className="line-through text-gray-400 mr-1 text-xs">{calculatedDeliveryFee.toFixed(2)}</span>
                    ) : null}
                    {deliveryFee.toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-teal-200 flex justify-between items-center text-base">
                  <span className="font-bold text-red-600">Grand Total :</span>
                  <span className="font-bold text-red-600">{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="mt-4 w-full rounded-lg bg-teal-600 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                    {editingDeliveryId ? 'Updating…' : 'Saving…'}
                  </>
                ) : (
                  editingDeliveryId ? '✏️ Update Order' : '💾 Save Order'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            RIGHT COLUMN: Order List (70%)
        ════════════════════════════════════════════════ */}
        <div className="flex w-full flex-col lg:w-[70%] min-h-0">

          {/* Header row */}
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="flex items-center rounded-md bg-white border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCwIcon className={`mr-2 h-4 w-4 text-teal-600 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Sync Website Orders'}
            </button>
          </div>

          {/* Error banner */}
          {fetchError && (
            <div className="mb-3 shrink-0 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              <span className="font-semibold shrink-0">Error:</span>
              <span>{fetchError}</span>
              <button onClick={fetchOrders} className="ml-auto shrink-0 underline hover:text-red-800">Retry</button>
            </div>
          )}

          <FilterBar
            filters={[
              {
                type: 'date',
                label: 'From',
                value: startDate,
                defaultValue: startDate,
                onChange: (val) => setStartDate(val),
              },
              {
                type: 'date',
                label: 'To',
                value: endDate,
                defaultValue: endDate,
                onChange: (val) => setEndDate(val),
              },
              {
                type: 'select',
                label: 'Payment Type',
                options: [
                  { label: 'Cash', value: 'cash' },
                  { label: 'Card', value: 'card' },
                ],
              },
            ]}
            totalCount={orders.length}
            onSearch={fetchOrders}
          />

          {isLoading && orders.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <RefreshCwIcon className="h-8 w-8 animate-spin text-teal-500" />
                <span className="text-sm">Fetching orders…</span>
              </div>
            </div>
          )}

          {(!isLoading || orders.length > 0) && (
            <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-gray-200 bg-white">
              <div className="min-w-max">
                <DataTable columns={orderColumns} data={orders} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}