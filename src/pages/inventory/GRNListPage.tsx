import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircleIcon, XIcon, ChevronRightIcon, ChevronLeftIcon,
  SearchIcon, PlusIcon, MinusIcon, TrashIcon, PackageIcon,
  SaveIcon, FileTextIcon, AlertTriangleIcon, ExternalLinkIcon,
  FolderOpenIcon, RefreshCwIcon, EyeIcon, SparklesIcon, PencilIcon,
} from 'lucide-react';
import { DataTable, Column } from '../../components/DataTable';
import { API_BASE_URL } from '../../config';

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

// ─── Drafts Storage Key & Type ────────────────────────────────────────────────

const DRAFTS_STORAGE_KEY = 'PETALPINK_GRN_DRAFTS';

interface GrnDraft {
  id: string;
  title: string;
  savedAt: string;
  step: number;
  formData: typeof defaultForm;
  selectedItems: SelectedItem[];
  itemCount: number;
  supplierName?: string;
  grandTotal: number;
}

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

// Helper to filter compatible unit types for an item
function getCompatibleUnitTypes(unitTypes: UnitType[], itemUnitType: string): UnitType[] {
  const type = (itemUnitType || '').trim().toLowerCase();
  if (['ml', 'l', 'liter', 'litre'].includes(type)) {
    const list = unitTypes.filter(u => ['ml', 'l', 'liter', 'litre'].includes(u.unitType.toLowerCase().trim()));
    if (list.length > 0) return list;
  }
  if (['g', 'kg', 'gram', 'kilogram'].includes(type)) {
    const list = unitTypes.filter(u => ['g', 'kg', 'gram', 'kilogram'].includes(u.unitType.toLowerCase().trim()));
    if (list.length > 0) return list;
  }
  if (['unit', 'pcs', 'nos', 'piece'].includes(type)) {
    const list = unitTypes.filter(u => ['unit', 'pcs', 'nos', 'piece'].includes(u.unitType.toLowerCase().trim()));
    if (list.length > 0) return list;
  }
  const exact = unitTypes.filter(u => u.unitType.toLowerCase().trim() === type);
  if (exact.length > 0) return exact;

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

// ─── Round to nearest 10 helper (e.g. 12348.78 -> 12350) ─────────────────────
function roundToNearestTen(val: number): number {
  if (!val || isNaN(val)) return 0;
  return Math.round(val / 10) * 10;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = `${API_BASE_URL}`;

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

const isSuperAdmin = (): boolean => {
  try {
    const username = (localStorage.getItem('username') || '').trim().toLowerCase();
    const roleId = localStorage.getItem('roleId');
    return username === 'super admin' || username === 'superadmin' || roleId === '1';
  } catch {
    return false;
  }
};

interface EditableGrnItem {
  profileId?: number;
  regId?: number;
  itemId: number;
  itemName: string;
  itemCodePrefix?: string;
  itemBarCode?: string;
  unitType?: string;
  unitTypeId?: number;
  quantity: number;
  costPrice: number;
  retailPrice: number;
  wholeSalePrice: number;
  expDate: string;
  isReleaseForSell: number;
  poNo: string;
  remark: string;
}

interface EditGrnFormData {
  grnId: number;
  invoiceNo: string;
  supplierId: number;
  stockLocationId: number;
  createdDate: string;
  totalDiscount: number;
  items: EditableGrnItem[];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function GRNListPage() {
  const [grns, setGrns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState(defaultForm);

  // ─── Draft State ────────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState<GrnDraft[]>(() => {
    try {
      const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [showClosePrompt, setShowClosePrompt] = useState(false);

  // ─── View GRN State ─────────────────────────────────────────────────────────
  const [viewGrn, setViewGrn] = useState<any | null>(null);
  const [viewItems, setViewItems] = useState<any[]>([]);
  const [loadingView, setLoadingView] = useState(false);

  // ─── Edit GRN State (Super Admin Only) ──────────────────────────────────────
  const [editGrn, setEditGrn] = useState<EditGrnFormData | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editItemSearch, setEditItemSearch] = useState('');
  const [showEditItemDropdown, setShowEditItemDropdown] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);

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

  // ── Load lookup data when modal opens or refreshed ──────────────────────────

  const fetchLookupData = async () => {
    try {
      const [mc, sc, items, stocksData, utData, locData, suppData] = await Promise.all([
        fetchJson(`${BASE}/api/categories`),
        fetchJson(`${BASE}/api/sub-categories`),
        fetchJson(`${BASE}/api/items`),
        fetchJson(`${BASE}/api/stocks`),
        fetchJson(`${BASE}/api/unit-types`),
        fetchJson(`${BASE}/api/stock-location`),
        fetchJson(`${BASE}/api/suppliers`),
      ]);
      setMainCategories(mc);
      setSubCategories(sc);
      setAllItems(items);
      setStocks(stocksData);
      setUnitTypes(utData);
      setStockLocations(locData);
      if (suppData && Array.isArray(suppData)) {
        setSuppliers(suppData);
      }
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    if (!showModal) return;
    fetchLookupData();
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

  const totalPrice = selectedItems.reduce((sum, i) => sum + roundToNearestTen(i.costPrice * i.quantity), 0);
  const totalDiscount = selectedItems.reduce((sum, i) => sum + (i.discount || 0), 0);
  const grandTotal = totalPrice - totalDiscount;

  // ── Step 2 validation ────────────────────────────────────────────────────────

  const isStep2Valid = selectedItems.every(item =>
    item.costPrice !== undefined &&
    item.costPrice !== null &&
    !isNaN(item.costPrice) &&
    item.costPrice >= 0 &&
    item.retailPrice !== undefined &&
    item.retailPrice !== null &&
    !isNaN(item.retailPrice) &&
    item.retailPrice >= 0
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
      cleanupActiveDraft();
      fetchJson(`${BASE}/api/grn`).then(setGrns).catch(() => {});
      setTimeout(forceCloseModal, 2200);
    } catch {
      showToast('error', 'Failed to create GRN transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Draft Actions ────────────────────────────────────────────────────────────

  const persistDrafts = (updated: GrnDraft[]) => {
    setDrafts(updated);
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to persist drafts', err);
    }
  };

  const saveCurrentAsDraft = (notify = true, closeAfter = false) => {
    const currentSupplier = suppliers.find(s => String(s.supplierId) === String(formData.supplierId));
    const supplierLabel = currentSupplier ? (currentSupplier.companyName || currentSupplier.salesmanName) : '';
    const now = new Date();
    const timeFormatted = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const draftTitle = formData.invoiceNo?.trim()
      ? `INV: ${formData.invoiceNo.trim()}`
      : `Draft (${timeFormatted})`;

    const draftId = activeDraftId || `draft_${Date.now()}`;

    const newDraft: GrnDraft = {
      id: draftId,
      title: draftTitle,
      savedAt: new Date().toISOString(),
      step,
      formData,
      selectedItems,
      itemCount: selectedItems.length,
      supplierName: supplierLabel,
      grandTotal,
    };

    const existingIndex = drafts.findIndex(d => d.id === draftId);
    let updatedDrafts: GrnDraft[];
    if (existingIndex >= 0) {
      updatedDrafts = [...drafts];
      updatedDrafts[existingIndex] = newDraft;
    } else {
      updatedDrafts = [newDraft, ...drafts];
    }

    persistDrafts(updatedDrafts);
    setActiveDraftId(draftId);

    if (notify) {
      showToast('success', `GRN draft "${draftTitle}" saved successfully!`);
    }

    if (closeAfter) {
      forceCloseModal();
    }
  };

  const resumeDraft = (draft: GrnDraft) => {
    setActiveDraftId(draft.id);
    setFormData(draft.formData || defaultForm);
    setSelectedItems(draft.selectedItems || []);
    setStep(draft.step ?? 0);
    setShowDraftsModal(false);
    setShowClosePrompt(false);
    setShowModal(true);
    fetchLookupData();
    showToast('success', `Draft "${draft.title}" resumed.`);
  };

  const deleteDraft = (draftId: string) => {
    const updated = drafts.filter(d => d.id !== draftId);
    persistDrafts(updated);
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
    }
    showToast('success', 'Draft deleted successfully.');
  };

  const cleanupActiveDraft = () => {
    if (activeDraftId) {
      const updated = drafts.filter(d => d.id !== activeDraftId);
      persistDrafts(updated);
      setActiveDraftId(null);
    }
  };

  const hasUnsavedChanges = () => {
    if (submitted) return false;
    const hasInvoice = !!formData.invoiceNo?.trim();
    const hasSupplier = !!formData.supplierId;
    const hasItems = selectedItems.length > 0;
    return hasInvoice || hasSupplier || hasItems;
  };

  const requestClose = () => {
    if (hasUnsavedChanges()) {
      setShowClosePrompt(true);
    } else {
      forceCloseModal();
    }
  };

  const forceCloseModal = () => {
    setShowModal(false);
    setShowClosePrompt(false);
    setActiveDraftId(null);
    setFormData(defaultForm);
    setSelectedItems([]);
    setSelectedMain(null);
    setSelectedSub(null);
    setSearch('');
    setStep(0);
    setSubmitted(false);
  };

  // ── Open View GRN Modal ──────────────────────────────────────────────────────

  const handleOpenView = async (grn: any) => {
    setViewGrn(grn);
    setViewItems([]);
    setLoadingView(true);
    try {
      const items = await fetchJson(`${BASE}/api/grn/${grn.grnId}/items`);
      setViewItems(items || []);
    } catch {
      showToast('error', 'Failed to load GRN items.');
    } finally {
      setLoadingView(false);
    }
  };

  // ── Open Edit GRN Modal (Super Admin Only) ───────────────────────────────────

  const handleOpenEdit = async (grn: any) => {
    if (!isSuperAdmin()) {
      showToast('error', 'Unauthorized: Only Super Admin can edit GRN records.');
      return;
    }
    setViewGrn(null);
    setLoadingEdit(true);
    try {
      const [items, utData, allItemsData] = await Promise.all([
        fetchJson(`${BASE}/api/grn/${grn.grnId}/items`),
        unitTypes.length > 0 ? Promise.resolve(unitTypes) : fetchJson(`${BASE}/api/unit-types`).catch(() => []),
        allItems.length > 0 ? Promise.resolve(allItems) : fetchJson(`${BASE}/api/items`).catch(() => []),
      ]);
      if (utData && Array.isArray(utData) && utData.length > 0) {
        setUnitTypes(utData);
      }
      if (allItemsData && Array.isArray(allItemsData) && allItemsData.length > 0) {
        setAllItems(allItemsData);
      }
      fetchLookupData();

      const catalog = (allItemsData && allItemsData.length > 0 ? allItemsData : allItems) || [];
      setEditGrn({
        grnId: grn.grnId,
        invoiceNo: grn.invoiceNo || '',
        supplierId: grn.supplierId || 0,
        stockLocationId: grn.stockLocationId || 1,
        createdDate: grn.createdDate || new Date().toISOString().split('T')[0],
        totalDiscount: grn.totalDiscount || 0,
        items: (items || []).map((it: any) => {
          const catItem = catalog.find((c: any) => c.itemId === it.itemId);
          return {
            profileId: it.profileId,
            regId: it.regId,
            itemId: it.itemId,
            itemName: it.itemName,
            itemCodePrefix: it.itemCodePrefix,
            itemBarCode: it.itemBarCode,
            unitType: it.unitTypeName || catItem?.unitType || (it.unitType ? String(it.unitType) : ''),
            unitTypeId: it.unitType ? Number(it.unitType) : (catItem?.unitTypeId || 1),
            quantity: it.quantity ?? 0,
            costPrice: it.costPrice ?? 0,
            retailPrice: it.retailPrice ?? 0,
            wholeSalePrice: it.wholeSalePrice ?? 0,
            expDate: it.expDate ? it.expDate.split(' ')[0] : '',
            isReleaseForSell: it.isReleaseForSell ?? 1,
            poNo: it.poNo || '',
            remark: it.remark || '',
          };
        }),
      });
    } catch {
      showToast('error', 'Failed to load GRN details for editing.');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleEditItemChange = (index: number, field: keyof EditableGrnItem, value: any) => {
    if (!editGrn) return;
    setEditGrn(prev => {
      if (!prev) return prev;
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };

  const handleEditRemoveItem = (index: number) => {
    if (!editGrn) return;
    setEditGrn(prev => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  };

  const handleEditAddItem = (item: Item) => {
    if (!editGrn) return;
    const exists = editGrn.items.some(i => i.itemId === item.itemId);
    if (exists) {
      showToast('error', `Item "${item.itemName}" is already in this GRN.`);
      return;
    }
    const compatible = getCompatibleUnitTypes(unitTypes, item.unitType);
    const defaultUnit = compatible.find(u => u.unitType.toLowerCase() === (item.unitType || '').toLowerCase()) || compatible[0];
    const newItem: EditableGrnItem = {
      itemId: item.itemId,
      itemName: item.itemName,
      itemCodePrefix: item.itemCodePrefix,
      itemBarCode: String(item.itemBarCode || ''),
      unitType: defaultUnit?.unitType || item.unitType || 'Unit',
      unitTypeId: defaultUnit?.unitTypeId ?? (item.unitTypeId || 1),
      quantity: 1,
      costPrice: item.costPrice || 0,
      retailPrice: item.unitPrice || 0,
      wholeSalePrice: 0,
      expDate: '',
      isReleaseForSell: 1,
      poNo: '',
      remark: '',
    };
    setEditGrn(prev => {
      if (!prev) return prev;
      return { ...prev, items: [...prev.items, newItem] };
    });
    setEditItemSearch('');
    setShowEditItemDropdown(false);
    showToast('success', `Added "${item.itemName}" to GRN.`);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGrn) return;
    if (!isSuperAdmin()) {
      showToast('error', 'Unauthorized: Only Super Admin can edit GRN records.');
      return;
    }
    if (!editGrn.invoiceNo.trim()) {
      showToast('error', 'Invoice Number is required.');
      return;
    }
    if (!editGrn.supplierId) {
      showToast('error', 'Please select a supplier.');
      return;
    }
    if (editGrn.items.length === 0) {
      showToast('error', 'GRN must contain at least one item.');
      return;
    }

    // Validate prices and quantities >= 0
    for (const it of editGrn.items) {
      if (it.quantity < 0) {
        showToast('error', `Quantity cannot be negative for "${it.itemName}".`);
        return;
      }
      if (it.costPrice < 0) {
        showToast('error', `Cost price cannot be negative for "${it.itemName}".`);
        return;
      }
      if (it.retailPrice < 0) {
        showToast('error', `Retail price cannot be negative for "${it.itemName}".`);
        return;
      }
    }

    const totalCost = editGrn.items.reduce((sum, it) => sum + roundToNearestTen((Number(it.costPrice) || 0) * (Number(it.quantity) || 0)), 0);
    const discount = Number(editGrn.totalDiscount) || 0;
    const loggedInUserId = parseInt(localStorage.getItem('userId') || '1', 10);

    const payload = {
      grnId: editGrn.grnId,
      invoiceNo: editGrn.invoiceNo.trim(),
      supplierId: Number(editGrn.supplierId),
      stockLocationId: Number(editGrn.stockLocationId),
      createdDate: editGrn.createdDate,
      totalPrice: totalCost,
      totalDiscount: discount,
      userId: loggedInUserId,
      items: editGrn.items.map(it => ({
        profileId: it.profileId,
        regId: it.regId,
        itemId: it.itemId,
        itemName: it.itemName,
        quantity: Number(it.quantity) || 0,
        costPrice: Number(it.costPrice) || 0,
        retailPrice: Number(it.retailPrice) || 0,
        wholeSalePrice: Number(it.wholeSalePrice) || 0,
        expDate: it.expDate,
        isReleaseForSell: it.isReleaseForSell,
        poNo: it.poNo,
        unitType: it.unitTypeId || 1,
        remark: it.remark,
      })),
    };

    setSubmittingEdit(true);
    try {
      const res = await fetch(`${BASE}/api/grn/transaction`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      showToast('success', `GRN #${editGrn.grnId} updated successfully by Super Admin!`);
      setEditGrn(null);
      fetchJson(`${BASE}/api/grn`).then(setGrns).catch(() => {});
    } catch (err) {
      console.error('Failed to update GRN:', err);
      showToast('error', 'Failed to update GRN. Please try again.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // ── Click outside to close edit item dropdown ─────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setShowEditItemDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Auto Invoice Number ───────────────────────────────────────────────────────

  const handleAutoInvoiceNo = async () => {
    try {
      const res = await fetch(`${BASE}/api/grn/next-invoice-no`);
      if (res.ok) {
        const code = await res.text();
        if (code && code.trim()) {
          setFormData(prev => ({ ...prev, invoiceNo: code.trim() }));
          showToast('success', `Generated Invoice No: ${code.trim()}`);
          return;
        }
      }
    } catch {
      // fallback
    }
    // Local fallback based on current grns list
    let maxNum = 0;
    grns.forEach(g => {
      if (g.invoiceNo) {
        const digits = g.invoiceNo.replace(/\D/g, '');
        if (digits) {
          const n = parseInt(digits, 10);
          if (!isNaN(n) && n > maxNum && n < 1000000) maxNum = n;
        }
      }
    });
    const nextNo = `INV-${String(maxNum + 1).padStart(4, '0')}`;
    setFormData(prev => ({ ...prev, invoiceNo: nextNo }));
    showToast('success', `Generated Invoice No: ${nextNo}`);
  };

  // ── Escape key ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editGrn) {
          setEditGrn(null);
        } else if (viewGrn) {
          setViewGrn(null);
        } else if (showClosePrompt) {
          setShowClosePrompt(false);
        } else if (showDraftsModal) {
          setShowDraftsModal(false);
        } else if (showModal) {
          requestClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showModal, showClosePrompt, showDraftsModal, viewGrn, editGrn, formData, selectedItems]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) requestClose();
  };

  const columns: Column<any>[] = [
    {
      header: 'Invoice No',
      accessor: (row) => (
        <span className="font-semibold font-mono text-gray-900">{row.invoiceNo || '—'}</span>
      ),
    },
    { header: 'Supplier', accessor: (row) => row.supplierName || '—' },
    {
      header: 'Location',
      accessor: (row) =>
        row.stockLocationName ||
        stockLocations.find((l) => l.stockCategoryId === row.stockLocationId)?.stockName ||
        '—',
    },
    { header: 'Total Price', accessor: (row) => `Rs. ${row.totalPrice?.toFixed(2) ?? '0.00'}` },
    { header: 'Discount', accessor: (row) => `Rs. ${row.totalDiscount?.toFixed(2) ?? '0.00'}` },
    { header: 'Date', accessor: 'createdDate' },
    {
      header: 'Action',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenView(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors shadow-2xs cursor-pointer"
            title="View GRN details and items"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
          {isSuperAdmin() && (
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors shadow-2xs cursor-pointer"
              title="Edit GRN (Super Admin Only)"
            >
              <PencilIcon className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>
      ),
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Good Receive Notes</h2>
            <p className="text-xs text-gray-500 mt-1">Receive stock inventory, assign batches, and record supplier invoices</p>
          </div>
          <div className="flex items-center gap-2">
            {drafts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDraftsModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 transition-colors shadow-xs"
              >
                <FileTextIcon className="h-4 w-4 text-amber-600" />
                <span>Drafts</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                  {drafts.length}
                </span>
              </button>
            )}
            <button
              onClick={() => {
                setActiveDraftId(null);
                setFormData(defaultForm);
                setSelectedItems([]);
                setStep(0);
                setShowModal(true);
              }}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create GRN</span>
            </button>
          </div>
        </div>

        {/* ── Active Drafts Notification Banner ── */}
        {drafts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0">
                <FileTextIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    You have {drafts.length} in-progress draft GRN{drafts.length > 1 ? 's' : ''}
                  </span>
                  <span className="bg-amber-200 text-amber-900 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Temporary Draft
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Latest: <span className="font-medium text-gray-800">{drafts[0].title}</span>
                  {drafts[0].supplierName ? ` • ${drafts[0].supplierName}` : ''}
                  {` • ${drafts[0].itemCount} item(s)`}
                  {` • Saved ${new Date(drafts[0].savedAt).toLocaleDateString()} ${new Date(drafts[0].savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => resumeDraft(drafts[0])}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FolderOpenIcon className="w-3.5 h-3.5" /> Resume Latest
              </button>
              {drafts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setShowDraftsModal(true)}
                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-lg transition-colors"
                >
                  View All ({drafts.length})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Discard draft "${drafts[0].title}"?`)) {
                      deleteDraft(drafts[0].id);
                    }
                  }}
                  className="px-2.5 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
                  title="Discard Draft"
                >
                  Discard
                </button>
              )}
            </div>
          </div>
        )}

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
              maxWidth: step === 1 ? '1080px' : step === 2 ? '860px' : '660px',
              maxHeight: '92vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Create Good Receive Note</h3>
                {activeDraftId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <FileTextIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Draft Active</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!submitted && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        fetchLookupData();
                        showToast('success', 'Suppliers and items refreshed.');
                      }}
                      title="Refresh suppliers and items"
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <RefreshCwIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCurrentAsDraft(true, false)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <SaveIcon className="w-3.5 h-3.5" />
                      <span>Save Draft</span>
                    </button>
                  </>
                )}
                <button onClick={requestClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
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
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="invoiceNo"
                          value={formData.invoiceNo}
                          onChange={handleChange}
                          placeholder="INV-0001"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={handleAutoInvoiceNo}
                          className="shrink-0 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                          title="Click to generate an automatic sequential invoice number"
                        >
                          <SparklesIcon className="w-3.5 h-3.5 text-teal-600" />
                          <span>Auto No</span>
                        </button>
                      </div>
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
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Supplier not listed?</span>
                        <button
                          type="button"
                          onClick={() => {
                            saveCurrentAsDraft(true, false);
                            window.open('#/inventory/suppliers', '_blank');
                          }}
                          className="text-teal-600 hover:text-teal-800 font-medium inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Save Draft & Add Supplier</span>
                          <ExternalLinkIcon className="w-3 h-3" />
                        </button>
                      </div>
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
                <div className="flex h-full" style={{ minHeight: '480px', maxHeight: '72vh' }}>
                  {/* Left: Categories */}
                  <div className="w-44 border-r border-gray-100 bg-gray-50 shrink-0 overflow-y-auto">
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

                  {/* Middle: Items Grid */}
                  <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
                    <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                      <div className="relative flex-1">
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
                      <button
                        type="button"
                        onClick={() => {
                          saveCurrentAsDraft(true, false);
                          window.open('#/inventory/new-item', '_blank');
                        }}
                        title="Save draft and open Add New Item in a new tab"
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-medium rounded-lg transition-colors shadow-xs"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Item</span>
                        <ExternalLinkIcon className="w-3 h-3 text-teal-500" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {filteredItems.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-sm text-gray-400">No items found</div>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                          {filteredItems.map(item => {
                            const isSelected = selectedItems.some(i => i.itemId === item.itemId);
                            return (
                              <button
                                key={item.itemId}
                                onClick={() => toggleItem(item)}
                                className={`relative text-left p-3 rounded-lg border-2 transition-all
                                  ${isSelected
                                    ? 'border-teal-500 bg-teal-50/80 shadow-xs'
                                    : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'}`}
                              >
                                {isSelected && (
                                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">✓</span>
                                  </span>
                                )}
                                <p className="text-[11px] text-gray-400 font-mono mb-1">{item.itemCodePrefix}</p>
                                <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{item.itemName}</p>
                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                                  <span className="text-xs font-bold text-teal-700">Rs. {item.unitPrice?.toFixed(2)}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                                    {item.unitType}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Selected Items Sidebar */}
                  <div className="w-72 flex flex-col shrink-0 bg-stone-50/60 overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-gray-100 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">Selected Items</span>
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                          {selectedItems.length}
                        </span>
                      </div>
                      {selectedItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedItems([])}
                          className="text-[11px] font-medium text-red-500 hover:text-red-700 hover:underline transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Selected list */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                      {selectedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-400">
                          <PackageIcon className="h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-xs font-semibold text-gray-500">No items selected</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Click any item from the catalog or scan barcode to add it here.
                          </p>
                        </div>
                      ) : (
                        selectedItems.map((item, idx) => (
                          <div
                            key={item.itemId}
                            className="group flex items-start justify-between gap-2 p-2.5 rounded-lg border border-teal-100 bg-white shadow-2xs hover:border-teal-300 transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-bold text-gray-400 font-mono">
                                  #{idx + 1}
                                </span>
                                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1 py-0.2 rounded">
                                  {item.itemCodePrefix || 'Item'}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-gray-800 leading-snug truncate" title={item.itemName}>
                                {item.itemName}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                                <span className="rounded bg-teal-50 px-1 text-teal-700 font-medium">
                                  {item.unitType}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.itemId)}
                              className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors shrink-0"
                              title="Remove item"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-100 bg-white flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        Total: <strong className="text-gray-800">{selectedItems.length}</strong> item{selectedItems.length !== 1 ? 's' : ''}
                      </span>
                      {selectedItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                        >
                          Next: Batch Info →
                        </button>
                      )}
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
                        const costErr = item.costPrice === undefined || item.costPrice === null || isNaN(item.costPrice) || item.costPrice < 0;
                        const retailErr = item.retailPrice === undefined || item.retailPrice === null || isNaN(item.retailPrice) || item.retailPrice < 0;

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
                                  <p className="mt-1 text-xs text-red-500">Cost price must be 0 or greater</p>
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
                                  <p className="mt-1 text-xs text-red-500">Retail price must be 0 or greater</p>
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
                                Net: <span className="font-semibold text-gray-700">Rs. {roundToNearestTen(subtotal - item.discount).toFixed(2)}</span>
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
                                Rs. {roundToNearestTen(item.costPrice * item.quantity - item.discount).toFixed(2)}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => step === 0 ? requestClose() : setStep(s => s - 1)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {step > 0 && <ChevronLeftIcon className="h-4 w-4" />}
                    {step === 0 ? 'Cancel' : 'Back'}
                  </button>

                  <button
                    type="button"
                    onClick={() => saveCurrentAsDraft(true, false)}
                    className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/50 px-3.5 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors shadow-2xs"
                    title="Save in-progress GRN as a draft"
                  >
                    <SaveIcon className="h-4 w-4" />
                    <span>Save as Draft</span>
                  </button>
                </div>

                {step < 3 ? (
                  <button
                    type="button"
                    disabled={
                      (step === 0 && (!formData.invoiceNo || !formData.supplierId || !formData.stockLocationId)) ||
                      (step === 1 && selectedItems.length === 0) ||
                      (step === 2 && !isStep2Valid)
                    }
                    onClick={() => setStep(s => s + 1)}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                  >
                    Next <ChevronRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting || selectedItems.length === 0}
                    onClick={handleSubmit}
                    className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                  >
                    {submitting ? 'Saving...' : 'Save GRN Transaction'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DRAFTS MANAGEMENT MODAL ── */}
      {showDraftsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <FileTextIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Saved GRN Drafts</h3>
                  <p className="text-xs text-gray-500">Resume an unfinished GRN or clear completed drafts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {drafts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium">No saved drafts</p>
                  <p className="text-xs text-gray-400 mt-1">Drafts you save while creating a GRN will appear here.</p>
                </div>
              ) : (
                drafts.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-teal-300 bg-white hover:bg-teal-50/20 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{d.title}</h4>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                          Step {d.step + 1}: {STEPS[d.step]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Supplier: <strong className="text-gray-700">{d.supplierName || 'Not selected'}</strong></span>
                        <span>•</span>
                        <span>Items: <strong className="text-gray-700">{d.itemCount}</strong></span>
                        <span>•</span>
                        <span>Total: <strong className="text-teal-700">Rs. {d.grandTotal.toFixed(2)}</strong></span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Saved: {new Date(d.savedAt).toLocaleDateString()} at {new Date(d.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => resumeDraft(d)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <FolderOpenIcon className="w-3.5 h-3.5" /> Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete draft "${d.title}"?`)) {
                            deleteDraft(d.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Draft"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">{drafts.length} draft{drafts.length === 1 ? '' : 's'} available</span>
              <button
                type="button"
                onClick={() => setShowDraftsModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UNSAVED CHANGES GUARD MODAL ── */}
      {showClosePrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-100">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">Unsaved GRN Details</h4>
                <p className="text-xs text-gray-500">You have in-progress entries that haven't been saved.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Would you like to save your progress as a <strong>temporary draft</strong>? You can resume it anytime after adding missing suppliers or products.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowClosePrompt(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={forceCloseModal}
                className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={() => saveCurrentAsDraft(true, true)}
                className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <SaveIcon className="w-3.5 h-3.5" /> Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW GRN MODAL ── */}
      {viewGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <FileTextIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">Good Receive Note Details</h3>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                      GRN #{viewGrn.grnId}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Invoice: <strong className="text-gray-800">{viewGrn.invoiceNo || 'N/A'}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin() && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(viewGrn)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                    title="Edit this GRN (Super Admin Only)"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    <span>Edit GRN</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewGrn(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Supplier</span>
                  <span className="text-sm font-semibold text-gray-800 mt-0.5 block truncate">
                    {viewGrn.supplierName || '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Stock Location</span>
                  <span className="text-sm font-semibold text-gray-800 mt-0.5 block truncate">
                    {viewGrn.stockLocationName || (stockLocations.find(l => l.stockCategoryId === viewGrn.stockLocationId)?.stockName) || '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Received Date</span>
                  <span className="text-sm font-semibold text-gray-800 mt-0.5 block">
                    {viewGrn.createdDate || '—'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Total Items</span>
                  <span className="text-sm font-semibold text-teal-700 mt-0.5 block">
                    {loadingView ? 'Loading...' : `${viewItems.length} Product(s)`}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Received Products & Batches</h4>
                  <span className="text-xs text-gray-500 font-medium">{viewItems.length} item(s) in this GRN</span>
                </div>

                {loadingView ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2 border border-gray-100 rounded-xl bg-gray-50">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                    <span className="text-xs">Loading received items...</span>
                  </div>
                ) : viewItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm border border-gray-100 rounded-xl bg-gray-50">
                    No batch items found for this GRN.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-semibold">
                        <tr>
                          <th className="px-3 py-2.5 text-left">#</th>
                          <th className="px-3 py-2.5 text-left">Item Name & Code</th>
                          <th className="px-3 py-2.5 text-right">Received Qty</th>
                          <th className="px-3 py-2.5 text-right">Cost Price</th>
                          <th className="px-3 py-2.5 text-right">Net Cost</th>
                          <th className="px-3 py-2.5 text-right">Retail Price</th>
                          <th className="px-3 py-2.5 text-right">Wholesale Price</th>
                          <th className="px-3 py-2.5 text-center">Exp Date</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {viewItems.map((item, idx) => {
                          const netCost = roundToNearestTen((item.costPrice ?? 0) * (item.quantity ?? 0));
                          return (
                            <tr key={item.profileId || idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                              <td className="px-3 py-2.5">
                                <p className="font-semibold text-gray-900">{item.itemName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {item.itemCodePrefix && (
                                    <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1 rounded">
                                      {item.itemCodePrefix}
                                    </span>
                                  )}
                                  {item.poNo && (
                                    <span className="text-[10px] text-gray-400">PO: {item.poNo}</span>
                                  )}
                                  {item.remark && (
                                    <span className="text-[10px] text-gray-400 italic">"{item.remark}"</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                                {item.quantity?.toLocaleString() ?? 0} {item.unitTypeName || ''}
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-600">
                                Rs. {(item.costPrice ?? 0).toFixed(2)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-teal-700">
                                Rs. {netCost.toFixed(2)}
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-600">
                                Rs. {(item.retailPrice ?? 0).toFixed(2)}
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-600">
                                Rs. {(item.wholeSalePrice ?? 0).toFixed(2)}
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-500 font-mono text-[11px]">
                                {item.expDate ? item.expDate.split(' ')[0] : '—'}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                  ${item.isReleaseForSell === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}
                                >
                                  {item.isReleaseForSell === 1 ? 'For Sale' : 'Not For Sale'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-white max-w-sm ml-auto">
                <div className="px-4 py-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Subtotal (Cost)</span>
                  <span className="font-semibold text-gray-800">Rs. {(viewGrn.totalPrice ?? 0).toFixed(2)}</span>
                </div>
                {(viewGrn.totalDiscount ?? 0) > 0 && (
                  <div className="px-4 py-2 flex items-center justify-between text-xs bg-orange-50/50 border-t border-gray-100">
                    <span className="text-orange-600">Total Discount</span>
                    <span className="font-semibold text-orange-600">- Rs. {(viewGrn.totalDiscount ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="px-4 py-2.5 flex items-center justify-between bg-teal-50 border-t border-teal-100">
                  <span className="text-xs font-bold text-teal-800">Grand Total</span>
                  <span className="text-sm font-extrabold text-teal-700">
                    Rs. {((viewGrn.totalPrice ?? 0) - (viewGrn.totalDiscount ?? 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                {isSuperAdmin() && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(viewGrn)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    <span>Edit this GRN</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewGrn(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT GRN MODAL (SUPER ADMIN ONLY) ── */}
      {editGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full border border-gray-100 flex flex-col max-h-[94vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-amber-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <PencilIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">Edit Good Receive Note</h3>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                      GRN #{editGrn.grnId}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      Super Admin Mode
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Invoice: <strong className="text-gray-800">{editGrn.invoiceNo}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditGrn(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="overflow-y-auto p-6 space-y-6 flex-1 flex flex-col">
              {/* General Info Card */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 shrink-0">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">General Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Invoice No *</label>
                    <input
                      type="text"
                      value={editGrn.invoiceNo}
                      onChange={(e) => setEditGrn(prev => prev ? ({ ...prev, invoiceNo: e.target.value }) : null)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono font-medium focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Supplier *</label>
                    <select
                      value={editGrn.supplierId}
                      onChange={(e) => setEditGrn(prev => prev ? ({ ...prev, supplierId: Number(e.target.value) }) : null)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.supplierId} value={s.supplierId}>
                          {s.companyName || s.salesmanName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Stock Location *</label>
                    <select
                      value={editGrn.stockLocationId}
                      onChange={(e) => setEditGrn(prev => prev ? ({ ...prev, stockLocationId: Number(e.target.value) }) : null)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                      required
                    >
                      {stockLocations.map(l => (
                        <option key={l.stockCategoryId} value={l.stockCategoryId}>
                          {l.stockName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Received Date *</label>
                    <input
                      type="date"
                      value={editGrn.createdDate}
                      onChange={(e) => setEditGrn(prev => prev ? ({ ...prev, createdDate: e.target.value }) : null)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Total Discount (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editGrn.totalDiscount}
                      onChange={(e) => setEditGrn(prev => prev ? ({ ...prev, totalDiscount: parseFloat(e.target.value) || 0 }) : null)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table Card */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Received Items & Batches ({editGrn.items.length})
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Modify quantities, prices, expiry dates, or release status. Master inventory will auto-adjust.
                    </p>
                  </div>

                  {/* Add item autocomplete */}
                  <div className="relative w-72" ref={editDropdownRef}>
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={editItemSearch}
                        onChange={(e) => {
                          setEditItemSearch(e.target.value);
                          setShowEditItemDropdown(true);
                        }}
                        onFocus={() => setShowEditItemDropdown(true)}
                        placeholder="+ Add product to this GRN..."
                        className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    {showEditItemDropdown && editItemSearch.trim() && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                        {allItems
                          .filter(it => it.itemName.toLowerCase().includes(editItemSearch.toLowerCase()) || it.itemCodePrefix.toLowerCase().includes(editItemSearch.toLowerCase()))
                          .slice(0, 8)
                          .map(item => (
                            <button
                              key={item.itemId}
                              type="button"
                              onClick={() => handleEditAddItem(item)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 border-b border-gray-100 last:border-0 flex items-center justify-between cursor-pointer"
                            >
                              <span className="font-medium text-gray-800">{item.itemName}</span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {item.itemCodePrefix} | Rs.{item.costPrice}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-semibold">
                      <tr>
                        <th className="px-2.5 py-2.5 text-left w-8">#</th>
                        <th className="px-2.5 py-2.5 text-left min-w-[150px]">Item Description</th>
                        <th className="px-2.5 py-2.5 text-center w-20">Qty</th>
                        <th className="px-2.5 py-2.5 text-center w-28">Unit Type</th>
                        <th className="px-2.5 py-2.5 text-center w-24">Cost (Rs.)</th>
                        <th className="px-2.5 py-2.5 text-right w-24">Net Cost</th>
                        <th className="px-2.5 py-2.5 text-center w-24">Retail (Rs.)</th>
                        <th className="px-2.5 py-2.5 text-center w-24">Wholesale</th>
                        <th className="px-2.5 py-2.5 text-center w-28">Exp Date</th>
                        <th className="px-2.5 py-2.5 text-center w-24">PO No</th>
                        <th className="px-2.5 py-2.5 text-center w-24">For Sale</th>
                        <th className="px-2.5 py-2.5 text-center w-28">Remark</th>
                        <th className="px-2.5 py-2.5 text-center w-10">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {editGrn.items.map((it, idx) => {
                        const lineTotal = roundToNearestTen((Number(it.costPrice) || 0) * (Number(it.quantity) || 0));
                        return (
                          <tr key={it.profileId || idx} className="hover:bg-amber-50/30 transition-colors">
                            <td className="px-2.5 py-2 text-gray-400 font-medium">{idx + 1}</td>
                            <td className="px-2.5 py-2">
                              <p className="font-semibold text-gray-900 leading-tight">{it.itemName}</p>
                              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400 font-mono">
                                {it.itemCodePrefix && <span>[{it.itemCodePrefix}]</span>}
                                {it.itemBarCode && <span>#{it.itemBarCode}</span>}
                              </div>
                            </td>
                            <td className="px-2.5 py-2">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={it.quantity}
                                onChange={(e) => handleEditItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-center font-bold text-gray-800 focus:border-amber-500 focus:outline-none"
                                required
                              />
                            </td>
                            <td className="px-2.5 py-2">
                              {(() => {
                                const catItem = allItems.find(a => a.itemId === it.itemId);
                                const baseUnit = catItem?.unitType || it.unitType || '';
                                const compatibleUnits = getCompatibleUnitTypes(unitTypes, baseUnit);

                                return (
                                  <select
                                    value={it.unitTypeId || 1}
                                    onChange={(e) => {
                                      const selectedId = parseInt(e.target.value, 10);
                                      const matched = unitTypes.find(u => u.unitTypeId === selectedId);
                                      handleEditItemChange(idx, 'unitTypeId', selectedId);
                                      if (matched) {
                                        handleEditItemChange(idx, 'unitType', matched.unitType);
                                      }
                                    }}
                                    className="w-full rounded border border-gray-300 px-1.5 py-1 text-xs text-gray-800 focus:border-amber-500 focus:outline-none bg-white font-medium cursor-pointer"
                                  >
                                    {!compatibleUnits.some(u => u.unitTypeId === it.unitTypeId) && it.unitTypeId && (
                                      <option value={it.unitTypeId}>{it.unitType || `Unit #${it.unitTypeId}`}</option>
                                    )}
                                    {compatibleUnits.map(ut => (
                                      <option key={ut.unitTypeId} value={ut.unitTypeId}>
                                        {ut.unitType}
                                      </option>
                                    ))}
                                  </select>
                                );
                              })()}
                            </td>
                            <td className="px-2.5 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={it.costPrice}
                                onChange={(e) => handleEditItemChange(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-center text-gray-800 focus:border-amber-500 focus:outline-none"
                                required
                              />
                            </td>
                            <td className="px-2.5 py-2 text-right font-bold text-teal-700 font-mono">
                              Rs. {lineTotal.toFixed(2)}
                            </td>
                            <td className="px-2.5 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={it.retailPrice}
                                onChange={(e) => handleEditItemChange(idx, 'retailPrice', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-center text-gray-800 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-2.5 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={it.wholeSalePrice}
                                onChange={(e) => handleEditItemChange(idx, 'wholeSalePrice', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-center text-gray-800 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-2.5 py-2">
                              <input
                                type="date"
                                value={it.expDate}
                                onChange={(e) => handleEditItemChange(idx, 'expDate', e.target.value)}
                                className="w-full rounded border border-gray-300 px-1 py-1 text-[11px] text-center text-gray-700 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-2.5 py-2">
                              <input
                                type="text"
                                value={it.poNo}
                                onChange={(e) => handleEditItemChange(idx, 'poNo', e.target.value)}
                                placeholder="PO No"
                                className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] text-center text-gray-700 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-2.5 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleEditItemChange(idx, 'isReleaseForSell', it.isReleaseForSell === 1 ? 0 : 1)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                                  it.isReleaseForSell === 1
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}
                              >
                                {it.isReleaseForSell === 1 ? 'For Sale' : 'Locked'}
                              </button>
                            </td>
                            <td className="px-2.5 py-2">
                              <input
                                type="text"
                                value={it.remark}
                                onChange={(e) => handleEditItemChange(idx, 'remark', e.target.value)}
                                placeholder="Remark"
                                className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] text-gray-700 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-2.5 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleEditRemoveItem(idx)}
                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove item from GRN"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary & Footnote */}
              <div className="flex flex-wrap items-end justify-between gap-4 pt-2 border-t border-gray-100 shrink-0">
                <p className="text-xs text-amber-700 max-w-md">
                  <strong>Notice for Super Admin:</strong> Saving changes will automatically update batch profiles, adjust stock details, and balance the master inventory counts.
                </p>

                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white w-72">
                  {(() => {
                    const totalCost = editGrn.items.reduce((s, it) => s + roundToNearestTen((Number(it.costPrice) || 0) * (Number(it.quantity) || 0)), 0);
                    const discount = Number(editGrn.totalDiscount) || 0;
                    return (
                      <>
                        <div className="px-3 py-1.5 flex items-center justify-between text-xs">
                          <span className="text-gray-500">Subtotal (Cost):</span>
                          <span className="font-semibold text-gray-800">Rs. {totalCost.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="px-3 py-1.5 flex items-center justify-between text-xs bg-orange-50 border-t border-gray-100">
                            <span className="text-orange-600">Discount:</span>
                            <span className="font-semibold text-orange-600">- Rs. {discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="px-3 py-2 flex items-center justify-between bg-teal-50 border-t border-teal-100">
                          <span className="text-xs font-bold text-teal-800">Grand Total:</span>
                          <span className="text-sm font-black text-teal-900">
                            Rs. {Math.max(0, totalCost - discount).toFixed(2)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditGrn(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <SaveIcon className="w-3.5 h-3.5" />
                  <span>{submittingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}