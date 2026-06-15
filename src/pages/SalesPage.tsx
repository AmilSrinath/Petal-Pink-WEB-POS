import React, { useEffect, useState, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config';
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
  HistoryIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
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
  subItemCategoryId: number;
  mainItemCategoryId: number;
}

interface CourierBag {
  itemId: number;
  itemBarCode: number;
  itemName: string;
  itemCodePrefix: string;
  subItemCategoryName: string;
  status: number;
}

interface SubItemCategoryDTO {
  subItemCategoryId: number;
  subItemCategoryName: string;
  mainItemCategoryId: number;
  mainItemCategoryName: string;
  imagePath: string;
  status: number;
  userId: number;
  visible: number;
}

interface SubItemCategory {
  subItemCategoryId: number;
  subItemCategoryName: string;
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
  discountType: 'amount' | 'pct';
}

interface Order {
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
  paymentTypeId: number;
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
  courierBagId:   number | null;
  courierBagName: string | null;
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

interface BusinessProfile {
  bussinessProfileId: number;
  bussinessProfileName: string;
  status: number;
  userId: number;
}

// ─── Stock Check Interfaces ───────────────────────────────────────────────────

interface IngredientStatus {
  subItemId: number;
  subItemName: string;
  requiredQty: number;
  availableQty: number;
  sufficient: boolean;
}

interface StockCheckResponse {
  available: boolean;
  message: string;
  ingredientStatuses: IngredientStatus[];
}

// ─── Today's date helper ──────────────────────────────────────────────────────

const getTodayStr = (): string => new Date().toISOString().split('T')[0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    case 16: return 'bg-orange-200 text-orange-900';
    default: return 'bg-gray-200 text-gray-700';
  }
};

const mapApiToOrder = (d: DeliveryOrderResponse): Order => ({
  deliveryId: d.deliveryId,
  orderId: d.orderId,
  orderCode: d.orderCode?.trim() ?? '',
  customerName: d.customerName?.trim() ?? '',
  phoneOne: d.phoneOne ?? '',
  phoneTwo: d.phoneTwo ?? '',
  cod: d.codAmount ?? 0,
  totalAmount: d.totalOrderPrice ?? 0,
  orderType: d.orderType ?? '',
  date: d.createdDate ? d.createdDate.split('T')[0] : '',
  statusId: d.statusId,
  paymentTypeId: d.paymentTypeId ?? 0,
});

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
  if (currentStatusId === 2 && targetStatusId === 7) return true;
  const allowedTransitions: Record<number, number[]> = {
    2:  [3, 7],
    3:  [4],
    4:  [5, 16],   // ← 16 = Damage added here
    12: [6],
  };
  return (allowedTransitions[currentStatusId] ?? []).includes(targetStatusId);
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

// ─── Courier Bag Combobox ─────────────────────────────────────────────────────

interface CourierBagComboboxProps {
  bags: CourierBag[];
  selectedId: number | null;
  onChange: (bag: CourierBag | null) => void;
  isLoading: boolean;
}

const BAG_SIZE_META: Record<string, { emoji: string; color: string; border: string; dot: string }> = {
  small:  { emoji: '🟡', color: 'bg-amber-50 text-amber-800',   border: 'border-amber-300',  dot: 'bg-amber-400' },
  medium: { emoji: '🔵', color: 'bg-blue-50 text-blue-800',     border: 'border-blue-300',   dot: 'bg-blue-400' },
  large:  { emoji: '🟢', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-400' },
};

const getBagMeta = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('small'))  return BAG_SIZE_META.small;
  if (lower.includes('medium')) return BAG_SIZE_META.medium;
  if (lower.includes('large'))  return BAG_SIZE_META.large;
  return { emoji: '📦', color: 'bg-gray-50 text-gray-700', border: 'border-gray-300', dot: 'bg-gray-400' };
};

const CourierBagCombobox = ({ bags, selectedId, onChange, isLoading }: CourierBagComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedBag = bags.find(b => b.itemId === selectedId) ?? null;

  const filtered = search.trim()
    ? bags.filter(b => b.itemName.toLowerCase().includes(search.toLowerCase()))
    : bags;

  const open = () => {
    setIsOpen(true);
    setSearch('');
    setHighlightedIdx(0);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const close = () => {
    setIsOpen(false);
    setSearch('');
  };

  const select = (bag: CourierBag | null) => {
    onChange(bag);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIdx === 0) select(null);
      else if (filtered[highlightedIdx - 1]) select(filtered[highlightedIdx - 1]);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlightedIdx] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIdx]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-9 items-center gap-2 text-xs text-gray-500">
        <RefreshCwIcon className="h-3.5 w-3.5 animate-spin text-teal-500" />
        Loading bags…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => isOpen ? close() : open()}
        className={`flex h-9 w-full items-center gap-2 rounded-md border px-3 text-sm transition-all bg-white
          ${isOpen
            ? 'border-teal-500 ring-1 ring-teal-500'
            : selectedBag
              ? `border-teal-300 ${getBagMeta(selectedBag.itemName).color}`
              : 'border-gray-300 text-gray-500 hover:border-gray-400'
          }`}
      >
        {selectedBag ? (
          <>
            <span className="text-base leading-none">{getBagMeta(selectedBag.itemName).emoji}</span>
            <span className="flex-1 text-left text-xs font-semibold truncate">{selectedBag.itemName}</span>
            <span className="text-xs font-mono text-gray-400 shrink-0">{selectedBag.itemCodePrefix}</span>
          </>
        ) : (
          <>
            <ShoppingBagIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-left text-gray-400">Select courier bag…</span>
          </>
        )}
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {selectedBag && !isOpen && (
        <div className={`mt-1.5 flex items-center justify-between rounded-lg border px-3 py-2 ${getBagMeta(selectedBag.itemName).border} ${getBagMeta(selectedBag.itemName).color}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`h-2 w-2 rounded-full shrink-0 ${getBagMeta(selectedBag.itemName).dot}`} />
            <span className="text-xs font-semibold truncate">{selectedBag.itemName}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); select(null); }}
            className="ml-2 shrink-0 rounded-full p-0.5 hover:bg-black/10 transition-colors"
            title="Clear selection"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="border-b border-gray-100 p-2">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5">
              <SearchIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setHighlightedIdx(0); }}
                placeholder="Search bags…"
                className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => { setSearch(''); setHighlightedIdx(0); }} className="text-gray-400 hover:text-gray-600">
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <ul ref={listRef} className="max-h-52 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => select(null)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors
                  ${highlightedIdx === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                onMouseEnter={() => setHighlightedIdx(0)}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-gray-300 text-gray-400">
                  <XIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-gray-500 italic">No bag selected</span>
                {selectedId === null && <CheckCircleIcon className="ml-auto h-4 w-4 text-teal-500" />}
              </button>
            </li>

            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-gray-400">No bags match your search.</li>
            )}

            {filtered.map((bag, idx) => {
              const meta = getBagMeta(bag.itemName);
              const isHighlighted = highlightedIdx === idx + 1;
              const isSelected = selectedId === bag.itemId;
              return (
                <li key={bag.itemId}>
                  <button
                    type="button"
                    onClick={() => select(bag)}
                    onMouseEnter={() => setHighlightedIdx(idx + 1)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors
                      ${isHighlighted ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-lg ${meta.border} ${meta.color}`}>
                      {meta.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-teal-700' : 'text-gray-800'}`}>
                          {bag.itemName}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Code: <span className="font-mono font-medium text-gray-500">{bag.itemCodePrefix}</span>
                      </div>
                    </div>
                    {isSelected && <CheckCircleIcon className="h-4 w-4 text-teal-500 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5">
            <p className="text-[10px] text-gray-400">↑↓ navigate · Enter select · Esc close</p>
          </div>
        </div>
      )}
    </div>
  );
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
    label: 'Damage',
    icon: <AlertTriangleIcon className="h-4 w-4" />,
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    textColor: 'text-white',
    action: 'status',
    statusId: 16,
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

// ─── Customer Order History Modal ─────────────────────────────────────────────

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  phoneOne: string;
  orders: DeliveryOrderResponse[];
  isLoading: boolean;
  statusTypes: StatusTypeOption[];
}

