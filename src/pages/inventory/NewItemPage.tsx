import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircleIcon, PlusIcon, PencilIcon, TrashIcon,
  SearchIcon, EyeIcon, EyeOffIcon, XIcon, LoaderIcon,
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/items';
const API_PROFILES = 'http://localhost:8080/api/config/business-profiles';
const API_MAIN_CATEGORIES = 'http://localhost:8080/api/categories';
const API_SUB_CATEGORIES = 'http://localhost:8080/api/sub-categories';
const API_UNIT_TYPES = 'http://localhost:8080/api/unit-types';
const API_PRINTER_TYPES = 'http://localhost:8080/api/printer-types';

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
  bussinessProfile: string | null;
}

// ── Shared field styles ──────────────────────────────────────────────────────
const inputCls =
  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ' +
  'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white';

const emptyForm = {
  mainCategory: '', subCategory: '', bussinessProfile: '', codePrefix: '', itemCode: '',
  barcode: '', itemName: '', sellingPrice: '', costPrice: '', discount: '',
  unitType: '', weight: '', printerType: '', storeTemplate: '',
  isActive: true, isGrn: false, isSellingItem: true,
};

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
  const [imageLabel, setImageLabel] = useState('Click to upload image');

  // ── API helpers ─────────────────────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

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
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: BusinessProfile[] = await res.json();
      setProfiles(data.filter(p => p.status === 1));
    } catch {
      // non-blocking
    }
  }, []);

  const fetchMainCategories = useCallback(async () => {
    try {
      const res = await fetch(API_MAIN_CATEGORIES);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: MainCategory[] = await res.json();
      setMainCategories(data.filter(c => c.status === 1));
    } catch {
      // non-blocking
    }
  }, []);

  const fetchSubCategories = useCallback(async () => {
    try {
      const res = await fetch(API_SUB_CATEGORIES);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: SubCategory[] = await res.json();
      setSubCategories(data.filter(c => c.status === 1));
    } catch {
      // non-blocking
    }
  }, []);

  const fetchUnitTypes = useCallback(async () => {
    try {
      const res = await fetch(API_UNIT_TYPES);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: UnitType[] = await res.json();
      setUnitTypes(data.filter(u => u.status === 1));
    } catch {
      // non-blocking
    }
  }, []);

  const fetchPrinterTypes = useCallback(async () => {
    try {
      const res = await fetch(API_PRINTER_TYPES);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: PrinterType[] = await res.json();
      setPrinterTypes(data.filter(p => p.status === 1));
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchProfiles();
    fetchMainCategories();
    fetchSubCategories();
    fetchUnitTypes();
    fetchPrinterTypes();
  }, [fetchItems, fetchProfiles, fetchMainCategories, fetchSubCategories, fetchUnitTypes, fetchPrinterTypes]);

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setImageLabel('Click to upload image');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      mainCategory: String(item.mainItemCategoryId ?? ''),
      subCategory: String(item.subItemCategoryId ?? ''),
      bussinessProfile: item.bussinessProfile ?? '',
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
    });
    setImageLabel('Click to upload image');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
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
    setSaving(true);
    try {
      const payload = {
        ...(editingItem ? { itemId: editingItem.itemId } : {}),
        itemBarCode: formData.barcode ? Number(formData.barcode) : null,
        mainItemCategoryId: formData.mainCategory ? Number(formData.mainCategory) : null,
        subItemCategoryId: formData.subCategory ? Number(formData.subCategory) : null,
        itemPrefix: formData.codePrefix,
        itemCodePrefix: formData.itemCode,
        discount: Number(formData.discount) || 0,
        itemName: formData.itemName,
        unitType: formData.unitType,
        printerType: formData.printerType,
        costPrice: Number(formData.costPrice) || 0,
        unitPrice: Number(formData.sellingPrice) || 0,
        imagePath: '',
        grnStatus: formData.isGrn ? 1 : 0,
        sellingStatus: formData.isSellingItem ? 1 : 0,
        status: formData.isActive ? 1 : 0,
        userId: 1,
        visible: 1,
        weight: Number(formData.weight) || 0,
        quantity: null,
        bussinessProfile: formData.bussinessProfile || null,
      };

      const res = await fetch(API_BASE, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);

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

  const toggleVisible = async (item: Item) => {
    try {
      const payload = { ...item, visible: item.visible === 1 ? 0 : 1 };
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      await fetchItems();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to update visibility', false);
    }
  };

  // ── Form helpers ────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setImageLabel(e.target.files[0].name);
  };

  const filtered = items.filter(i =>
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    i.itemCodePrefix.toLowerCase().includes(search.toLowerCase())
  );

  // Sub-categories filtered by selected main category
  const filteredSubCategories = formData.mainCategory
    ? subCategories.filter(s => s.mainItemCategoryId === Number(formData.mainCategory))
    : subCategories;

  // When main category changes, reset sub-category
  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, mainCategory: e.target.value, subCategory: '' }));
  };

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

        {/* Loading / Error / Table */}
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
                    {['ID', 'Code', 'Item Name', 'Cat.', 'Unit', 'Cost', 'Price', 'Disc.', 'Weight', 'GRN', 'Selling', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-10 text-center text-gray-400">No items found.</td>
                    </tr>
                  ) : filtered.map(item => (
                    <tr key={item.itemId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono">{item.itemId}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{item.itemCodePrefix}</td>
                      <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{item.itemName}</td>
                      <td className="px-4 py-3 text-gray-500">{item.mainItemCategoryId ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{item.unitType}</td>
                      <td className="px-4 py-3 text-gray-900 text-right font-mono">{item.costPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-teal-700 font-semibold text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-right">{item.weight > 0 ? `${item.weight}kg` : '—'}</td>
                      <td className="px-4 py-3"><Badge active={item.grnStatus === 1} trueLabel="Yes" falseLabel="No" /></td>
                      <td className="px-4 py-3"><Badge active={item.sellingStatus === 1} trueLabel="Yes" falseLabel="No" /></td>
                      <td className="px-4 py-3"><Badge active={item.status === 1} trueLabel="Active" falseLabel="Inactive" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ActionBtn title="Edit" onClick={() => openEdit(item)}>
                            <PencilIcon className="h-4 w-4" />
                          </ActionBtn>
                          <ActionBtn title={item.visible === 1 ? 'Hide' : 'Show'} onClick={() => toggleVisible(item)}>
                            {item.visible === 1
                              ? <EyeIcon className="h-4 w-4" />
                              : <EyeOffIcon className="h-4 w-4 text-gray-400" />}
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem ? `Edit Item — ${editingItem.itemCodePrefix}` : 'Add New Item'}
              </h2>
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
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
                  <Field label="Unit Type">
                    <select name="unitType" value={formData.unitType} onChange={handleChange} className={inputCls}>
                      {unitTypes.map(u => (
                        <option key={u.unitTypeId} value={u.unitType}>
                          {u.unitType}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Weight (kg)">
                    <input type="text" name="weight" value={formData.weight} onChange={handleChange}
                      placeholder="e.g. 0.5" className={inputCls} />
                  </Field>
                </div>
              </Section>

              {/* Print */}
              <Section title="Print & Template">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Printer Type">
                    <select name="printerType" value={formData.printerType} onChange={handleChange} className={inputCls}>
                      <option value="">Select printer</option>
                      {printerTypes.map(p => (
                        <option key={p.printerTypeId} value={p.printerType}>
                          {p.printerType}
                        </option>
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

              {/* Image */}
              <Section title="Image">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-700">{imageLabel}</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG or WEBP — max 2MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
              </Section>

              {/* Settings */}
              <Section title="Settings">
                <div className="flex flex-wrap gap-6">
                  {[
                    { name: 'isActive', label: 'Is Active' },
                    { name: 'isGrn', label: 'GRN' },
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
              </Section>
            </div>

            {/* Modal footer */}
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
                disabled={saving}
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