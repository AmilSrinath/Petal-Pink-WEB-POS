import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircleIcon, XIcon, ChevronRightIcon, ChevronLeftIcon,
  SearchIcon, PlusIcon, MinusIcon, TrashIcon, PackageIcon,
} from 'lucide-react';
import { DataTable, Column } from '../../components/DataTable';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MainCategory {
  mainItemCategoryId: number;
  mainItemCategoryName: string;
}

interface SubCategory {
  subItemCategoryId: number;
  mainItemCategoryId: number;
  subItemCategoryName: string;
}

interface UnitType {
  unitTypeId: number;
  unitType: string;
  status: number;
}

interface StockLocation {
  stockCategoryId: number;
  stockName: string;
  location: string;
  status: number;
  userId: number;
  visible: number;
}

interface Supplier {
  supplierId: number;
  salesmanName: string;
  companyName: string;
  brandName: string;
  telephone: string;
  phone: string;
  addree: string;
  gmail: string;
  status: number;
  userId: number;
  visible: number;
}

interface Item {
  itemBarCode: string;
  itemId: number;
  itemName: string;
  itemCodePrefix: string;
  unitType: string;
  unitTypeId: number;
  costPrice: number;
  unitPrice: number;
  mainItemCategoryId: number;
  subItemCategoryId: number;
  lastGrnPrice: number | null;
}

interface Stock {
  stockId: number;
  itemId: number;
  stockCategoryId?: number;
}

