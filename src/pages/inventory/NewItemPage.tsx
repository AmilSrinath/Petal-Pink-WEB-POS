import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircleIcon, PlusIcon, PencilIcon, TrashIcon,
  SearchIcon, XIcon, LoaderIcon, PackageIcon, FlaskConicalIcon,
  ChevronDownIcon, ChevronUpIcon,
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/items';
const API_PROFILES = 'http://localhost:8080/api/config/business-profiles';
const API_MAIN_CATEGORIES = 'http://localhost:8080/api/categories';
const API_SUB_CATEGORIES = 'http://localhost:8080/api/sub-categories';
const API_UNIT_TYPES = 'http://localhost:8080/api/unit-types';
const API_PRINTER_TYPES = 'http://localhost:8080/api/printer-types';
const API_ITEM_TEMPLATES = 'http://localhost:8080/api/item-templates';
const API_GRN_ITEMS = 'http://localhost:8080/api/items/grn';
const API_STOCKS = 'http://localhost:8080/api/stocks';

// ── Types ────────────────────────────────────────────────────────────────────
interface BusinessProfile {
  bussinessProfileId: number;
  bussinessProfileName: string;
  status: number;
  userId: number;
  createdDate: string;
  editedDate: string;
}

interface MainCategory {
  mainItemCategoryId: number;
  mainItemCategoryName: string;
  imagePath: string;
  status: number;
  userId: number;
  visible: number;
  editedBy: number;
}

interface SubCategory {
  subItemCategoryId: number;
  mainItemCategoryId: number;
  mainItemCategoryName: string;
  subItemCategoryName: string;
  imagePath: string;
  status: number;
  userId: number;
  visible: number;
}

interface UnitType {
  unitTypeId: number;
  unitType: string;
  status: number;
  userId: number;
  visible: number;
}

interface PrinterType {
  printerTypeId: number;
  printerType: string;
  status: number;
  userId: number;
  visible: number;
}

interface Item {
  itemId: number;
  itemBarCode: number | null;
  mainItemCategoryId: number | null;
  subItemCategoryId: number | null;
  itemPrefix: string;
  itemCodePrefix: string;
  discount: number;
  itemName: string;
  unitType: string;
  printerType: string;
  costPrice: number;
  unitPrice: number;
  imagePath: string | null;
  grnStatus: number;
  sellingStatus: number;
  status: number;
  userId: number | null;
  visible: number;
  weight: number;
  quantity: number | null;
  bussinessProfile: number | null;
  mainItemCategoryName: string | null;
  subItemCategoryName: string | null;
  bussinessProfileName: string | null;
}

// ── Template sub-item types ──────────────────────────────────────────────────
interface TemplateIngredient {
  id: string;
  subItemId: number | null;
  subItemName: string;
  quantity: number;
  unitType: string;
}

// ── Shape of what GET /api/item-templates/{id} returns ───────────────────────
interface ApiTemplateIngredient {
  subItemId: number;
  subItemName: string;
  quantity: number;
  unitType: string;
}

interface ApiTemplate {
  itemId: number;
  itemName: string;
  templateName: string;
  ingredients: ApiTemplateIngredient[];
}

// ── Unit conversion helpers ──────────────────────────────────────────────────
function toBaseUnit(quantity: number, unitType: string): { quantity: number; unitType: string } {
  if (unitType === 'kg') return { quantity: quantity * 1000, unitType: 'g' };
  if (unitType === 'l')  return { quantity: quantity * 1000, unitType: 'ml' };
  return { quantity, unitType };
}

function toDisplayUnit(quantity: number, unitType: string): { quantity: number; unitType: string } {
  if (unitType === 'g'  && quantity >= 1000 && quantity % 1 === 0) return { quantity: quantity / 1000, unitType: 'kg' };
  if (unitType === 'ml' && quantity >= 1000 && quantity % 1 === 0) return { quantity: quantity / 1000, unitType: 'l' };
  return { quantity, unitType };
}

// ── Shared styles ────────────────────────────────────────────────────────────
const inputCls =
  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ' +
  'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white';