const CustomerOrderHistoryModal = ({
  isOpen,
  onClose,
  customerName,
  phoneOne,
  orders,
  isLoading,
  statusTypes,
}: CustomerOrderHistoryModalProps) => {
  if (!isOpen) return null;

  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <HistoryIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Order History</h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                {customerName || phoneOne} · {phoneOne}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {!isLoading && sorted.length > 0 && (
          <div className="flex items-center gap-6 border-b border-gray-100 bg-gray-50 px-5 py-3 shrink-0">
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-gray-800 text-sm">{sorted.length}</span> total orders
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-green-700 text-sm">
                {sorted.filter(o => o.statusId === 5).length}
              </span> delivered
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-yellow-700 text-sm">
                {sorted.filter(o => o.statusId !== 5 && o.statusId !== 7).length}
              </span> active
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-gray-600 text-sm">
                {sorted.filter(o => o.statusId === 7).length}
              </span> cancelled
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <RefreshCwIcon className="h-8 w-8 animate-spin text-indigo-400" />
              <span className="text-sm">Loading order history…</span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <PackageIcon className="h-10 w-10 text-gray-300" />
              <span className="text-sm">No orders found for this customer.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((order, idx) => {
                const statusLabel = statusTypes.find(s => s.statusId === order.statusId)?.statusType ?? `#${order.statusId}`;
                const isDelivered = order.statusId === 5;
                const isCancelled = order.statusId === 7;
                return (
                  <div
                    key={order.deliveryId}
                    className={`rounded-xl border p-4 transition-colors ${
                      idx === 0
                        ? 'border-indigo-200 bg-indigo-50/50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {idx === 0 ? '★' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {order.orderCode?.trim() ? (
                              <span className="text-sm font-semibold text-gray-900 font-mono">
                                {order.orderCode}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No tracking code</span>
                            )}
                            {idx === 0 && (
                              <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                            <span>
                              <span className="font-medium text-gray-700">Date:</span>{' '}
                              {order.createdDate ? order.createdDate.split('T')[0] : '—'}
                            </span>
                            <span>
                              <span className="font-medium text-gray-700">Type:</span>{' '}
                              {order.orderType || '—'}
                            </span>
                            <span>
                              <span className="font-medium text-gray-700">Delivery ID:</span>{' '}
                              #{order.deliveryId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.statusId)}`}>
                          {statusLabel}
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          Rs. {order.totalOrderPrice?.toFixed(2) ?? '0.00'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 pt-2">
                      <span className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">COD:</span>{' '}
                        Rs. {order.codAmount?.toFixed(2) ?? '0.00'}
                      </span>
                      <span className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">Paid:</span>{' '}
                        Rs. {order.paidAmount?.toFixed(2) ?? '0.00'}
                      </span>
                      {order.deliveredDate && (
                        <span className="text-xs text-green-600">
                          <span className="font-medium">Delivered:</span>{' '}
                          {order.deliveredDate.split('T')[0]}
                        </span>
                      )}
                      {!isDelivered && !isCancelled && (
                        <span className="ml-auto text-xs font-medium text-amber-600 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          In progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 shrink-0">
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

// ─── Last Order Not Delivered Confirmation Modal ──────────────────────────────

interface UndeliveredWarningModalProps {
  isOpen: boolean;
  lastOrder: DeliveryOrderResponse | null;
  statusTypes: StatusTypeOption[];
  onConfirm: () => void;
  onCancel: () => void;
}

const UndeliveredWarningModal = ({
  isOpen,
  lastOrder,
  statusTypes,
  onConfirm,
  onCancel,
}: UndeliveredWarningModalProps) => {
  if (!isOpen || !lastOrder) return null;

  const statusLabel = statusTypes.find(s => s.statusId === lastOrder.statusId)?.statusType ?? `#${lastOrder.statusId}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

        <div className="flex flex-col items-center gap-3 bg-amber-50 border-b border-amber-100 px-6 py-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-300">
            <AlertTriangleIcon className="h-7 w-7 text-amber-600" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-gray-900">Last Order Not Delivered</h3>
            <p className="text-xs text-gray-500 mt-1">
              This customer has an undelivered order
            </p>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Order Code</span>
              <span className="font-semibold text-gray-800 font-mono">
                {lastOrder.orderCode?.trim() || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Date</span>
              <span className="font-semibold text-gray-800">
                {lastOrder.createdDate ? lastOrder.createdDate.split('T')[0] : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Amount</span>
              <span className="font-bold text-gray-900">
                Rs. {lastOrder.totalOrderPrice?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Status</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(lastOrder.statusId)}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-700 text-center">
            Are you sure you want to place a new order?
          </p>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            No, Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors shadow-sm"
          >
            Yes, Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Action Modal ───────────────────────────────────────────────────────

interface OrderActionModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (order: Order, action: string, statusId?: number, note?: string) => Promise<void>;
  statusTypes: StatusTypeOption[];
  autoGenerateId: boolean;
  isPrint: boolean;
}

const OrderActionModal = ({
  order,
  isOpen,
  onClose,
  onAction,
  statusTypes,
  autoGenerateId,
  isPrint,
}: OrderActionModalProps) => {
  const [specialNote, setSpecialNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
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

  // Add this utility function outside the component
    const printThermalLabel = (trackingCode: string, customerName: string) => {
      const labelHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page {
              size: 50mm 25mm;
              margin: 0;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 50mm;
              height: 25mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              padding: 2mm;
            }
            .brand {
              font-size: 9pt;
              font-weight: bold;
              margin-bottom: 1mm;
              letter-spacing: 1px;
            }
            .barcode-area {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
            }
            svg {
              width: 44mm;
              height: 12mm;
            }
            .tracking-text {
              font-size: 10pt;
              margin-top: 0.5mm;
              letter-spacing: 1.5px;
            }
          </style>
        </head>
        <body>
          <div class="brand">Petal Pink</div>
          <div class="barcode-area">
            <svg id="barcode"></svg>
            <div class="tracking-text">${trackingCode}</div>
          </div>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode", "${trackingCode}", {
              format: "CODE128",
              width: 2,
              height: 40,
              displayValue: false,
              margin: 0,
            });
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 300);
            };
          </script>
        </body>
        </html>
      `;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '50mm';
      iframe.style.height = '25mm';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(labelHtml);
      doc.close();

      // Cleanup after printing
      iframe.onload = () => {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 5000);
      };
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
        const res = await fetch(`${API_BASE_URL}/api/sales/${order.deliveryId}/remark`);
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

    // In handleActionClick, inside the statusId === 3 block:
    if (btn.action === 'status' && btn.statusId === 3) {
      setLoadingStatusId(3);
      setActionError(null);
      try {
        let trackingCode = order.orderCode?.trim() ?? '';
        if (autoGenerateId) {
          const res = await fetch(
            `${API_BASE_URL}/api/sales/${order.deliveryId}/generate-tracking`,
            { method: 'POST' }
          );
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || `Server error: ${res.status}`);
          }
          trackingCode = await res.text();
        }
        await onAction(order, 'wrapping', 3, trackingCode);

        // ← Replace window.print() with this:
        if (isPrint) {
          printThermalLabel(trackingCode, order.customerName);
        }

        onClose();
      } catch (err: any) {
        setActionError(err.message ?? 'Failed to process wrapping');
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

  const handleSaveNote = async () => {
    await onAction(order, 'special_note', undefined, specialNote);
    onClose();
  };

  const handleSaveRemark = async () => {
    setIsSavingRemark(true);
    setRemarkError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sales/${order.deliveryId}/remark`, {
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

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-gray-50 border-b border-gray-100 px-5 py-3">
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Delivery ID:</span> #{order.deliveryId}
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Order ID:</span> #{order.orderId}
          </div>
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

        <div className="flex gap-2 px-5 pt-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            autoGenerateId
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'bg-gray-100 text-gray-400 border border-gray-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${autoGenerateId ? 'bg-teal-500' : 'bg-gray-400'}`} />
            Auto ID {autoGenerateId ? 'On' : 'Off'}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isPrint
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-400 border border-gray-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isPrint ? 'bg-blue-500' : 'bg-gray-400'}`} />
            Print {isPrint ? 'On' : 'Off'}
          </span>
        </div>

        {actionError && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-700">Action failed</p>
              <p className="text-xs text-red-600 mt-0.5 break-words">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)} className="shrink-0 text-red-400 hover:text-red-600">
              <XIcon className="h-3.5 w-3.5" />
            </button>
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
  const [orderItems, setOrderItems] = useState<OrderDetailItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !order?.orderId) return;
    setOrderItems([]);
    setItemsError(null);
    setLoadingItems(true);
    fetch(`${API_BASE_URL}/api/sales/orders/${order.orderId}/items`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data: OrderItem[]) => setOrderItems(data))
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
    { label: 'COD Amount',    value: `Rs. ${order.cod.toFixed(2)}` },
    { label: 'Total Amount',  value: `Rs. ${order.totalAmount.toFixed(2)}` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

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

        <div className="overflow-y-auto flex-1">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.statusId)}`}>
              {statusTypes.find(s => s.statusId === order.statusId)?.statusType ?? order.statusId}
            </span>
          </div>

          <div className="px-5 pb-2 space-y-0 divide-y divide-gray-100">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2.5">
                <span className="text-xs font-medium text-gray-500">{f.label}</span>
                <span className="text-sm font-semibold text-gray-800">{f.value}</span>
              </div>
            ))}
          </div>

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
                          <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded bg-gray-100 px-1.5 text-gray-800">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-700">
                          {item.perItemPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs">
                          {item.totalDiscountPrice > 0 ? (
                            <span className="text-red-500">{item.totalDiscountPrice.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-bold text-teal-800">
                          {item.totalItemPrice.toFixed(2)}
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

// ─── Phone validation helper ──────────────────────────────────────────────────

const validatePhone = (value: string): string | null => {
  if (!value.trim()) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 10) return 'Phone number must be exactly 10 digits.';
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SalesPage() {

  // ── Config flags ──────────────────────────────────────────────────────────
  const [autoGenerateId, setAutoGenerateId] = useState(false);
  const [isPrint, setIsPrint] = useState(false);

  // ── Courier bag state ─────────────────────────────────────────────────────
  const [showCourierBags, setShowCourierBags] = useState(false);
  const [courierBags, setCourierBags] = useState<CourierBag[]>([]);
  const [selectedCourierBag, setSelectedCourierBag] = useState<CourierBag | null>(null);
  const [isLoadingCourierBags, setIsLoadingCourierBags] = useState(false);
  const [courierBagError, setCourierBagError] = useState<string | null>(null);

  // ── Left Column: Customer ──
  const [phone, setPhone] = useState('');
  const [phoneTwo, setPhoneTwo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [address, setAddress] = useState('');
  const [remark, setRemark] = useState('');

  const [phoneOneError, setPhoneOneError] = useState<string | null>(null);
  const [phoneTwoError, setPhoneTwoError] = useState<string | null>(null);

  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null);

  const [phoneSuggestions, setPhoneSuggestions] = useState<DeliveryOrderResponse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // ── Customer order history modal state ──
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalOrders, setHistoryModalOrders] = useState<DeliveryOrderResponse[]>([]);
  const [historyModalLoading, setHistoryModalLoading] = useState(false);
  const [currentCustomerPhone, setCurrentCustomerPhone] = useState('');
  const [currentCustomerName, setCurrentCustomerName] = useState('');

  // ── Undelivered warning modal state ──
  const [undeliveredWarningOpen, setUndeliveredWarningOpen] = useState(false);
  const [lastUndeliveredOrder, setLastUndeliveredOrder] = useState<DeliveryOrderResponse | null>(null);
  const [pendingSaveAfterWarning, setPendingSaveAfterWarning] = useState(false);

  // ── Items & Categories ──
  const [items, setItems] = useState<Item[]>([]);
  const [subCategories, setSubCategories] = useState<SubItemCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [qty, setQty] = useState(1);

  // ── Stock check state ─────────────────────────────────────────────────────
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockDetails, setStockDetails] = useState<IngredientStatus[] | null>(null);

  const selectedItem = filteredItems.find((i) => i.itemId === selectedItemId) ?? null;

  // ── Left Column: Cart & discounts ──
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountMode, setDiscountMode] = useState<'full' | 'item'>('full');
  const [fullOrderDiscount, setFullOrderDiscount] = useState(0);

  // ── Order types & payment types from API ──
  const [orderTypes, setOrderTypes] = useState<OrderTypeOption[]>([]);
  const [paymentTypeOptions, setPaymentTypeOptions] = useState<PaymentTypeOption[]>([]);
  const [statusTypes, setStatusTypes] = useState<StatusTypeOption[]>([]);

  // ── Business Profile state ──
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // ── Left Column: Order details ──
  const [orderType, setOrderType] = useState('');
  const [weight, setWeight] = useState(0);
  const [paymentType, setPaymentType] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [isExchange, setIsExchange] = useState(false);
  const [isFreeShip, setIsFreeShip] = useState(false);

  // ── Edit mode ──
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

  // ── Payment type filter ──
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('');

  // ── Modal state ──
  const [actionModalOrder, setActionModalOrder] = useState<Order | null>(null);
  const [viewModalOrder, setViewModalOrder] = useState<Order | null>(null);

  // ── Delivery fee config ──
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(0);
  const [addCostPerKg, setAddCostPerKg] = useState(0);

  // ── Derived filtered orders by payment type ──
  const filteredOrders = paymentTypeFilter
    ? orders.filter((o) => {
        const matched = paymentTypeOptions.find(
          (pt) => pt.paymentType.toLowerCase() === paymentTypeFilter
        );
        return matched ? o.paymentTypeId === matched.paymentTypeId : true;
      })
    : orders;

  // ── Fetch feature config ──────────────────────────────────────────────────

  useEffect(() => {
    const fetchFeatureConfig = async () => {
      try {
        const [autoIdRes, printRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/config/auto-generate-id`),
          fetch(`${API_BASE_URL}/api/config/is-print`),
        ]);
        if (autoIdRes.ok) {
          const val = await autoIdRes.text();
          setAutoGenerateId(val.trim() !== '0' && val.trim() !== '');
        }
        if (printRes.ok) {
          const val = await printRes.text();
          setIsPrint(val.trim() !== '0' && val.trim() !== '');
        }
      } catch (err) {
        console.error('Failed to fetch feature config:', err);
      }
    };
    fetchFeatureConfig();
  }, []);

  // ── Fetch courier bag config + bags ──────────────────────────────────────

  useEffect(() => {
    const fetchCourierBagData = async () => {
      try {
        const configRes = await fetch(`${API_BASE_URL}/api/config/courier-bags/config`);
        if (!configRes.ok) return;
        const configData = await configRes.json();
        const isEnabled = configData?.isShowCourierBags === 1;
        setShowCourierBags(isEnabled);

        if (isEnabled) {
          setIsLoadingCourierBags(true);
          const bagsRes = await fetch(`${API_BASE_URL}/api/items/courier-bags`);
          if (bagsRes.ok) {
            const bagsData: CourierBag[] = await bagsRes.json();
            setCourierBags(bagsData.filter(b => b.status === 1));
          }
        }
      } catch (err) {
        console.error('Failed to fetch courier bag config:', err);
      } finally {
        setIsLoadingCourierBags(false);
      }
    };
    fetchCourierBagData();
  }, []);

  // ── Fetch delivery config ─────────────────────────────────────────────────

  useEffect(() => {
    const fetchDeliveryConfig = async () => {
      try {
        const [feeRes, perKgRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/config/delivery-fee`),
          fetch(`${API_BASE_URL}/api/config/add-cost-per-kg`),
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

  // ── Fetch order types, payment types & business profiles ─────────────────

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [otRes, ptRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/order-types`),
          fetch(`${API_BASE_URL}/api/payment-types`),
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
        const stRes = await fetch(`${API_BASE_URL}/api/status/types/1`);
        if (stRes.ok) {
          const stData: StatusTypeOption[] = await stRes.json();
          setStatusTypes(stData.filter((s) => s.status === 1));
        }

        setIsLoadingProfiles(true);
        const bpRes = await fetch(`${API_BASE_URL}/api/config/business-profiles`);
        if (bpRes.ok) {
          const bpData: BusinessProfile[] = await bpRes.json();
          const active = bpData.filter((p) => p.status === 1);
          setBusinessProfiles(active);
          if (active.length > 0) setSelectedProfileId(active[0].bussinessProfileId);
        }
      } catch (err) {
        console.error('Failed to fetch dropdowns:', err);
      } finally {
        setIsLoadingProfiles(false);
      }
    };
    fetchDropdowns();
  }, []);

  // ── Calculations ──────────────────────────────────────────────────────────

  const subTotal = cart.reduce((sum, item) => sum + (discountMode === 'item' ? item.amount : item.unitPrice * item.qty), 0);
  const totalDiscount = discountMode === 'full' ? fullOrderDiscount : 0;

  const weightKg = weight > 0 ? Math.max(1, Math.ceil(weight / 1000)) : 1;
  const calculatedDeliveryFee = baseDeliveryFee + (weightKg - 1) * addCostPerKg;
  const deliveryFee = isFreeShip ? 0 : calculatedDeliveryFee;
  const grandTotal = subTotal - totalDiscount + deliveryFee;

  const resolvedPaymentTypeId =
    paymentTypeOptions.find((pt) => pt.paymentType === paymentType)?.paymentTypeId ?? 1;  

  // ── Category change handler ───────────────────────────────────────────────

  const handleCategoryChange = useCallback((catId: number | '') => {
    setSelectedCategoryId(catId);
    if (catId === '') {
      setFilteredItems(items);
      if (items.length > 0) setSelectedItemId(items[0].itemId);
      else setSelectedItemId('');
    } else {
      const filtered = items.filter((i) => i.subItemCategoryId === Number(catId));
      setFilteredItems(filtered);
      if (filtered.length > 0) setSelectedItemId(filtered[0].itemId);
      else setSelectedItemId('');
    }
  }, [items]);

  // ── Fetch items + categories ──────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/items`),
        fetch(`${API_BASE_URL}/api/sub-item-category`),
      ]);

      if (!itemsRes.ok) throw new Error(`Failed to fetch items: ${itemsRes.status}`);
      const data: Item[] = await itemsRes.json();
      const active = data.filter((i) => i.status === 1 && i.sellingStatus === 1);
      setItems(active);

      if (catsRes.ok) {
        const allCats: SubItemCategoryDTO[] = await catsRes.json();
        const usedCatIds = new Set(active.map((i) => i.subItemCategoryId));
        const relevantCats: SubItemCategory[] = allCats
          .filter((c) => c.status === 1 && usedCatIds.has(c.subItemCategoryId))
          .map((c) => ({
            subItemCategoryId: c.subItemCategoryId,
            subItemCategoryName: c.subItemCategoryName,
          }));

        setSubCategories(relevantCats);

        if (relevantCats.length > 0) {
          const firstCatId = relevantCats[0].subItemCategoryId;
          setSelectedCategoryId(firstCatId);
          const filtered = active.filter((i) => i.subItemCategoryId === firstCatId);
          setFilteredItems(filtered);
          if (filtered.length > 0) setSelectedItemId(filtered[0].itemId);
        } else {
          setFilteredItems(active);
          if (active.length > 0) setSelectedItemId(active[0].itemId);
        }
      } else {
        setFilteredItems(active);
        if (active.length > 0) setSelectedItemId(active[0].itemId);
      }
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
      const url = `${API_BASE_URL}/api/sales/delivery-orders?startDate=${startDate}&endDate=${endDate}`;
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
      const url = `${API_BASE_URL}/api/sales/delivery-orders?startDate=2020-01-01&endDate=${getTodayStr()}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: DeliveryOrderResponse[] = await res.json();
      allOrdersRef.current = data;
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => { fetchAllOrdersForSearch(); }, []);

  // ── Fetch customer order history ──────────────────────────────────────────

  const fetchCustomerHistory = useCallback(async (phoneNumber: string, name: string) => {
    setCurrentCustomerPhone(phoneNumber);
    setCurrentCustomerName(name);
    setHistoryModalLoading(true);
    setHistoryModalOpen(true);
    setHistoryModalOrders([]);

    try {
      await fetchAllOrdersForSearch();
      const customerOrders = allOrdersRef.current.filter(
        (d) =>
          (d.phoneOne ?? '') === phoneNumber ||
          (d.phoneTwo ?? '') === phoneNumber ||
          (d.customerNumber ?? '') === phoneNumber
      );
      setHistoryModalOrders(customerOrders);
    } catch (err) {
      console.error('Failed to fetch customer history:', err);
      setHistoryModalOrders([]);
    } finally {
      setHistoryModalLoading(false);
    }
  }, [fetchAllOrdersForSearch]);

  // ── Get last undelivered order ────────────────────────────────────────────

  const getLastUndeliveredOrder = useCallback(async (phoneNumber: string): Promise<DeliveryOrderResponse | null> => {
    await fetchAllOrdersForSearch();
    const customerOrders = allOrdersRef.current.filter(
      (d) =>
        (d.phoneOne ?? '') === phoneNumber ||
        (d.phoneTwo ?? '') === phoneNumber
    );
    if (customerOrders.length === 0) return null;
    const sorted = [...customerOrders].sort(
      (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
    const latest = sorted[0];
    if (latest.statusId !== 5 && latest.statusId !== 7) return latest;
    return null;
  }, [fetchAllOrdersForSearch]);

  const filterSuggestions = useCallback((query: string): DeliveryOrderResponse[] => {
    if (query.trim().length < 3) return [];
    const lower = query.toLowerCase();
    const seen = new Set<string>();
    return allOrdersRef.current.filter((d) => {
      const key = String(d.customerId ?? d.phoneOne);
      if (seen.has(key)) return false;
      const matches =
        (d.phoneOne ?? '').includes(query) ||
        (d.phoneTwo ?? '').includes(query) ||
        (d.customerNumber ?? '').includes(query) ||
        (d.customerName ?? '').toLowerCase().includes(lower);
      if (matches) { seen.add(key); return true; }
      return false;
    });
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
    setPhoneOneError(null);
    setPhoneTwoError(null);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setActiveSuggestion(-1);
    setCustomerSearchError(null);
    setPhoneOneError(validatePhone(value));
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
    setPhoneOneError(null);
    setPhoneTwoError(null);
    setSelectedCourierBag(null);
    setCourierBagError(null);
    setStockError(null);
    setStockDetails(null);
  };

  // ── Cart handlers ─────────────────────────────────────────────────────────

  // ── Stock-checked Add Item ────────────────────────────────────────────────
  const handleAddItem = async () => {
    if (!selectedItem) return;

    // Clear any previous stock error
    setStockError(null);
    setStockDetails(null);
    setIsCheckingStock(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/stock-check/item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem.itemId, quantity: qty }),
      });

      if (!res.ok) throw new Error(`Stock check failed: ${res.status}`);

      const data: StockCheckResponse = await res.json();

      if (!data.available) {
        setStockError(data.message ?? 'Insufficient stock.');
        setStockDetails(data.ingredientStatuses ?? []);
        return;
      }

      // ── Stock OK: proceed with cart logic ────────────────────────────────
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
          name: selectedItem.itemName,
          qty,
          unitPrice: selectedItem.unitPrice,
          discount: itemDiscount,
          amount: lineTotal > 0 ? lineTotal : 0,
          discountType: 'amount',
        };
        setCart((prev) => [...prev, newItem]);
      }

      setWeight((prev) => prev + selectedItem.weight * qty);

    } catch (err: any) {
      setStockError(err.message ?? 'Stock check failed. Please try again.');
      setStockDetails(null);
    } finally {
      setIsCheckingStock(false);
    }
  };

  const handleItemDiscountTypeChange = (id: string, type: 'amount' | 'pct') => {
    setCart(cart.map(item => {
      if (item.id !== id) return item;
      return { ...item, discountType: type, discount: 0, amount: item.unitPrice * item.qty };
    }));
  };

  const handleRemoveItem = (id: string) => {
    const removing = cart.find((c) => c.id === id);
    if (removing) {
      setWeight((prev) => Math.max(0, prev - removing.itemWeight * removing.qty));
    }
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const handleItemDiscountChange = (id: string, val: number) => {
    setCart(cart.map(item => {
      if (item.id !== id) return item;
      const discAmt = item.discountType === 'pct'
        ? (item.unitPrice * item.qty * val) / 100
        : val;
      const newAmount = item.unitPrice * item.qty - discAmt;
      return { ...item, discount: discAmt, amount: newAmount > 0 ? newAmount : 0 };
    }));
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
      bussinessProfileId: selectedProfileId,
      courierBagId: selectedCourierBag?.itemId ?? null,       // ← always included, null if none
      courierBagName: selectedCourierBag?.itemName ?? null,   // ← always included, null if none
      items: apiItems,
    };
  };

  // ── Core save logic ───────────────────────────────────────────────────────

  const executeSaveOrder = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      const isUpdate = editingDeliveryId !== null;
      const url = isUpdate
        ? `${API_BASE_URL}/api/orders/update`
        : `${API_BASE_URL}/api/orders/create`;
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = {
        ...buildPayload(),
        ...(isUpdate ? { deliveryId: editingDeliveryId, orderCode } : {}),
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

      allOrdersRef.current = [];
      fetchAllOrdersForSearch();

      await fetchOrders();
      resetForm();
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save order');
    } finally {
      setIsSaving(false);
      setPendingSaveAfterWarning(false);
    }
  };

  // ── Save / Update order with undelivered check ────────────────────────────

  const handleSaveOrder = async () => {
    if (cart.length === 0) { alert('Cart is empty!'); return; }

    if (showCourierBags && !selectedCourierBag) {
      setCourierBagError('Please select a courier bag to continue.');
      return;
    }

    if (!phone.trim()) {
      setPhoneOneError('Phone One is required.');
      return;
    }
    const p1err = validatePhone(phone);
    if (p1err) { setPhoneOneError(p1err); return; }
    if (phoneTwo.trim()) {
      const p2err = validatePhone(phoneTwo);
      if (p2err) { setPhoneTwoError(p2err); return; }
    }

    if (!editingDeliveryId) {
      const undelivered = await getLastUndeliveredOrder(phone.trim());
      if (undelivered) {
        setLastUndeliveredOrder(undelivered);
        setUndeliveredWarningOpen(true);
        setPendingSaveAfterWarning(true);
        return;
      }
    }

    await executeSaveOrder();
  };

  // ── Warning modal handlers ────────────────────────────────────────────────

  const handleWarningConfirm = async () => {
    setUndeliveredWarningOpen(false);
    setLastUndeliveredOrder(null);
    if (pendingSaveAfterWarning) {
      await executeSaveOrder();
    }
  };

  const handleWarningCancel = () => {
    setUndeliveredWarningOpen(false);
    setLastUndeliveredOrder(null);
    setPendingSaveAfterWarning(false);
  };

  // ── Edit order ────────────────────────────────────────────────────────────

  const handleEditOrder = useCallback(async (order: Order) => {
    setEditingDeliveryId(order.deliveryId);
    setEditingStatusId(order.statusId);
    setOrderCode(order.orderCode);
    setDiscountMode('item');
    setCustomerName(order.customerName);
    setPhone(order.phoneOne);
    setPhoneTwo(order.phoneTwo);
    setOrderType(order.orderType);
    setSaveError(null);
    setPhoneOneError(null);
    setPhoneTwoError(null);
    setStockError(null);
    setStockDetails(null);

    try {
      const detailRes = await fetch(
        `${API_BASE_URL}/api/sales/delivery-orders?startDate=2020-01-01&endDate=${getTodayStr()}`
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

          // ── Step 8: restore courier bag ──────────────────────────
          if (found.courierBagId && showCourierBags) {
            const matchedBag = courierBags.find(b => b.itemId === found.courierBagId);
            if (matchedBag) {
              setSelectedCourierBag(matchedBag);
            } else {
              setSelectedCourierBag({
                itemId:              found.courierBagId,
                itemBarCode:         0,
                itemName:            found.courierBagName ?? '',
                itemCodePrefix:      '',
                subItemCategoryName: '',
                status:              1,
              });
            }
          } else {
            setSelectedCourierBag(null);
          }
          // ─────────────────────────────────────────────────────────
        }
      }
    } catch (err) {
      console.error('Failed to load order detail:', err);
    }

    try {
      const itemsRes = await fetch(
        `${API_BASE_URL}/api/sales/orders/${order.orderId}/items`
      );
      if (!itemsRes.ok) throw new Error(`Status ${itemsRes.status}`);
      const orderItems: OrderDetailItem[] = await itemsRes.json();

      let totalWeightG = 0;
      const cartItems: CartItem[] = orderItems.map((oi) => {
        const masterItem = items.find((i) => i.itemId === oi.itemId);
        const itemWeight = masterItem?.weight ?? 0;
        const lineDiscount = oi.totalDiscountPrice ?? 0;
        const lineAmount = oi.totalItemPrice ?? (oi.perItemPrice * oi.quantity - lineDiscount);
        totalWeightG += itemWeight * oi.quantity;
        return {
          id: `edit-${oi.itemId}-${Date.now()}`,
          itemId: oi.itemId,
          itemBarCode: oi.itemBarCode ?? 0,
          itemWeight: itemWeight,
          name: oi.itemName,
          qty: oi.quantity,
          unitPrice: oi.perItemPrice,
          discount: lineDiscount,
          amount: lineAmount > 0 ? lineAmount : 0,
          discountType: 'amount' as const,
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
  }, [paymentTypeOptions, items]);

  // ── Update order status ───────────────────────────────────────────────────

  const handleUpdateOrderStatus = useCallback(async (order: Order, statusId: number): Promise<void> => {
    const res = await fetch(
      `${API_BASE_URL}/api/sales/${order.deliveryId}/status?statusId=${statusId}`,
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
    if (action === 'wrapping' && statusId !== undefined) {
      const newTrackingCode = note ?? '';
      setOrders((prev) =>
        prev.map((o) =>
          o.deliveryId === order.deliveryId
            ? { ...o, statusId: 3, orderCode: newTrackingCode }
            : o
        )
      );
      return;
    }
    if (action === 'status' && statusId !== undefined) {
      await handleUpdateOrderStatus(order, statusId);
    }
  }, [handleEditOrder, handleUpdateOrderStatus]);

  const [selectedOrder, setSelectedOrder] = useState(null);

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
        autoGenerateId={autoGenerateId}
        isPrint={isPrint}
      />
      <OrderViewModal
        order={viewModalOrder}
        isOpen={!!viewModalOrder}
        onClose={() => setViewModalOrder(null)}
        statusTypes={statusTypes}
      />
      <CustomerOrderHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        customerName={currentCustomerName}
        phoneOne={currentCustomerPhone}
        orders={historyModalOrders}
        isLoading={historyModalLoading}
        statusTypes={statusTypes}
      />
      <UndeliveredWarningModal
        isOpen={undeliveredWarningOpen}
        lastOrder={lastUndeliveredOrder}
        statusTypes={statusTypes}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />

      <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row gap-4 p-3 overflow-hidden bg-gray-50">

        {/* ════════════════════════════════════════════════
            LEFT COLUMN: Order Form (30%)
        ════════════════════════════════════════════════ */}
        <div className="flex w-full flex-col gap-4 lg:w-[30%] overflow-y-auto custom-scrollbar">

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

              <div className="flex gap-3 items-start">
                <label className="w-36 shrink-0 text-xs font-medium text-gray-600 leading-9">
                  Phone One <span className="text-red-500">*</span>
                </label>
                <div className="relative flex flex-1 min-w-0 flex-col gap-1">
                  <div className="flex">
                    <input
                      ref={phoneInputRef}
                      type="text"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onKeyDown={handlePhoneKeyDown}
                      placeholder="10-digit phone number"
                      autoComplete="off"
                      maxLength={15}
                      className={`h-9 w-full rounded-l-md border px-3 py-1 text-sm focus:outline-none focus:ring-1 bg-white ${
                        phoneOneError
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                          : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'
                      }`}
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

                  {phoneOneError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="h-3 w-3 shrink-0" />
                      {phoneOneError}
                    </p>
                  )}

                  {customerSearchError && !phoneOneError && (
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

              <div className="flex gap-3 items-start">
                <label className="w-36 shrink-0 text-xs font-medium text-gray-600 leading-9">Phone Two</label>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={phoneTwo}
                    onChange={(e) => {
                      setPhoneTwo(e.target.value);
                      setPhoneTwoError(validatePhone(e.target.value));
                    }}
                    placeholder="Optional — 10 digits if entered"
                    maxLength={15}
                    className={`h-9 w-full rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-1 bg-white ${
                      phoneTwoError
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                        : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'
                    }`}
                  />
                  {phoneTwoError && (
                    <p className="mt-0.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="h-3 w-3 shrink-0" />
                      {phoneTwoError}
                    </p>
                  )}
                </div>
              </div>

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
              <button
                onClick={() => {
                  if (!phone.trim()) {
                    setCustomerSearchError('Enter a phone number first.');
                    return;
                  }
                  fetchCustomerHistory(phone.trim(), customerName);
                }}
                className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 transition-colors"
                title="View order history for this phone number"
              >
                <HistoryIcon className="h-3.5 w-3.5" />
                Check
              </button>
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

              <FieldRow label="Business Profile">
                {isLoadingProfiles ? (
                  <div className="flex h-9 items-center gap-2 text-xs text-gray-500">
                    <RefreshCwIcon className="h-3.5 w-3.5 animate-spin text-teal-500" />
                    Loading…
                  </div>
                ) : (
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(Number(e.target.value))}
                    className={selectCls}
                  >
                    {businessProfiles.length === 0 ? (
                      <option value="">No profiles available</option>
                    ) : (
                      businessProfiles.map((bp) => (
                        <option key={bp.bussinessProfileId} value={bp.bussinessProfileId}>
                          {bp.bussinessProfileName}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </FieldRow>

              {/* ── Courier Bag Combobox ── */}
              {showCourierBags && (
                <div className="flex gap-3 items-start">
                  <label className="w-36 shrink-0 text-xs font-medium text-gray-600 leading-9 flex items-center gap-1">
                    <ShoppingBagIcon className="h-3 w-3 text-teal-500" />
                    Courier Bag
                  </label>
                  <div className="flex-1 min-w-0">
                    <CourierBagCombobox
                      bags={courierBags}
                      selectedId={selectedCourierBag?.itemId ?? null}
                      onChange={(bag) => { setSelectedCourierBag(bag); setCourierBagError(null); }}
                      isLoading={isLoadingCourierBags}
                    />
                    {courierBagError && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" />
                        {courierBagError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <FieldRow label="Category">
                {isLoadingItems ? (
                  <div className="flex h-9 items-center gap-2 text-xs text-gray-500">
                    <RefreshCwIcon className="h-3.5 w-3.5 animate-spin text-teal-500" />
                    Loading…
                  </div>
                ) : (
                  <select
                    value={selectedCategoryId}
                    onChange={(e) =>
                      handleCategoryChange(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className={selectCls}
                  >
                    {subCategories.map((cat) => (
                      <option key={cat.subItemCategoryId} value={cat.subItemCategoryId}>
                        {cat.subItemCategoryName}
                      </option>
                    ))}
                  </select>
                )}
              </FieldRow>

              <FieldRow label="Select Item">
                {isLoadingItems ? (
                  <div className="flex h-9 items-center gap-2 text-xs text-gray-500">
                    <RefreshCwIcon className="h-3.5 w-3.5 animate-spin text-teal-500" />
                    Loading items…
                  </div>
                ) : (
                  <select
                    value={selectedItemId}
                    onChange={(e) => {
                      setSelectedItemId(Number(e.target.value));
                      // Clear stock error when item changes
                      setStockError(null);
                      setStockDetails(null);
                    }}
                    disabled={filteredItems.length === 0}
                    className={`${selectCls} ${filteredItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {filteredItems.length === 0 ? (
                      <option value="">No items in this category</option>
                    ) : (
                      filteredItems.map((item) => (
                        <option key={item.itemId} value={item.itemId}>
                          {item.itemName}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </FieldRow>

              <FieldRow label="Qty">
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => {
                    setQty(parseInt(e.target.value) || 1);
                    // Clear stock error when qty changes
                    setStockError(null);
                    setStockDetails(null);
                  }}
                  className={inputCls}
                />
              </FieldRow>
            </div>

            {/* ── Action buttons row ── */}
            <div className="flex justify-end gap-2 border-b border-gray-100 pb-3">
              <button
                onClick={() => { setCart([]); setWeight(0); }}
                className="flex items-center rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              >
                <Trash2Icon className="mr-1.5 h-3.5 w-3.5" /> Remove All
              </button>
              <button
                onClick={handleAddItem}
                disabled={!selectedItem || isCheckingStock}
                className="flex w-36 items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCheckingStock ? (
                  <>
                    <RefreshCwIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                    Add Item
                  </>
                )}
              </button>
            </div>

            {/* ── Stock check feedback ── */}
            {(isCheckingStock || stockError) && (
              <div className="mt-3">
                {isCheckingStock ? (
                  <div className="flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5 text-xs text-teal-700">
                    <RefreshCwIcon className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>Checking stock availability…</span>
                  </div>
                ) : stockError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 overflow-hidden">
                    {/* Error header */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-500" />
                        <span className="text-xs font-semibold text-red-700 truncate">{stockError}</span>
                      </div>
                      <button
                        onClick={() => { setStockError(null); setStockDetails(null); }}
                        className="ml-2 shrink-0 text-red-400 hover:text-red-600 transition-colors"
                        title="Dismiss"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Ingredient breakdown table */}
                    {stockDetails && stockDetails.length > 0 && (
                      <div className="border-t border-red-100 px-3 pb-3 pt-2">
                        <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-2">
                          Ingredient Breakdown
                        </p>
                        <div className="space-y-1.5">
                          {stockDetails.map((s) => (
                            <div
                              key={s.subItemId}
                              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${
                                s.sufficient
                                  ? 'bg-green-50 border border-green-100'
                                  : 'bg-red-100 border border-red-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.sufficient ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className={`font-medium truncate ${s.sufficient ? 'text-green-800' : 'text-red-800'}`}>
                                  {s.subItemName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className={`font-mono text-[11px] ${s.sufficient ? 'text-green-700' : 'text-red-700'}`}>
                                  <span className={`font-bold ${s.sufficient ? 'text-green-800' : 'text-red-600'}`}>
                                    {s.availableQty}
                                  </span>
                                  <span className="text-gray-400 mx-0.5">/</span>
                                  {s.requiredQty}
                                </span>
                                {s.sufficient ? (
                                  <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                ) : (
                                  <XCircleIcon className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] text-red-400">
                          Available / Required quantity shown per ingredient
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

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
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900">{item.name}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900">{item.qty}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-900">{item.unitPrice.toFixed(2)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs">
                            {discountMode === 'item' ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.discountType === 'pct' ? 100 : undefined}
                                    value={item.discountType === 'pct'
                                      ? (item.discount / (item.unitPrice * item.qty) * 100 || 0)
                                      : item.discount}
                                    onChange={(e) =>
                                      handleItemDiscountChange(item.id, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-16 rounded border border-gray-300 px-1.5 py-1 text-xs focus:border-teal-500 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleItemDiscountTypeChange(item.id, 'amount')}
                                    className={`px-1.5 py-1 rounded text-xs font-medium border ${
                                      item.discountType === 'amount'
                                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}
                                  >Rs</button>
                                  <button
                                    onClick={() => handleItemDiscountTypeChange(item.id, 'pct')}
                                    className={`px-1.5 py-1 rounded text-xs font-medium border ${
                                      item.discountType === 'pct'
                                        ? 'bg-teal-50 text-teal-700 border-teal-300'
                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}
                                  >%</button>
                                </div>
                                {item.discountType === 'pct' && item.discount > 0 && (
                                  <span className="text-teal-600 text-xs">= Rs {item.discount.toFixed(2)}</span>
                                )}
                              </div>
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

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">

              <FieldRow label="Order Type">
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className={selectCls}>
                  {orderTypes.length === 0 ? (
                    <option value="">Loading…</option>
                  ) : (
                    orderTypes.map((ot) => (
                      <option key={ot.id} value={ot.type}>{ot.type}</option>
                    ))
                  )}
                </select>
              </FieldRow>

              <FieldRow label="Weight (g)">
                <input
                  type="number"
                  value={weight}
                  readOnly
                  className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600"
                />
              </FieldRow>

              <FieldRow label="Payment Type">
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={selectCls}>
                  {paymentTypeOptions.length === 0 ? (
                    <option value="">Loading…</option>
                  ) : (
                    paymentTypeOptions.map((pt) => (
                      <option key={pt.paymentTypeId} value={pt.paymentType}>{pt.paymentType}</option>
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
                      <span className="ml-1 text-xs text-gray-400 font-normal">({weightKg}kg)</span>
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

                {/* ── Courier Bag summary line ── */}
                {showCourierBags && (
                  <div className="flex justify-between items-center text-sm border-t border-teal-200 pt-2">
                    <span className="font-medium text-teal-700 flex items-center gap-1.5">
                      <ShoppingBagIcon className="h-3.5 w-3.5" />
                      Courier Bag :
                    </span>
                    {selectedCourierBag ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-teal-800">
                          {selectedCourierBag.itemName}
                        </span>
                        <button
                          onClick={() => setSelectedCourierBag(null)}
                          className="text-teal-400 hover:text-teal-600 transition-colors"
                          title="Remove bag"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">None selected</span>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-teal-200 flex justify-between items-center text-base">
                  <span className="font-bold text-red-600">Grand Total :</span>
                  <span className="font-bold text-red-600">{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleSaveOrder}
                disabled={isSaving || !!phoneOneError || !!phoneTwoError}
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
                value: paymentTypeFilter,
                onChange: (val) => setPaymentTypeFilter(val),
                options: [
                  ...paymentTypeOptions.map((pt) => ({
                    label: pt.paymentType,
                    value: pt.paymentType.toLowerCase(),
                  })),
                ],
              },
            ]}
            totalCount={filteredOrders.length}
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
                <DataTable
                  columns={orderColumns}
                  data={filteredOrders}
                  selectedRow={selectedOrder}
                  onRowClick={setSelectedOrder}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}