interface SelectedItem {
  itemId: number;
  stockId: number;
  itemName: string;
  itemCodePrefix: string;
  unitType: string;
  unitTypeId: number;
  stockCategoryId: number;
  costPrice: number;
  retailPrice: number;
  wholeSalePrice: number;
  quantity: number;
  discount: number;
  expDate: string;
  isReleaseForSell: number;
  poNo: string;
  remark: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let _toastId = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg pointer-events-auto
            min-w-[300px] max-w-sm border
            ${t.type === 'error' ? 'bg-white border-red-100' : 'bg-white border-green-100'}`}
          style={{ animation: 'slideInRight 0.25s ease' }}
        >
          <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
            ${t.type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
            {t.type === 'error' ? (
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${t.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
              {t.type === 'error' ? 'Error' : 'Success'}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">{t.message}</p>
          </div>
          <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Default form ─────────────────────────────────────────────────────────────

const defaultForm = {
  invoiceNo: '',
  supplierId: '',
  stockLocationId: '',
  createdDate: new Date().toISOString().split('T')[0],
  status: 1,
  userId: 1,
  visible: 1,
};

// ─── Default batch item extras ────────────────────────────────────────────────

function defaultBatchExtras(): Omit<SelectedItem,
  'itemId' | 'stockId' | 'itemName' | 'itemCodePrefix' | 'unitType' | 'unitTypeId' | 'stockCategoryId' | 'costPrice'
> {
  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 1);
  const expStr = exp.toISOString().slice(0, 16);
  return {
    retailPrice: 0,
    wholeSalePrice: 0,
    quantity: 1,
    discount: 0,
    expDate: expStr,
    isReleaseForSell: 1,
    poNo: '',
    remark: '',
  };
}

// Helper above your component or inside it
function getCompatibleUnitTypes(unitTypes: UnitType[], itemUnitType: string): UnitType[] {
  const type = itemUnitType.toLowerCase();
  if (type === 'ml') return unitTypes.filter(u => ['ml', 'l'].includes(u.unitType.toLowerCase()));
  if (type === 'g')  return unitTypes.filter(u => ['g', 'kg'].includes(u.unitType.toLowerCase()));
  if (type === 'unit') return unitTypes.filter(u => u.unitType.toLowerCase() === 'unit');
  return unitTypes; // fallback: show all
}

// ─── Unit conversion map ──────────────────────────────────────────────────────

const UNIT_CONVERSIONS: Record<number, { baseUnitTypeId: number; multiplier: number }> = {
  1: { baseUnitTypeId: 1, multiplier: 1 },     // No Conversion
  2: { baseUnitTypeId: 2, multiplier: 1 },     // ml → ml
  3: { baseUnitTypeId: 3, multiplier: 1 },     // g  → g
  4: { baseUnitTypeId: 4, multiplier: 1 },     // unit → unit
  5: { baseUnitTypeId: 3, multiplier: 1000 },  // kg → g
  6: { baseUnitTypeId: 2, multiplier: 1000 },  // l  → ml
};

function convertToBaseUnit(qty: number, unitTypeId: number): { qty: number; unitTypeId: number } {
  const conv = UNIT_CONVERSIONS[unitTypeId];
  if (!conv) return { qty, unitTypeId };
  return { qty: qty * conv.multiplier, unitTypeId: conv.baseUnitTypeId };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8080';

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['GRN Details', 'Select Items', 'Batch Info', 'Review & Save'];

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 px-6 py-4 border-b border-gray-100 bg-gray-50">
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${i < step ? 'bg-teal-500 text-white' : i === step ? 'bg-teal-600 text-white ring-4 ring-teal-100' : 'bg-gray-200 text-gray-400'}`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-teal-700' : i < step ? 'text-teal-500' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-teal-400' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Field label ──────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-gray-500 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Input base class ─────────────────────────────────────────────────────────

const inputCls = 'block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white';
const inputErrCls = 'block w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300 bg-red-50/30';
const selectCls = inputCls;
const selectErrCls = inputErrCls;

// ─── Main export ──────────────────────────────────────────────────────────────

export function GRNListPage() {
  const [grns, setGrns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState(defaultForm);

  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedMain, setSelectedMain] = useState<number | null>(null);
  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add barcode state near other state declarations
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  const showToast = (type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  const backdropRef = useRef<HTMLDivElement>(null);

  // ── Load GRNs + suppliers on mount ──────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetchJson(`${BASE}/api/grn`),
      fetchJson(`${BASE}/api/suppliers`),
    ])
      .then(([grnsData, suppliersData]) => {
        setGrns(grnsData);
        setSuppliers(suppliersData);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  // ── Load lookup data when modal opens ────────────────────────────────────────

  useEffect(() => {
    if (!showModal) return;
    Promise.all([
      fetchJson(`${BASE}/api/categories`),
      fetchJson(`${BASE}/api/sub-categories`),
      fetchJson(`${BASE}/api/items`),
      fetchJson(`${BASE}/api/stocks`),
      fetchJson(`${BASE}/api/unit-types`),
      fetchJson(`${BASE}/api/stock-location`),
    ]).then(([mc, sc, items, stocksData, utData, locData]) => {
      setMainCategories(mc);
      setSubCategories(sc);
      setAllItems(items);
      setStocks(stocksData);
      setUnitTypes(utData);
      setStockLocations(locData);
    }).catch(() => {/* non-fatal */});
  }, [showModal]);

  // ── Escape key ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    if (showModal) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showModal]);

  // ── Derived: filtered items ──────────────────────────────────────────────────

  const filteredItems = allItems.filter(item => {
    const matchMain = selectedMain === null || item.mainItemCategoryId === selectedMain;
    const matchSub = selectedSub === null || item.subItemCategoryId === selectedSub;
    const matchSearch = !search
      || item.itemName.toLowerCase().includes(search.toLowerCase())
      || item.itemCodePrefix.toLowerCase().includes(search.toLowerCase())
      || String(item.itemBarCode ?? '').toLowerCase().includes(search.toLowerCase());
    return matchMain && matchSub && matchSearch;
  });

  const filteredSubs = subCategories.filter(s =>
    selectedMain === null || s.mainItemCategoryId === selectedMain
  );

  // ── Computed totals ──────────────────────────────────────────────────────────

  const totalPrice = selectedItems.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
  const totalDiscount = selectedItems.reduce((sum, i) => sum + (i.discount || 0), 0);
  const grandTotal = totalPrice - totalDiscount;

  // ── Step 2 validation ────────────────────────────────────────────────────────

  const isStep2Valid = selectedItems.every(item =>
    item.costPrice > 0 &&
    item.retailPrice > 0
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleItem = (item: Item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.itemId === item.itemId);
      if (exists) return prev.filter(i => i.itemId !== item.itemId);
      const stock = stocks.find(s => s.itemId === item.itemId);

      // Auto-select the unit type that matches the item's unitType string
      const matchedUnit = unitTypes.find(u => u.unitType.toLowerCase() === item.unitType.toLowerCase());

      return [...prev, {
        itemId: item.itemId,
        stockId: stock?.stockId ?? 0,
        itemName: item.itemName,
        itemCodePrefix: item.itemCodePrefix,
        unitType: item.unitType,
        unitTypeId: matchedUnit?.unitTypeId ?? 0,
        stockCategoryId: stock?.stockCategoryId ?? item.subItemCategoryId,
        costPrice: 0,
        retailPrice: 0,
        wholeSalePrice: 0,
        ...defaultBatchExtras(),
      }];
    });
  };