const emptyForm = {
  mainCategory: '', subCategory: '', bussinessProfile: '', codePrefix: '', itemCode: '',
  barcode: '', itemName: '', sellingPrice: '', costPrice: '', discount: '',
  unitType: '', weight: '', printerType: '', storeTemplate: '',
  isActive: true, isGrn: false, isSellingItem: true,
  // ← NEW
  isLowStockAlert: false,
  lowStockAlert: '',
};

const emptyIngredient = (): TemplateIngredient => ({
  id: Math.random().toString(36).slice(2),
  subItemId: null,
  subItemName: '',
  quantity: 1,
  unitType: '',
});

// ── Main component ───────────────────────────────────────────────────────────
export function NewItemPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [printerTypes, setPrinterTypes] = useState<PrinterType[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [grnItems, setGrnItems] = useState<Item[]>([]);

  const ALLOWED_UNITS = ['unit', 'g', 'ml'];
  const filteredUnitTypes = unitTypes.filter(u => ALLOWED_UNITS.includes(u.unitType));

  // ── Template state ──────────────────────────────────────────────────────────
  const [templateEnabled, setTemplateEnabled] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [ingredients, setIngredients] = useState<TemplateIngredient[]>([emptyIngredient()]);
  const [templateSectionOpen, setTemplateSectionOpen] = useState(true);
  const [ingredientSearch, setIngredientSearch] = useState<Record<string, string>>({});

  // NEW: track whether the item being edited already has a saved template
  const [existingTemplate, setExistingTemplate] = useState<ApiTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  // ── API helpers ─────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchGrnItems = useCallback(async () => {
    try {
      const res = await fetch(API_GRN_ITEMS);
      if (!res.ok) return;
      const data: Item[] = await res.json();
      setGrnItems(data.filter(i => i.status === 1));
    } catch {}
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: Item[] = await res.json();
      setItems(data);
    } catch (e: any) {
      setFetchError(e.message ?? 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch(API_PROFILES);
      if (!res.ok) return;
      const data: BusinessProfile[] = await res.json();
      setProfiles(data.filter(p => p.status === 1));
    } catch {}
  }, []);

  const fetchMainCategories = useCallback(async () => {
    try {
      const res = await fetch(API_MAIN_CATEGORIES);
      if (!res.ok) return;
      const data: MainCategory[] = await res.json();
      setMainCategories(data.filter(c => c.status === 1));
    } catch {}
  }, []);

  const fetchSubCategories = useCallback(async () => {
    try {
      const res = await fetch(API_SUB_CATEGORIES);
      if (!res.ok) return;
      const data: SubCategory[] = await res.json();
      setSubCategories(data.filter(c => c.status === 1));
    } catch {}
  }, []);

  const fetchUnitTypes = useCallback(async () => {
    try {
      const res = await fetch(API_UNIT_TYPES);
      if (!res.ok) return;
      const data: UnitType[] = await res.json();
      setUnitTypes(data.filter(u => u.status === 1));
    } catch {}
  }, []);

  const fetchPrinterTypes = useCallback(async () => {
    try {
      const res = await fetch(API_PRINTER_TYPES);
      if (!res.ok) return;
      const data: PrinterType[] = await res.json();
      setPrinterTypes(data.filter(p => p.status === 1));
    } catch {}
  }, []);

  // NEW: fetch the saved template for a given itemId
  // Returns the parsed ApiTemplate, or null if none exists (404) or on error
  const fetchItemTemplate = useCallback(async (itemId: number): Promise<ApiTemplate | null> => {
    try {
      const res = await fetch(`${API_ITEM_TEMPLATES}/${itemId}`);
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const data: ApiTemplate = await res.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchProfiles();
    fetchMainCategories();
    fetchSubCategories();
    fetchUnitTypes();
    fetchPrinterTypes();
    fetchGrnItems();
  }, [fetchItems, fetchProfiles, fetchMainCategories, fetchSubCategories, fetchUnitTypes, fetchPrinterTypes, fetchGrnItems]);

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const resetTemplate = () => {
    setTemplateEnabled(false);
    setTemplateName('');
    setIngredients([emptyIngredient()]);
    setIngredientSearch({});
    setTemplateSectionOpen(true);
    setExistingTemplate(null);
  };

  const openNew = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    resetTemplate();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  // UPDATED: openEdit now fetches the existing template and pre-populates it
  const openEdit = async (item: Item) => {
    setEditingItem(item);
    setFormData({
      mainCategory: String(item.mainItemCategoryId ?? ''),
      subCategory: String(item.subItemCategoryId ?? ''),
      bussinessProfile: item.bussinessProfile ? String(item.bussinessProfile) : '',
      codePrefix: item.itemPrefix,
      itemCode: item.itemCodePrefix,
      barcode: String(item.itemBarCode ?? ''),
      itemName: item.itemName,
      sellingPrice: String(item.unitPrice),
      costPrice: String(item.costPrice),
      discount: String(item.discount),
      unitType: item.unitType,
      weight: String(item.weight),
      printerType: item.printerType,
      storeTemplate: '',
      isActive: item.status === 1,
      isGrn: item.grnStatus === 1,
      isSellingItem: item.sellingStatus === 1,
      isLowStockAlert: false,   // ← fetched from stock, not item — leave false for now
      lowStockAlert: '',
    });

    // Reset template state first, then fetch
    resetTemplate();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);

    // Fetch existing template in the background
    setTemplateLoading(true);
    const savedTemplate = await fetchItemTemplate(item.itemId);
    setTemplateLoading(false);

    if (savedTemplate) {
      setExistingTemplate(savedTemplate);
      setTemplateEnabled(true);
      setTemplateName(savedTemplate.templateName);

      // Convert saved DB units (g/ml) back to display units (kg/l) for editing
      const loadedIngredients: TemplateIngredient[] = savedTemplate.ingredients.map(ing => {
        const { quantity: displayQty, unitType: displayUnit } = toDisplayUnit(ing.quantity, ing.unitType);
        const rowId = Math.random().toString(36).slice(2);
        return {
          id: rowId,
          subItemId: ing.subItemId,
          subItemName: ing.subItemName,
          quantity: displayQty,
          unitType: displayUnit,
        };
      });

      setIngredients(loadedIngredients);

      // Pre-populate ingredientSearch so the text fields show the sub-item names
      const searchMap: Record<string, string> = {};
      loadedIngredients.forEach(ing => {
        searchMap[ing.id] = ing.subItemName;
      });
      setIngredientSearch(searchMap);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingItem(null);
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.itemName.trim()) { showToast('Item name is required', false); return; }
    if (!formData.bussinessProfile) { showToast('Business profile is required', false); return; }

    if (templateEnabled) {
      if (!templateName.trim()) { showToast('Template name is required', false); return; }
      const hasEmpty = ingredients.some(ing => !ing.subItemName.trim() || ing.quantity <= 0);
      if (hasEmpty) { showToast('All template ingredients need a name and quantity > 0', false); return; }
    }

    setSaving(true);
    try {
      const rawWeight = Number(formData.weight) || 0;
      const { quantity: convertedWeight } = toBaseUnit(rawWeight, formData.unitType);
      const storedUnitType =
        formData.unitType === 'kg' ? 'g' :
        formData.unitType === 'l'  ? 'ml' :
        formData.unitType;

      const payload = {
        ...(editingItem ? { itemId: editingItem.itemId } : {}),
        itemBarCode: formData.barcode ? Number(formData.barcode) : null,
        mainItemCategoryId: formData.mainCategory ? Number(formData.mainCategory) : null,
        subItemCategoryId: formData.subCategory ? Number(formData.subCategory) : null,
        itemPrefix: formData.codePrefix,
        itemCodePrefix: formData.itemCode,
        discount: Number(formData.discount) || 0,
        itemName: formData.itemName,
        unitType: storedUnitType,
        printerType: formData.printerType,
        costPrice: Number(formData.costPrice) || 0,
        unitPrice: Number(formData.sellingPrice) || 0,
        imagePath: '',
        grnStatus: formData.isGrn ? 1 : 0,
        sellingStatus: formData.isSellingItem ? 1 : 0,
        status: formData.isActive ? 1 : 0,
        userId: 1,
        visible: 1,
        weight: convertedWeight,
        quantity: null,
        bussinessProfile: formData.bussinessProfile ? Number(formData.bussinessProfile) : null,
      };

      const itemRes = await fetch(API_BASE, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!itemRes.ok) throw new Error(`Server error ${itemRes.status}`);

      // ── Resolve itemId ──────────────────────────────────────────────────────
      let resolvedItemId: number | null = editingItem?.itemId ?? null;
      if (!editingItem) {
        const json = await itemRes.json();
        resolvedItemId = json?.itemId ?? null;
        if (!resolvedItemId) throw new Error('Server did not return a valid item ID');
      }

      // ── Initialize / update stock row ──────────────────────────────────────────
      if (resolvedItemId) {
        // Find the unitTypeId matching the stored unit string
        const matchedUnit = unitTypes.find(u => u.unitType === storedUnitType);

        const stockPayload = {
          itemId: resolvedItemId,
          itemName: formData.itemName.trim(),
          unitType: matchedUnit?.unitTypeId ?? null,
          isLowStockAlert: formData.isLowStockAlert ? 1 : 0,
          lowStockAlert: formData.isLowStockAlert && formData.lowStockAlert
            ? Number(formData.lowStockAlert)
            : null,
        };

        // POST to initialize (backend skips if already exists and updates alert fields)
        await fetch(`${API_STOCKS}/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stockPayload),
        });
        // Non-blocking: stock init failure shouldn't block item save success
      }

      // ── Save / Update / Disable template ─────────────────────────────────────
      if (resolvedItemId) {
        if (templateEnabled) {
          // existing logic — POST or PUT
          const convertedIngredients = ingredients.map(({ id, ...rest }) => {
            const { quantity: qty, unitType: unit } = toBaseUnit(rest.quantity, rest.unitType);
            return { ...rest, quantity: qty, unitType: unit };
          });

          const templatePayload = {
            itemId: resolvedItemId,
            templateName: templateName.trim(),
            ingredients: convertedIngredients,
          };

          const isTemplateUpdate = !!existingTemplate;
          const templateRes = await fetch(
            isTemplateUpdate
              ? `${API_ITEM_TEMPLATES}/${resolvedItemId}`
              : API_ITEM_TEMPLATES,
            {
              method: isTemplateUpdate ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(templatePayload),
            }
          );

          if (!templateRes.ok) {
            showToast('Item saved, but template failed to save', false);
            setModalOpen(false);
            setEditingItem(null);
            await fetchItems();
            return;
          }

        } else if (existingTemplate) {
          // ── Template was loaded but user disabled the toggle → set visible = 0
          await fetch(`${API_ITEM_TEMPLATES}/${resolvedItemId}/disable`, {
            method: 'PATCH',
          });
          // Non-blocking: item save already succeeded, template disable is best-effort
        }
      }

      showToast(editingItem ? 'Item updated successfully' : 'Item saved successfully');
      setModalOpen(false);
      setEditingItem(null);
      await fetchItems();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to save item', false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      showToast('Item deleted');
      await fetchItems();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to delete item', false);
    }
  };

  // ── Form helpers ────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };

      if (name === 'isGrn' && checked) updated.isSellingItem = false;
      if (name === 'isSellingItem' && checked) updated.isGrn = false;

      return updated;
    });
  };

  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, mainCategory: e.target.value, subCategory: '' }));
  };

  const filtered = items.filter(i =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    i.itemCodePrefix.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubCategories = formData.mainCategory
    ? subCategories.filter(s => s.mainItemCategoryId === Number(formData.mainCategory))
    : subCategories;

  // ── Template ingredient helpers ─────────────────────────────────────────────
  const addIngredient = () => setIngredients(prev => [...prev, emptyIngredient()]);

  const removeIngredient = (id: string) =>
    setIngredients(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);

  const updateIngredient = (id: string, field: keyof TemplateIngredient, value: any) =>
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const getFilteredItemsForIngredient = (search: string) =>
    grnItems.filter(i => i.itemName.toLowerCase().includes(search.toLowerCase())).slice(0, 8);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-auto relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all
          ${toast.ok ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok
            ? <CheckCircleIcon className="h-4 w-4 shrink-0" />
            : <XIcon className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Item List</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-teal-500 focus:outline-none w-52"
              />
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add New Item
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoaderIcon className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-3 text-gray-500">Loading items…</span>
          </div>
        ) : fetchError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-medium">{fetchError}</p>
            <button onClick={fetchItems} className="mt-3 text-sm text-teal-600 hover:underline">Retry</button>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['ID', 'Code', 'Item Name', 'Main Cat.', 'Sub Cat.', 'Unit', 'Cost', 'Price', 'Weight', 'GRN', 'Selling', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={14} className="px-4 py-10 text-center text-gray-400">No items found.</td></tr>
                  ) : filtered.map(item => (
                    <tr key={item.itemId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono">{item.itemId}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{item.itemCodePrefix}</td>
                      <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{item.itemName}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {item.mainItemCategoryName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {item.subItemCategoryName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.unitType}</td>
                      <td className="px-4 py-3 text-gray-900 text-left font-mono">{item.costPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-teal-700 font-semibold text-left font-mono">{item.unitPrice.toFixed(2)}</td>
                      {/* <td className="px-4 py-3 text-right text-gray-500">{item.discount > 0 ? `${item.discount}%` : '—'}</td> */}
                      <td className="px-4 py-3 text-gray-500 text-left">{item.weight > 0 ? `${item.weight}` : '—'}</td>
                      <td className="px-4 py-3"><Badge active={item.grnStatus === 1} trueLabel="Yes" falseLabel="No" /></td>
                      <td className="px-4 py-3"><Badge active={item.sellingStatus === 1} trueLabel="Yes" falseLabel="No" /></td>
                      {/* <td className="px-4 py-3"><Badge active={item.status === 1} trueLabel="Active" falseLabel="Inactive" /></td> */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ActionBtn title="Edit" onClick={() => openEdit(item)}>
                            <PencilIcon className="h-4 w-4" />
                          </ActionBtn>
                          <ActionBtn title="Delete" onClick={() => handleDelete(item.itemId)} danger>
                            <TrashIcon className="h-4 w-4" />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
              Showing {filtered.length} of {items.length} items
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem ? `Edit Item — ${editingItem.itemCodePrefix}` : 'Add New Item'}
              </h2>
              <button onClick={closeModal} disabled={saving}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Category */}
              <Section title="Category">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Business Profile *">
                    <select name="bussinessProfile" value={formData.bussinessProfile} onChange={handleChange} className={inputCls}>
                      <option value="">Select profile</option>
                      {profiles.map(p => (
                        <option key={p.bussinessProfileId} value={String(p.bussinessProfileId)}>
                          {p.bussinessProfileName}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Main Category">
                    <select name="mainCategory" value={formData.mainCategory} onChange={handleMainCategoryChange} className={inputCls}>
                      <option value="">Select main category</option>
                      {mainCategories.map(c => (
                        <option key={c.mainItemCategoryId} value={String(c.mainItemCategoryId)}>
                          {c.mainItemCategoryName}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sub Category">
                    <select name="subCategory" value={formData.subCategory} onChange={handleChange} className={inputCls}
                      disabled={!formData.mainCategory}>
                      <option value="">
                        {formData.mainCategory ? 'Select sub category' : 'Select main category first'}
                      </option>
                      {filteredSubCategories.map(s => (
                        <option key={s.subItemCategoryId} value={String(s.subItemCategoryId)}>
                          {s.subItemCategoryName}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>

              {/* Item Identification */}
              <Section title="Item Identification">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Code Prefix">
                    <input type="text" name="codePrefix" value={formData.codePrefix} onChange={handleChange}
                      maxLength={6} placeholder="e.g. BEV" className={inputCls} />
                  </Field>
                  <Field label="Item Code">
                    <input type="text" name="itemCode" value={formData.itemCode} onChange={handleChange}
                      placeholder="e.g. BEV-001" className={inputCls} />
                  </Field>
                  <Field label="Barcode">
                    <input type="text" name="barcode" value={formData.barcode} onChange={handleChange}
                      placeholder="Scan or enter" className={inputCls} />
                  </Field>
                  <div className="sm:col-span-3">
                    <Field label="Item Name *">
                      <input type="text" name="itemName" value={formData.itemName} onChange={handleChange}
                        placeholder="Enter full item name" className={inputCls} />
                    </Field>
                  </div>
                </div>
              </Section>

              {/* Pricing */}
              <Section title="Pricing & Units">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="Cost Price">
                    <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange}
                      placeholder="0.00" step="0.01" min="0" className={inputCls} />
                  </Field>
                  <Field label="Selling Price">
                    <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange}
                      placeholder="0.00" step="0.01" min="0" className={inputCls} />
                  </Field>
                  <Field label="Discount (%)">
                    <input type="number" name="discount" value={formData.discount} onChange={handleChange}
                      placeholder="0" step="0.01" min="0" max="100" className={inputCls} />
                  </Field>
                  <Field label={
                    `Unit Type${formData.unitType === 'kg' ? ' → saved as g' : formData.unitType === 'l' ? ' → saved as ml' : ''}`
                  }>
                    <select name="unitType" value={formData.unitType} onChange={handleChange} className={inputCls}>
                      <option value="">Select unit</option>
                      {unitTypes
                        .filter(u => ['unit', 'g', 'ml'].includes(u.unitType))
                        .map(u => (
                          <option key={u.unitTypeId} value={u.unitType}>{u.unitType}</option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Weight">
                    <input type="text" name="weight" value={formData.weight} onChange={handleChange}
                      placeholder="e.g. 0.5" className={inputCls} />
                  </Field>
                </div>

                {(formData.unitType === 'kg' || formData.unitType === 'l') && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                    <span>⚠️</span>
                    <span>
                      Unit <strong>{formData.unitType}</strong> will be saved as <strong>{formData.unitType === 'kg' ? 'g' : 'ml'}</strong> in the database
                      {formData.weight ? ` — weight ${formData.weight} ${formData.unitType} → ${Number(formData.weight) * 1000} ${formData.unitType === 'kg' ? 'g' : 'ml'}` : ''}.
                    </span>
                  </div>
                )}
              </Section>

              {/* Print */}
              <Section title="Print & Template">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Printer Type">
                    <select name="printerType" value={formData.printerType} onChange={handleChange} className={inputCls}>
                      <option value="">Select printer</option>
                      {printerTypes.map(p => (
                        <option key={p.printerTypeId} value={p.printerType}>{p.printerType}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Store Template">
                    <select name="storeTemplate" value={formData.storeTemplate} onChange={handleChange} className={inputCls}>
                      <option value="">Select template</option>
                      <option>Default</option><option>Compact</option><option>Extended</option>
                    </select>
                  </Field>
                </div>
              </Section>

              {/* Settings */}
              <Section title="Settings">
                <div className="flex flex-wrap gap-6 mb-4">
                  {[
                    { name: 'isActive',      label: 'Is Active' },
                    { name: 'isGrn',         label: 'GRN' },
                    { name: 'isSellingItem', label: 'Selling Item' },
                  ].map(({ name, label }) => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={name}
                        checked={formData[name as keyof typeof formData] as boolean}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                {/* ── Low Stock Alert ── */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      name="isLowStockAlert"
                      checked={formData.isLowStockAlert}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">Enable Low Stock Alert</span>
                  </label>

                  {formData.isLowStockAlert && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label={`Low Stock Threshold${formData.unitType ? ` (${formData.unitType})` : ''}`}>
                        <input
                          type="number"
                          name="lowStockAlert"
                          value={formData.lowStockAlert}
                          onChange={handleChange}
                          placeholder="e.g. 10"
                          step="0.01"
                          min="0"
                          className={inputCls}
                        />
                      </Field>
                      <div className="flex items-end pb-1">
                        <p className="text-xs text-gray-400">
                          You'll be alerted when stock falls below this quantity.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* ── Item Template Section ──────────────────────────────────────── */}
              <div className="rounded-lg border border-teal-200 bg-teal-50/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-teal-50 border-b border-teal-200">
                  <div className="flex items-center gap-3">
                    <FlaskConicalIcon className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Item Template
                    </span>
                    <span className="text-xs text-teal-500">(Bill of Materials)</span>
                    {/* NEW: badge showing whether a saved template was found */}
                    {editingItem && !templateLoading && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        existingTemplate
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {existingTemplate ? '✓ Saved template loaded' : 'No saved template'}
                      </span>
                    )}
                    {editingItem && templateLoading && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <LoaderIcon className="h-3 w-3 animate-spin" />
                        Loading template…
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => !templateLoading && setTemplateEnabled(v => !v)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                          templateEnabled ? 'bg-teal-600' : 'bg-gray-300'
                        } ${templateLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          templateEnabled ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {templateEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                    {templateEnabled && (
                      <button
                        type="button"
                        onClick={() => setTemplateSectionOpen(v => !v)}
                        className="text-teal-500 hover:text-teal-700 transition-colors"
                      >
                        {templateSectionOpen
                          ? <ChevronUpIcon className="h-4 w-4" />
                          : <ChevronDownIcon className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {templateEnabled && templateSectionOpen && (
                  <div className="p-4 space-y-4">
                    {/* NEW: info banner changes copy when updating vs creating */}
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
                      <PackageIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
                      <span>
                        {existingTemplate
                          ? <>Editing existing template — saving will <strong>replace all ingredients</strong> for this item. <strong>kg → g and l → ml</strong> are applied automatically.</>
                          : <>Define the sub-items (ingredients / components) used to make this product.
                            When a sale is recorded, these quantities will be automatically deducted from inventory.
                            <strong className="ml-1">kg → g and l → ml conversions are applied automatically on save.</strong></>
                        }
                      </span>
                    </div>

                    <Field label="Template Name *">
                      <input
                        type="text"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder={`e.g. ${formData.itemName || 'Hair Oil'} Recipe`}
                        className={inputCls}
                      />
                    </Field>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Ingredients / Components
                        </label>
                        <button
                          type="button"
                          onClick={addIngredient}
                          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                          Add Row
                        </button>
                      </div>

                      {/* Header row */}
                      <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                        <div className="col-span-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Sub Item</div>
                        <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</div>
                        <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Unit</div>
                        <div className="col-span-1"></div>
                      </div>

                      <div className="space-y-2">
                        {ingredients.map((ing, idx) => (
                          <IngredientRow
                            key={ing.id}
                            ing={ing}
                            index={idx}
                            allItems={items}
                            unitTypes={unitTypes}
                            searchValue={ingredientSearch[ing.id] ?? ''}
                            onSearchChange={val =>
                              setIngredientSearch(prev => ({ ...prev, [ing.id]: val }))
                            }
                            onSelectItem={item => {
                              updateIngredient(ing.id, 'subItemId', item.itemId);
                              updateIngredient(ing.id, 'subItemName', item.itemName);
                              updateIngredient(ing.id, 'unitType', item.unitType);
                              setIngredientSearch(prev => ({ ...prev, [ing.id]: item.itemName }));
                            }}
                            onUpdate={(field, value) => updateIngredient(ing.id, field, value)}
                            onRemove={() => removeIngredient(ing.id)}
                            canRemove={ingredients.length > 1}
                            getFilteredItems={getFilteredItemsForIngredient}
                          />
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} in template
                        </span>
                        <span className="text-xs text-teal-600 font-medium">
                          Total qty: {ingredients.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!templateEnabled && (
                  <div className="px-4 py-3 text-xs text-gray-400">
                    {templateLoading
                      ? 'Checking for saved template…'
                      : 'Enable to define sub-items (ingredients/components) that make up this product. Inventory will be auto-deducted on sale.'}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 bg-white px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || templateLoading}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
              >
                {saving && <LoaderIcon className="h-4 w-4 animate-spin" />}
                {editingItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ingredient Row ───────────────────────────────────────────────────────────
interface IngredientRowProps {
  ing: TemplateIngredient;
  index: number;
  allItems: Item[];
  unitTypes: UnitType[];
  searchValue: string;
  onSearchChange: (val: string) => void;
  onSelectItem: (item: Item) => void;
  onUpdate: (field: keyof TemplateIngredient, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
  getFilteredItems: (search: string) => Item[];
}

function IngredientRow({
  ing, index, allItems, unitTypes,
  searchValue, onSearchChange, onSelectItem,
  onUpdate, onRemove, canRemove, getFilteredItems,
}: IngredientRowProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suggestions = searchValue.length > 0 ? getFilteredItems(searchValue) : [];

  const { quantity: savedQty, unitType: savedUnit } = toBaseUnit(ing.quantity, ing.unitType);
  const willConvert = ing.unitType === 'kg' || ing.unitType === 'l';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`rounded-lg border bg-white p-2 space-y-1 ${willConvert ? 'border-amber-200' : 'border-gray-200'}`}>
      <div className="grid grid-cols-12 gap-2 items-start">
        {/* Sub item picker */}
        <div className="col-span-5 relative" ref={wrapperRef}>
          <input
            type="text"
            placeholder="Search item…"
            value={searchValue}
            onChange={e => {
              onSearchChange(e.target.value);
              setOpen(true);
              if (!e.target.value) {
                onUpdate('subItemId', null);
                onUpdate('subItemName', '');
              }
            }}
            onFocus={() => setOpen(true)}
            className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          />
          {open && suggestions.length > 0 && (
            <div className="absolute top-full left-0 z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map(item => (
                <button
                  key={item.itemId}
                  type="button"
                  onMouseDown={() => {
                    onSelectItem(item);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 hover:text-teal-700 transition-colors border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium">{item.itemName}</span>
                  <span className="ml-2 text-gray-400">{item.itemCodePrefix}</span>
                </button>
              ))}
            </div>
          )}
          {open && searchValue.length > 0 && suggestions.length === 0 && (
            <div className="absolute top-full left-0 z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="px-3 py-2 text-xs text-gray-400">No items found. Enter name manually.</div>
            </div>
          )}
          {!ing.subItemId && ing.subItemName === '' && searchValue.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onUpdate('subItemName', searchValue);
                setOpen(false);
              }}
              className="mt-1 text-xs text-teal-600 hover:underline"
            >
              Use "{searchValue}" as custom name
            </button>
          )}
        </div>

        {/* Quantity */}
        <div className="col-span-3">
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={ing.quantity}
            onChange={e => onUpdate('quantity', parseFloat(e.target.value) || 0)}
            className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          />
        </div>

        {/* Unit type */}
        <div className="col-span-3">
          <select
            value={ing.unitType}
            onChange={e => onUpdate('unitType', e.target.value)}
            className={`block w-full rounded-md border px-1 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white ${
              willConvert ? 'border-amber-300' : 'border-gray-300'
            }`}
          >
            <option value="">Unit</option>
            {unitTypes
              .filter(u => ['unit', 'g', 'ml'].includes(u.unitType))
              .map(u => (
                <option key={u.unitTypeId} value={u.unitType}>{u.unitType}</option>
              ))}
          </select>
        </div>

        {/* Remove */}
        <div className="col-span-1 flex items-center justify-center pt-0.5">
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Remove row"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {willConvert && (
        <div className="text-xs text-amber-600 pl-1">
          ⚠️ Will be saved as <strong>{savedQty} {savedUnit}</strong>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function Badge({ active, trueLabel, falseLabel }: { active: boolean; trueLabel: string; falseLabel: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      active ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {active ? trueLabel : falseLabel}
    </span>
  );
}

function ActionBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: () => void; title: string; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        danger
          ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
          : 'text-gray-400 hover:text-teal-700 hover:bg-teal-50'
      }`}
    >
      {children}
    </button>
  );
}