  const updateItem = (itemId: number, field: keyof SelectedItem, value: any) => {
    setSelectedItems(prev => prev.map(i => i.itemId === itemId ? { ...i, [field]: value } : i));
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(prev => prev.filter(i => i.itemId !== itemId));
  };

  // ── Convert datetime-local → DB format ───────────────────────────────────────

  const toDbDateTime = (localDt: string): string => {
    return localDt.replace('T', ' ') + ':00';
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        grn: {
          invoiceNo: formData.invoiceNo,
          supplierId: parseInt(formData.supplierId),
          totalPrice,
          totalDiscount,
          createdDate: formData.createdDate,
          status: formData.status,
          stockLocationId: parseInt(formData.stockLocationId),
          userId: formData.userId,
          visible: formData.visible,
        },
        batchItems: selectedItems.map(item => {
          const { qty: convertedQty, unitTypeId: baseUnitTypeId } = convertToBaseUnit(
            item.quantity,
            item.unitTypeId,
          );
          return {
            itemId: item.itemId,
            costPrice: item.costPrice,
            retailPrice: item.retailPrice,
            wholeSalePrice: item.wholeSalePrice,
            expDate: toDbDateTime(item.expDate),
            isReleaseForSell: item.isReleaseForSell,
            poNo: item.poNo,
            unitType: baseUnitTypeId,
            isActive: 1,
            userId: formData.userId,
            remark: item.remark,
            plusQty: convertedQty,
          };
        }),
      };

      const res = await fetch(`${BASE}/api/grn/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
      fetchJson(`${BASE}/api/grn`).then(setGrns).catch(() => {});
      setTimeout(handleClose, 2200);
    } catch {
      showToast('error', 'Failed to create GRN transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setFormData(defaultForm);
    setSelectedItems([]);
    setSelectedMain(null);
    setSelectedSub(null);
    setSearch('');
    setStep(0);
    setSubmitted(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) handleClose();
  };

  // ── Status helpers ────────────────────────────────────────────────────────────

  const getStatusColor = (status: number) => {
    const colors: Record<number, string> = {
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: number) => {
    const labels: Record<number, string> = { 1: 'Pending', 2: 'Verified', 3: 'Completed' };
    return labels[status] || 'Unknown';
  };

  const columns: Column<any>[] = [
    { header: 'GRN ID', accessor: 'grnId' },
    { header: 'Invoice No', accessor: 'invoiceNo' },
    { header: 'Supplier ID', accessor: 'supplierId' },
    { header: 'Total Price', accessor: (row) => `Rs. ${row.totalPrice?.toFixed(2) ?? '0.00'}` },
    { header: 'Discount', accessor: (row) => `Rs. ${row.totalDiscount?.toFixed(2) ?? '0.00'}` },
    { header: 'Date', accessor: 'createdDate' },
    {
      header: 'Status', accessor: (row) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(row.status)}`}>
          {getStatusLabel(row.status)}
        </span>
      )
    },
  ];

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500">Loading GRNs...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Good Receive Notes</h2>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            + Create GRN
          </button>
        </div>
        <DataTable columns={columns} data={grns} />
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div
          ref={backdropRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <div
            className="relative w-full rounded-xl bg-white shadow-2xl flex flex-col"
            style={{
              maxWidth: step === 1 ? '900px' : step === 2 ? '860px' : '660px',
              maxHeight: '92vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Create Good Receive Note</h3>
              <button onClick={handleClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Step bar */}
            {!submitted && <StepBar step={step} />}

            {/* Body */}
            <div className="overflow-y-auto flex-1">

              {/* ── Success ── */}
              {submitted ? (
                <div className="flex flex-col items-center py-16 px-6">
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircleIcon className="h-12 w-12 text-green-500" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">GRN Created Successfully</h4>
                  <p className="text-sm text-gray-500 mt-2">
                    Transaction recorded with {selectedItems.length} batch item(s).
                  </p>
                  <p className="text-sm font-medium text-teal-700 mt-1">Total: Rs. {grandTotal.toFixed(2)}</p>
                </div>

              ) : step === 0 ? (
                /* ── Step 0: GRN Details ── */
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Invoice No</FieldLabel>
                      <input
                        type="text" name="invoiceNo" value={formData.invoiceNo}
                        onChange={handleChange} placeholder="INV-001"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <FieldLabel required>Supplier</FieldLabel>
                      <select name="supplierId" value={formData.supplierId} onChange={handleChange} className={selectCls}>
                        <option value="">Select supplier</option>
                        {suppliers.map(s => (
                          <option key={s.supplierId} value={s.supplierId}>
                            {s.companyName || s.salesmanName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel required>Stock Location</FieldLabel>
                      <select name="stockLocationId" value={formData.stockLocationId} onChange={handleChange} className={selectCls}>
                        <option value="">Select location</option>
                        {stockLocations.map(loc => (
                          <option key={loc.stockCategoryId} value={loc.stockCategoryId}>
                            {loc.stockName} — {loc.location}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Receive Date</FieldLabel>
                      <input
                        type="date" name="createdDate" value={formData.createdDate}
                        onChange={handleChange} className={inputCls}
                      />
                    </div>
                  </div>
                </div>

              ) : step === 1 ? (
                /* ── Step 1: Item Selection ── */
                <div className="flex h-full" style={{ minHeight: '460px' }}>
                  {/* Left: Categories */}
                  <div className="w-48 border-r border-gray-100 bg-gray-50 shrink-0 overflow-y-auto">
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Category</p>
                      <button
                        onClick={() => { setSelectedMain(null); setSelectedSub(null); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                          ${selectedMain === null ? 'bg-teal-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        All
                      </button>
                      {mainCategories.map(mc => (
                        <button
                          key={mc.mainItemCategoryId}
                          onClick={() => { setSelectedMain(mc.mainItemCategoryId); setSelectedSub(null); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                            ${selectedMain === mc.mainItemCategoryId ? 'bg-teal-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          {mc.mainItemCategoryName}
                        </button>
                      ))}
                    </div>
                    {filteredSubs.length > 0 && (
                      <div className="p-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sub Category</p>
                        <button
                          onClick={() => setSelectedSub(null)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 transition-colors
                            ${selectedSub === null ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          All
                        </button>
                        {filteredSubs.map(sc => (
                          <button
                            key={sc.subItemCategoryId}
                            onClick={() => setSelectedSub(sc.subItemCategoryId)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 transition-colors
                              ${selectedSub === sc.subItemCategoryId ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                          >
                            {sc.subItemCategoryName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Items */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const trimmed = search.trim();
                              if (!trimmed) return;
                              const match = allItems.find(
                                item => item.itemCodePrefix.toLowerCase() === trimmed.toLowerCase()
                              );
                              if (match) {
                                if (!selectedItems.some(i => i.itemId === match.itemId)) {
                                  toggleItem(match);
                                }
                                setSearch('');
                              }
                            }
                          }}
                          placeholder="Search by name, code or scan barcode..."
                          className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {filteredItems.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-gray-400">No items found</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {filteredItems.map(item => {
                            const isSelected = selectedItems.some(i => i.itemId === item.itemId);
                            return (
                              <button
                                key={item.itemId}
                                onClick={() => toggleItem(item)}
                                className={`relative text-left p-3 rounded-lg border-2 transition-all
                                  ${isSelected
                                    ? 'border-teal-500 bg-teal-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'}`}
                              >
                                {isSelected && (
                                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </span>
                                )}
                                <p className="text-xs text-gray-400 font-mono mb-1">{item.itemCodePrefix}</p>
                                <p className="text-sm font-medium text-gray-800 leading-snug">{item.itemName}</p>
                                <p className="text-xs text-gray-500 mt-1">Rs. {item.unitPrice?.toFixed(2)}</p>
                                <span className="mt-1 inline-block text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                                  {item.unitType}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {selectedItems.length === 0 ? 'No items selected' : `${selectedItems.length} item(s) selected`}
                      </p>
                    </div>
                  </div>
                </div>

              ) : step === 2 ? (
                /* ── Step 2: Batch Info ── */
                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Enter batch details for each item</p>
                    {!isStep2Valid && (
                      <p className="text-xs text-red-500 font-medium">
                        ⚠ Fill all required fields to continue
                      </p>
                    )}
                  </div>
                  {selectedItems.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-gray-400 text-sm">
                      No items selected. Go back and select items.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedItems.map((item, idx) => {
                        const subtotal = item.costPrice * item.quantity;

                        // ── Conversion hint ──────────────────────────────────
                        const conv = convertToBaseUnit(item.quantity, item.unitTypeId);
                        const baseUnitLabel = unitTypes.find(u => u.unitTypeId === conv.unitTypeId)?.unitType ?? '';
                        const needsConversion = item.unitTypeId > 0 && conv.unitTypeId !== item.unitTypeId;

                        // ── Dynamic qty step ─────────────────────────────────
                        const qtyStep = [2, 3, 5, 6].includes(item.unitTypeId) ? 0.1 : 1;

                        // ── Per-field error flags ────────────────────────────
                        const costErr = item.costPrice <= 0;
                        const retailErr = item.retailPrice <= 0;

                        return (
                          <div key={item.itemId} className="rounded-xl border border-gray-200 overflow-hidden">
                            {/* Item header */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                                  ${costErr || retailErr ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700'}`}>
                                  {costErr || retailErr ? '!' : idx + 1}
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{item.itemName}</span>
                                  <span className="ml-2 text-xs text-gray-400 font-mono">{item.itemCodePrefix}</span>
                                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">{item.unitType}</span>
                                </div>
                              </div>
                              <button onClick={() => removeItem(item.itemId)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Fields grid */}
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

                              {/* Quantity */}
                              <div>
                                <FieldLabel>Quantity</FieldLabel>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => updateItem(item.itemId, 'quantity', parseFloat(Math.max(0.001, item.quantity - qtyStep).toFixed(3)))}
                                    className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border-r border-gray-200"
                                  >
                                    <MinusIcon className="h-3 w-3" />
                                  </button>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    min={0.001}
                                    step={qtyStep}
                                    onChange={e => updateItem(item.itemId, 'quantity', Math.max(0.001, parseFloat(e.target.value) || 0.001))}
                                    className="flex-1 text-center text-sm py-1.5 w-0 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => updateItem(item.itemId, 'quantity', parseFloat((item.quantity + qtyStep).toFixed(3)))}
                                    className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border-l border-gray-200"
                                  >
                                    <PlusIcon className="h-3 w-3" />
                                  </button>
                                </div>
                                {needsConversion && (
                                  <p className="mt-1 text-xs text-teal-600 font-medium">
                                    = {conv.qty.toLocaleString()} {baseUnitLabel} saved to stock
                                  </p>
                                )}
                              </div>

                              {/* Cost Price */}
                              <div>
                                <FieldLabel required>Cost Price (Rs.)</FieldLabel>
                                <input
                                  type="number"
                                  value={item.costPrice}
                                  min={0}
                                  step="0.01"
                                  onChange={e => updateItem(item.itemId, 'costPrice', parseFloat(e.target.value) || 0)}
                                  className={costErr ? inputErrCls : inputCls}
                                />
                                {costErr && (
                                  <p className="mt-1 text-xs text-red-500">Cost price is required</p>
                                )}
                                {(() => {
                                  const lastPrice = allItems.find(i => i.itemId === item.itemId)?.lastGrnPrice;
                                  return lastPrice != null && lastPrice > 0 ? (
                                    <p className="mt-1 text-xs text-indigo-500 font-medium">
                                      Last GRN: Rs. {lastPrice.toFixed(2)}
                                      <button
                                        type="button"
                                        onClick={() => updateItem(item.itemId, 'costPrice', lastPrice)}
                                        className="ml-1.5 text-indigo-400 hover:text-indigo-600 underline underline-offset-2"
                                      >
                                        use
                                      </button>
                                    </p>
                                  ) : lastPrice === 0 || lastPrice === null ? (
                                    <p className="mt-1 text-xs text-gray-400">No previous GRN price</p>
                                  ) : null;
                                })()}
                              </div>

                              {/* Retail Price */}
                              <div>
                                <FieldLabel required>Retail Price (Rs.)</FieldLabel>
                                <input
                                  type="number"
                                  value={item.retailPrice}
                                  min={0}
                                  step="0.01"
                                  onChange={e => updateItem(item.itemId, 'retailPrice', parseFloat(e.target.value) || 0)}
                                  className={retailErr ? inputErrCls : inputCls}
                                />
                                {retailErr && (
                                  <p className="mt-1 text-xs text-red-500">Retail price is required</p>
                                )}
                              </div>

                              {/* Wholesale Price */}
                              <div>
                                <FieldLabel>Wholesale Price (Rs.)</FieldLabel>
                                <input
                                  type="number"
                                  value={item.wholeSalePrice}
                                  min={0}
                                  step="0.01"
                                  onChange={e => updateItem(item.itemId, 'wholeSalePrice', parseFloat(e.target.value) || 0)}
                                  className={inputCls}
                                />
                              </div>

                              {/* Expiry Date */}
                              <div>
                                <FieldLabel required>Expiry Date & Time</FieldLabel>
                                <input
                                  type="datetime-local"
                                  value={item.expDate}
                                  onChange={e => updateItem(item.itemId, 'expDate', e.target.value)}
                                  className={inputCls}
                                />
                              </div>

                              {/* PO No */}
                              <div>
                                <FieldLabel>PO Number</FieldLabel>
                                <input
                                  type="text"
                                  value={item.poNo}
                                  placeholder="PO-001"
                                  onChange={e => updateItem(item.itemId, 'poNo', e.target.value)}
                                  className={inputCls}
                                />
                              </div>

                              {/* Unit Type */}
                              <div>
                                <FieldLabel required>Unit Type</FieldLabel>
                                <select
                                  value={item.unitTypeId}
                                  onChange={e => updateItem(item.itemId, 'unitTypeId', parseInt(e.target.value))}
                                  className={selectCls}
                                >
                                  {/* <option value={0}>Select unit type</option> */}
                                  {getCompatibleUnitTypes(unitTypes, item.unitType).map(ut => (
                                    <option key={ut.unitTypeId} value={ut.unitTypeId}>{ut.unitType}</option>
                                  ))}
                                </select>
                                {needsConversion && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    Saves as: <span className="font-medium text-gray-500">{baseUnitLabel}</span>
                                  </p>
                                )}
                              </div>

                              {/* Discount */}
                              <div>
                                <FieldLabel>Discount (Rs.)</FieldLabel>
                                <input
                                  type="number"
                                  value={item.discount}
                                  min={0}
                                  step="0.01"
                                  max={subtotal}
                                  onChange={e => updateItem(item.itemId, 'discount', Math.min(subtotal, parseFloat(e.target.value) || 0))}
                                  className="block w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-orange-50/40"
                                />
                              </div>

                              {/* Release for sell */}
                              <div className="flex flex-col">
                                <FieldLabel>Release for Sell</FieldLabel>
                                <div className="flex items-center gap-3 mt-1.5">
                                  {[{ val: 1, label: 'Yes' }, { val: 0, label: 'No' }].map(opt => (
                                    <button
                                      key={opt.val}
                                      type="button"
                                      onClick={() => updateItem(item.itemId, 'isReleaseForSell', opt.val)}
                                      className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors
                                        ${item.isReleaseForSell === opt.val
                                          ? opt.val === 1
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'bg-red-400 border-red-400 text-white'
                                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Remark */}
                              <div className="sm:col-span-3 lg:col-span-3">
                                <FieldLabel>Remark</FieldLabel>
                                <input
                                  type="text"
                                  value={item.remark}
                                  placeholder="Optional note for this batch"
                                  onChange={e => updateItem(item.itemId, 'remark', e.target.value)}
                                  className={inputCls}
                                />
                              </div>
                            </div>

                            {/* Subtotal footer */}
                            <div className="flex items-center justify-end gap-4 px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                              {item.discount > 0 && (
                                <span>
                                  Gross: <span className="line-through font-medium text-gray-600">Rs. {subtotal.toFixed(2)}</span>
                                  <span className="ml-1 text-orange-600">- Rs. {item.discount.toFixed(2)}</span>
                                </span>
                              )}
                              <span>
                                Net: <span className="font-semibold text-gray-700">Rs. {(subtotal - item.discount).toFixed(2)}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              ) : (
                /* ── Step 3: Review & Save ── */
                <div className="px-6 py-5">
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 grid grid-cols-2 gap-2 text-sm mb-5">
                    <div><span className="text-gray-500">Invoice:</span> <span className="font-medium">{formData.invoiceNo}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formData.createdDate}</span></div>
                    <div>
                      <span className="text-gray-500">Supplier:</span>{' '}
                      <span className="font-medium">
                        {suppliers.find(s => String(s.supplierId) === formData.supplierId)?.companyName || formData.supplierId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>{' '}
                      <span className="font-medium">
                        {stockLocations.find(l => String(l.stockCategoryId) === formData.stockLocationId)?.stockName || formData.stockLocationId}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-gray-700 mb-3">Batch Items ({selectedItems.length})</p>
                  <div className="space-y-2 mb-5">
                    {selectedItems.map((item) => {
                      const conv = convertToBaseUnit(item.quantity, item.unitTypeId);
                      const baseUnitLabel = unitTypes.find(u => u.unitTypeId === conv.unitTypeId)?.unitType ?? '';
                      const selectedUnitLabel = unitTypes.find(u => u.unitTypeId === item.unitTypeId)?.unitType ?? '';
                      const needsConversion = conv.unitTypeId !== item.unitTypeId;

                      return (
                        <div key={item.itemId} className="rounded-lg border border-gray-200 px-4 py-3 bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <PackageIcon className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{item.itemName}</p>
                                <p className="text-xs text-gray-400 font-mono">{item.itemCodePrefix}</p>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 shrink-0 ml-4">
                              {needsConversion ? (
                                <>
                                  <p>Input: <span className="font-semibold text-gray-700">{item.quantity} {selectedUnitLabel}</span></p>
                                  <p>Saved: <span className="font-semibold text-teal-600">{conv.qty.toLocaleString()} {baseUnitLabel}</span></p>
                                </>
                              ) : (
                                <p>Qty: <span className="font-semibold text-gray-700">{item.quantity} {selectedUnitLabel}</span></p>
                              )}
                              <p>Net: <span className="font-semibold text-gray-700">
                                Rs. {(item.costPrice * item.quantity - item.discount).toFixed(2)}
                              </span></p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>Cost: Rs. {item.costPrice.toFixed(2)}</span>
                            <span>Retail: Rs. {item.retailPrice.toFixed(2)}</span>
                            <span>Wholesale: Rs. {item.wholeSalePrice.toFixed(2)}</span>
                            <span>Exp: {item.expDate.replace('T', ' ')}</span>
                            <span>PO: {item.poNo || '—'}</span>
                            <span className={item.isReleaseForSell ? 'text-green-600 font-medium' : 'text-red-500'}>
                              {item.isReleaseForSell ? '✓ For Sale' : '✗ Not for sale'}
                            </span>
                            {item.remark && (
                              <span className="col-span-3 text-gray-400 italic">"{item.remark}"</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Totals */}
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center justify-between text-sm bg-white">
                      <span className="text-gray-500">Subtotal (Cost)</span>
                      <span className="font-medium text-gray-700">Rs. {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="px-4 py-2.5 flex items-center justify-between text-sm bg-orange-50 border-t border-gray-100">
                      <span className="text-orange-600 font-medium">
                        Total Discount
                        <span className="ml-1.5 text-xs font-normal text-orange-400">(auto-calculated)</span>
                      </span>
                      <span className="font-semibold text-orange-600">- Rs. {totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between bg-teal-50 border-t border-teal-100">
                      <span className="text-sm font-semibold text-teal-700">Grand Total</span>
                      <span className="text-lg font-bold text-teal-700">Rs. {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer navigation */}
            {!submitted && (
              <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 bg-white rounded-b-xl">
                <button
                  type="button"
                  onClick={() => step === 0 ? handleClose() : setStep(s => s - 1)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {step > 0 && <ChevronLeftIcon className="h-4 w-4" />}
                  {step === 0 ? 'Cancel' : 'Back'}
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    disabled={
                      (step === 0 && (!formData.invoiceNo || !formData.supplierId || !formData.stockLocationId)) ||
                      (step === 1 && selectedItems.length === 0) ||
                      (step === 2 && !isStep2Valid)
                    }
                    onClick={() => setStep(s => s + 1)}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting || selectedItems.length === 0}
                    onClick={handleSubmit}
                    className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save GRN Transaction'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}