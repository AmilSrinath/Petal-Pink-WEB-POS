import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config'; 
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  UploadIcon,
  AlertTriangleIcon,
  LoaderIcon,
  ChevronDownIcon,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WebMainCategory {
  mainCategoryId: number;
  mainCategoryName: string;
}

interface WebSubCategory {
  subCategoryId: number;
  subCategoryName: string;
  mainCategoryId: number;
}

// Clothing-only variants
interface WebProductColor {
  colorId?: number;
  colorName: string;
  colorCode?: string | null;
  images: string[];
}

interface WebProductSize {
  sizeId?: number;
  sizeName: string;
}

// One size together with the exact colors it comes in for this product.
interface WebProductSizeGroup {
  sizeId?: number;
  sizeName: string;
  colors: WebProductColor[];
}

const CLOTHING_CATEGORY_NAME = 'Clothing';

interface WebProduct {
  productId?: number;
  product_id?: number;
  productName?: string;
  product_name?: string;
  unitType?: string;
  unit_type?: string;
  productPrice?: number;
  product_price?: number;
  discount?: number;
  weight?: number;
  amount?: number;
  description?: string;
  howToUse?: string;
  how_to_use?: string;
  userId?: string;
  user_id?: string;
  businessName?: string;
  business_name?: string;
  imageUrl?: string;
  image_url?: string;
  imageUrl2?: string;
  image_url_2?: string;
  imageUrl3?: string;
  image_url_3?: string;
  mainCategoryId?: number;
  main_category_id?: number;
  subCategoryId?: number;
  sub_category_id?: number;
  mainCategoryName?: string;
  subCategoryName?: string;
  colors?: WebProductColor[];
  sizes?: WebProductSize[];
  sizeGroups?: WebProductSizeGroup[];
}

// One color row within a size group. Each color needs 3+ images (existing URLs
// kept from a previous save, plus newly picked files to upload on submit).
interface ColorFormRow {
  key: string;
  colorName: string;
  colorCode: string;
  existingImages: string[];
  newImages: (File | null)[];
}

const emptyColorRow = (): ColorFormRow => ({
  key: Math.random().toString(36).slice(2),
  colorName: '',
  colorCode: '',
  existingImages: [],
  newImages: [null, null, null],
});

// One size "card" in the form — its own name plus the colors that belong ONLY to it.
interface SizeGroupFormRow {
  key: string;
  sizeName: string;
  colorRows: ColorFormRow[];
}

const emptySizeGroupRow = (sizeName: string): SizeGroupFormRow => ({
  key: Math.random().toString(36).slice(2),
  sizeName,
  colorRows: [],
});

const SIZE_SUGGESTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// A color already saved in the master catalog — the product form lets the admin
// pick one of these for a size (or type a brand new color, which gets saved
// automatically the next time the product is submitted).
interface MasterColor {
  colorId: number;
  colorName: string;
  colorCode: string | null;
}

interface FormState {
  productName: string;
  unitType: string;
  productPrice: string;
  discount: string;
  weight: string;
  amount: string;
  description: string;
  howToUse: string;
  userId: string;
  businessName: string;
  mainCategoryId: string;
  subCategoryId: string;
  image1: File | null;
  image2: File | null;
  image3: File | null;
  sizeGroups: SizeGroupFormRow[];
}

const UNIT_TYPES = ['Unit', 'ml', 'l', 'g', 'kg'];

const emptyForm = (): FormState => ({
  productName: '',
  unitType: '',
  productPrice: '',
  discount: '0',
  weight: '',
  amount: '0',
  description: '',
  howToUse: '',
  userId: 'U001',
  businessName: '',
  mainCategoryId: '',
  subCategoryId: '',
  image1: null,
  image2: null,
  image3: null,
  sizeGroups: [],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition';

// ─── Image Picker ─────────────────────────────────────────────────────────────

function ImagePicker({
  label,
  file,
  existingUrl,
  onChange,
}: {
  label: string;
  file: File | null;
  existingUrl?: string;
  onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : existingUrl;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-teal-400 transition-colors overflow-hidden bg-gray-50 flex items-center justify-center"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <UploadIcon className="h-5 w-5 text-gray-400" />
        )}
        {file && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"
          >
            <XIcon className="h-2.5 w-2.5" />
          </span>
        )}
      </button>
      <span className="text-xs text-gray-500">{label}</span>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

// ─── Color Image Slot (compact, no label — used inside color variant rows) ───

function ColorImageSlot({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : undefined;

  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="relative h-16 w-16 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-teal-400 transition-colors flex items-center justify-center"
    >
      {preview ? (
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <UploadIcon className="h-4 w-4 text-gray-400" />
      )}
      {file && (
        <span
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"
        >
          <XIcon className="h-2.5 w-2.5" />
        </span>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────

interface ProductModalProps {
  mode: 'add' | 'edit';
  product?: WebProduct;
  mainCategories: WebMainCategory[];
  subCategories: WebSubCategory[];
  savedColors: MasterColor[];
  onClose: () => void;
  onSaved: () => void;
}

function ProductModal({ mode, product, mainCategories, subCategories, savedColors, onClose, onSaved }: ProductModalProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (mode === 'edit' && product) {
      return {
        productName: product.productName,
        unitType: product.unitType,
        productPrice: String(product.productPrice),
        discount: String(product.discount),
        weight: product.weight != null ? String(product.weight) : '',
        amount: String(product.amount),
        description: product.description,
        howToUse: product.howToUse,
        userId: product.userId,
        businessName: product.businessName ?? '',
        mainCategoryId: product.mainCategoryId ? String(product.mainCategoryId) : '',
        subCategoryId: product.subCategoryId ? String(product.subCategoryId) : '',
        image1: null,
        image2: null,
        image3: null,
        sizeGroups: (product.sizeGroups ?? []).map((g) => ({
          key: Math.random().toString(36).slice(2),
          sizeName: g.sizeName,
          colorRows: (g.colors ?? []).map((c) => ({
            key: Math.random().toString(36).slice(2),
            colorName: c.colorName ?? '',
            colorCode: c.colorCode ?? '',
            existingImages: c.images ?? [],
            newImages: [],
          })),
        })),
      };
    }
    return emptyForm();
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Filter sub categories based on selected main category
  const filteredSubCategories = subCategories.filter(
    (s) => String(s.mainCategoryId) === form.mainCategoryId
  );

  // Is the currently selected main category "Clothing"? (colors/sizes only apply here)
  const isClothing =
    mainCategories.find((c) => String(c.mainCategoryId) === form.mainCategoryId)
      ?.mainCategoryName?.trim().toLowerCase() === CLOTHING_CATEGORY_NAME.toLowerCase();

  // Reset sub category when main category changes
  function handleMainCategoryChange(value: string) {
    setForm((f) => ({ ...f, mainCategoryId: value, subCategoryId: '' }));
  }

  // ─── Size group helpers ────────────────────────────────────────────────────
  // Each size owns its own list of colors — selecting a size never affects any
  // other size's colors, and removing a size only removes that size's colors.

  function isSizeActive(size: string) {
    return form.sizeGroups.some((g) => g.sizeName.toLowerCase() === size.trim().toLowerCase());
  }

  function toggleSize(size: string) {
    setForm((f) => {
      const active = f.sizeGroups.find((g) => g.sizeName.toLowerCase() === size.trim().toLowerCase());
      if (active) {
        // Turning a size off removes it and only its own colors.
        return { ...f, sizeGroups: f.sizeGroups.filter((g) => g.key !== active.key) };
      }
      return { ...f, sizeGroups: [...f.sizeGroups, emptySizeGroupRow(size)] };
    });
  }

  function addCustomSize(size: string) {
    const trimmed = size.trim();
    if (!trimmed || isSizeActive(trimmed)) return;
    setForm((f) => ({ ...f, sizeGroups: [...f.sizeGroups, emptySizeGroupRow(trimmed)] }));
  }

  function removeSizeGroup(key: string) {
    setForm((f) => ({ ...f, sizeGroups: f.sizeGroups.filter((g) => g.key !== key) }));
  }

  // ─── Color row helpers (scoped to one size group) ─────────────────────────

  // Adds one of the already-saved master colors to a size's color list (pre-filled
  // with its name + hex — the admin still attaches fresh images for this product).
  function addSavedColorToGroup(groupKey: string, colorName: string) {
    const saved = savedColors.find((c) => c.colorName === colorName);
    if (!saved) return;
    setForm((f) => ({
      ...f,
      sizeGroups: f.sizeGroups.map((g) => {
        if (g.key !== groupKey) return g;
        // Skip if this color is already in the size's list.
        if (g.colorRows.some((c) => c.colorName.toLowerCase() === saved.colorName.toLowerCase())) return g;
        const row: ColorFormRow = { ...emptyColorRow(), colorName: saved.colorName, colorCode: saved.colorCode || '' };
        return { ...g, colorRows: [...g.colorRows, row] };
      }),
    }));
  }

  function addColorRow(groupKey: string) {
    setForm((f) => ({
      ...f,
      sizeGroups: f.sizeGroups.map((g) =>
        g.key === groupKey ? { ...g, colorRows: [...g.colorRows, emptyColorRow()] } : g
      ),
    }));
  }

  function removeColorRow(groupKey: string, colorKey: string) {
    setForm((f) => ({
      ...f,
      sizeGroups: f.sizeGroups.map((g) =>
        g.key === groupKey ? { ...g, colorRows: g.colorRows.filter((c) => c.key !== colorKey) } : g
      ),
    }));
  }

  function updateColorRow(groupKey: string, colorKey: string, patch: Partial<ColorFormRow>) {
    setForm((f) => ({
      ...f,
      sizeGroups: f.sizeGroups.map((g) =>
        g.key === groupKey
          ? { ...g, colorRows: g.colorRows.map((c) => (c.key === colorKey ? { ...c, ...patch } : c)) }
          : g
      ),
    }));
  }

  function addColorImageSlot(groupKey: string, colorKey: string) {
    const group = form.sizeGroups.find((g) => g.key === groupKey);
    const row = group?.colorRows.find((c) => c.key === colorKey);
    updateColorRow(groupKey, colorKey, { newImages: [...(row?.newImages ?? []), null] });
  }

  function setColorNewImage(groupKey: string, colorKey: string, index: number, file: File | null) {
    const group = form.sizeGroups.find((g) => g.key === groupKey);
    const row = group?.colorRows.find((c) => c.key === colorKey);
    if (!row) return;
    const newImages = [...row.newImages];
    newImages[index] = file;
    updateColorRow(groupKey, colorKey, { newImages });
  }

  function removeColorExistingImage(groupKey: string, colorKey: string, index: number) {
    const group = form.sizeGroups.find((g) => g.key === groupKey);
    const row = group?.colorRows.find((c) => c.key === colorKey);
    if (!row) return;
    updateColorRow(groupKey, colorKey, { existingImages: row.existingImages.filter((_, i) => i !== index) });
  }

  // ─── Image compression helper ─────────────────────────────────────────────────

  async function compressImage(file: File, maxWidthPx = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);

        const scale = Math.min(1, maxWidthPx / img.width);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  // ─── GCS direct upload helper ─────────────────────────────────────────────────

  async function uploadImageToGCS(file: File): Promise<string> {
    const params = new URLSearchParams({ fileName: file.name, contentType: file.type });

    const res = await fetch(`${API_BASE_URL}/api/website/product/upload-url?${params}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Could not get upload URL.');
    const { uploadUrl, publicUrl } = await res.json();

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-goog-acl': 'public-read',
      },
      body: file,
    });
    if (!putRes.ok) throw new Error('Image upload to storage failed.');

    return publicUrl;
  }

  async function handleSubmit() {
    if (!form.productName.trim() || !form.unitType.trim() || !form.productPrice) {
      setError('Product name, unit type and price are required.');
      return;
    }

    // Clothing variant validation: every color (in every size) needs a name and 3+ images total
    if (isClothing) {
      for (const g of form.sizeGroups) {
        for (const c of g.colorRows) {
          if (!c.colorName.trim()) {
            setError(`Every color needs a name (size "${g.sizeName}").`);
            return;
          }
          const totalImages = c.existingImages.length + c.newImages.filter(Boolean).length;
          if (totalImages < 3) {
            setError(`Color "${c.colorName}" for size "${g.sizeName}" needs at least 3 images.`);
            return;
          }
        }
      }
    }

    setSaving(true);
    setError('');
    try {
      // Compress (optional, still useful for upload speed) + upload directly to GCS
      const [imageUrl, imageUrl2, imageUrl3] = await Promise.all([
        form.image1 ? compressImage(form.image1).then(uploadImageToGCS) : Promise.resolve(product?.imageUrl ?? null),
        form.image2 ? compressImage(form.image2).then(uploadImageToGCS) : Promise.resolve(product?.imageUrl2 ?? null),
        form.image3 ? compressImage(form.image3).then(uploadImageToGCS) : Promise.resolve(product?.imageUrl3 ?? null),
      ]);

      // Upload each size group's colors' new images and merge with any kept existing URLs
      const sizeGroups = isClothing
        ? await Promise.all(
            form.sizeGroups.map(async (g) => {
              const colors = await Promise.all(
                g.colorRows.map(async (c) => {
                  const uploadedNew = await Promise.all(
                    c.newImages
                      .filter((f): f is File => !!f)
                      .map((f) => compressImage(f).then(uploadImageToGCS))
                  );
                  return {
                    colorName: c.colorName.trim(),
                    colorCode: c.colorCode.trim() || null,
                    images: [...c.existingImages, ...uploadedNew],
                  };
                })
              );
              return { sizeName: g.sizeName, colors };
            })
          )
        : [];

      const payload = {
        ...(mode === 'edit' && product ? { productId: product.productId } : {}),
        productName: form.productName,
        unitType: form.unitType,
        productPrice: Number(form.productPrice),
        discount: Number(form.discount),
        weight: form.weight ? Number(form.weight) : null,
        amount: Number(form.amount),
        description: form.description,
        howToUse: form.howToUse,
        userId: form.userId,
        businessName: form.businessName || null,
        mainCategoryId: form.mainCategoryId ? Number(form.mainCategoryId) : null,
        subCategoryId: form.subCategoryId ? Number(form.subCategoryId) : null,
        imageUrl,
        imageUrl2,
        imageUrl3,
        sizeGroups: isClothing ? sizeGroups : [],
      };

      const path = mode === 'add' ? '/api/website/product/save' : '/api/website/product/update';
      const method = mode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Add New Product' : 'Edit Product'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Row 1 — Product Name + Unit Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Product Name *">
              <input
                className={inputCls}
                value={form.productName}
                onChange={(e) => setField('productName', e.target.value)}
                placeholder="e.g. Matte Lipstick - Rose"
              />
            </Field>
            <Field label="Unit Type *">
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-8`}
                  value={form.unitType}
                  onChange={(e) => setField('unitType', e.target.value)}
                >
                  <option value="">Select unit type</option>
                  {UNIT_TYPES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>
          </div>

          {/* Row 2 — Main Category + Sub Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Main Category">
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-8`}
                  value={form.mainCategoryId}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                >
                  <option value="">Select main category</option>
                  {mainCategories.map((c) => (
                    <option key={c.mainCategoryId} value={String(c.mainCategoryId)}>
                      {c.mainCategoryName}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>
            <Field label="Sub Category">
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-8`}
                  value={form.subCategoryId}
                  onChange={(e) => setField('subCategoryId', e.target.value)}
                  disabled={!form.mainCategoryId}
                >
                  <option value="">Select sub category</option>
                  {filteredSubCategories.map((s) => (
                    <option key={s.subCategoryId} value={String(s.subCategoryId)}>
                      {s.subCategoryName}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </Field>
          </div>

          {/* Row 3 — Price, Discount, Weight, Amount */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Price (LKR) *">
              <input
                className={inputCls}
                type="number"
                min="0"
                value={form.productPrice}
                onChange={(e) => setField('productPrice', e.target.value)}
              />
            </Field>
            <Field label="Discount (%)">
              <input
                className={inputCls}
                type="number"
                min="0"
                max="100"
                value={form.discount}
                onChange={(e) => setField('discount', e.target.value)}
              />
            </Field>
            <Field label="Weight (g)">
              <input
                className={inputCls}
                type="number"
                min="0"
                value={form.weight}
                onChange={(e) => setField('weight', e.target.value)}
              />
            </Field>
            <Field label="Amount">
              <input
                className={inputCls}
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setField('amount', e.target.value)}
              />
            </Field>
          </div>

          {/* Row 4 — Business Name */}
          <Field label="Business Name">
            <input
              className={inputCls}
              value={form.businessName}
              onChange={(e) => setField('businessName', e.target.value)}
            />
          </Field>

          {/* Description + How to Use */}
          <Field label="Description">
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </Field>
          <Field label="How to Use">
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.howToUse}
              onChange={(e) => setField('howToUse', e.target.value)}
            />
          </Field>

          {/* Images */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Product Images</p>
            <div className="flex gap-4">
              <ImagePicker label="Image 1" file={form.image1} existingUrl={product?.imageUrl}  onChange={(f) => setField('image1', f)} />
              <ImagePicker label="Image 2" file={form.image2} existingUrl={product?.imageUrl2} onChange={(f) => setField('image2', f)} />
              <ImagePicker label="Image 3" file={form.image3} existingUrl={product?.imageUrl3} onChange={(f) => setField('image3', f)} />
            </div>
          </div>

          {/* Clothing-only: one card per size, each with its own colors */}
          {isClothing && (
            <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/40 p-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-800">Sizes</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {SIZE_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        isSizeActive(s)
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Custom size + Enter"
                  className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSize((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Each size keeps its own colors below — pick from already-saved colors
                  or add a brand new one, then attach photos to confirm it.
                </p>
              </div>

              {form.sizeGroups.length === 0 && (
                <p className="text-xs text-gray-400">No sizes selected yet — pick one above.</p>
              )}

              <div className="space-y-4">
                {form.sizeGroups.map((g) => (
                  <div key={g.key} className="rounded-lg border border-gray-200 bg-white p-3">
                    {/* Size card header */}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                        Size: {g.sizeName}
                      </span>
                      <div className="flex items-center gap-2">
                        {savedColors.length > 0 && (
                          <div className="relative">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) addSavedColorToGroup(g.key, e.target.value);
                                e.target.value = '';
                              }}
                              className="appearance-none rounded-lg border border-gray-200 bg-white pl-2.5 pr-7 py-1 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="">Pick saved color…</option>
                              {savedColors.map((c) => (
                                <option key={c.colorId} value={c.colorName}>{c.colorName}</option>
                              ))}
                            </select>
                            <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => addColorRow(g.key)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
                        >
                          <PlusIcon className="h-3.5 w-3.5" /> New Color
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSizeGroup(g.key)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove size"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {g.colorRows.length === 0 && (
                      <p className="mb-2 text-xs text-gray-400">
                        No colors for size "{g.sizeName}" yet.
                      </p>
                    )}

                    {/* Colors that belong ONLY to this size */}
                    <div className="space-y-3">
                      {g.colorRows.map((c) => (
                        <div key={c.key} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                          <div className="mb-3 flex items-start gap-3">
                            <input
                              type="color"
                              value={c.colorCode || '#cccccc'}
                              onChange={(e) => updateColorRow(g.key, c.key, { colorCode: e.target.value })}
                              className="h-9 w-9 shrink-0 cursor-pointer rounded border border-gray-200"
                            />
                            <input
                              className={inputCls}
                              placeholder="Color name e.g. Rose Pink"
                              value={c.colorName}
                              onChange={(e) => updateColorRow(g.key, c.key, { colorName: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => removeColorRow(g.key, c.key)}
                              className="shrink-0 rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                              title="Remove color"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <p className="mb-1 text-xs text-gray-500">Images (min. 3)</p>
                          <div className="flex flex-wrap gap-3">
                            {c.existingImages.map((url, i) => (
                              <div key={`existing-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                                <img src={url} alt="" className="h-full w-full object-cover" />
                                <span
                                  onClick={() => removeColorExistingImage(g.key, c.key, i)}
                                  className="absolute top-0.5 right-0.5 cursor-pointer rounded-full bg-red-500 p-0.5 text-white"
                                >
                                  <XIcon className="h-2.5 w-2.5" />
                                </span>
                              </div>
                            ))}
                            {c.newImages.map((file, i) => (
                              <ColorImageSlot
                                key={`new-${i}`}
                                file={file}
                                onChange={(f) => setColorNewImage(g.key, c.key, i, f)}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() => addColorImageSlot(g.key, c.key)}
                              className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-teal-400 transition-colors"
                              title="Add another image slot"
                            >
                              <PlusIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {saving && <LoaderIcon className="h-4 w-4 animate-spin" />}
            {mode === 'add' ? 'Save Product' : 'Update Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirmModal({
  product,
  onClose,
  onDeleted,
}: {
  product: WebProduct;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await apiFetch<{ message: string }>(`/product/${product.productId}`, { method: 'DELETE' });
      onDeleted();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Delete Product</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-800">"{product.productName}"</span>?
          This action cannot be undone.
        </p>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting && <LoaderIcon className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ManageWebProductsPage() {
  const [products, setProducts] = useState<WebProduct[]>([]);
  const [mainCategories, setMainCategories] = useState<WebMainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<WebSubCategory[]>([]);
  const [savedColors, setSavedColors] = useState<MasterColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [search, setSearch] = useState('');
  const [filterMainCategory, setFilterMainCategory] = useState<string>('all');

  const [modal, setModal] = useState<{ type: 'add' } | { type: 'edit'; product: WebProduct } | { type: 'delete'; product: WebProduct } | null>(null);

  // ── Fetch categories ──
  async function fetchCategories() {
    try {
      const [mainRes, subRes] = await Promise.all([
        apiFetch<{ mainCategories: WebMainCategory[] }>('/api/website/category/main/all'),
        apiFetch<{ subCategories: WebSubCategory[] }>('/api/website/category/sub/all'),
      ]);
      setMainCategories(mainRes.mainCategories ?? []);
      setSubCategories(subRes.subCategories ?? []);
    } catch {
      // categories are optional, silently fail
    }
  }

  // ── Fetch products ──
  async function fetchProducts() {
    setLoading(true);
    setFetchError('');
    try {
      const data = await apiFetch<WebProduct[]>('/api/website/product/all');

      // Normalize snake_case → camelCase from backend
      const normalized = data.map((p) => ({
        productId:      p.productId      ?? p.product_id,
        productName:    p.productName    ?? p.product_name    ?? '',
        unitType:       p.unitType       ?? p.unit_type       ?? '',
        productPrice:   p.productPrice   ?? p.product_price   ?? 0,
        discount:       p.discount       ?? 0,
        weight:         p.weight,
        amount:         p.amount         ?? 0,
        description:    p.description    ?? '',
        howToUse:       p.howToUse       ?? p.how_to_use      ?? '',
        userId:         p.userId         ?? p.user_id         ?? '',
        businessName:   p.businessName   ?? p.business_name,
        imageUrl:       p.imageUrl       ?? p.image_url,
        imageUrl2:      p.imageUrl2      ?? p.image_url_2,
        imageUrl3:      p.imageUrl3      ?? p.image_url_3,
        mainCategoryId: p.mainCategoryId ?? p.main_category_id,
        subCategoryId:  p.subCategoryId  ?? p.sub_category_id,
        mainCategoryName: p.mainCategoryName,
        subCategoryName:  p.subCategoryName,
        colors:           p.colors ?? [],
        sizes:            p.sizes ?? [],
        sizeGroups:       p.sizeGroups ?? [],
      }));

      setProducts(normalized);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch already-saved (master) colors — the product form lets the admin pick from these ──
  async function fetchSavedColors() {
    try {
      const data = await apiFetch<MasterColor[]>('/api/website/variant/colors');
      setSavedColors(data ?? []);
    } catch {
      // optional convenience feature, silently fail
    }
  }

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchSavedColors();
  }, []);

  // ── Helpers ──
  function getMainCategoryName(id?: number) {
    if (!id) return '—';
    return mainCategories.find((c) => c.mainCategoryId === id)?.mainCategoryName ?? '—';
  }

  function getSubCategoryName(id?: number) {
    if (!id) return '—';
    return subCategories.find((s) => s.subCategoryId === id)?.subCategoryName ?? '—';
  }

  // ── Filtered list ──
  const filtered = products.filter((p) => {
    const matchSearch = (p.productName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filterMainCategory === 'all' || String(p.mainCategoryId) === filterMainCategory;
    return matchSearch && matchCategory;
  });

  const salePrice = (p: WebProduct) =>
    p.discount > 0 ? p.productPrice * (1 - p.discount / 100) : null;

  return (
    <div className="p-6">
      {/* Modals */}
      {modal?.type === 'add' && (
        <ProductModal
          mode="add"
          mainCategories={mainCategories}
          subCategories={subCategories}
          savedColors={savedColors}
          onClose={() => setModal(null)}
          onSaved={() => { fetchProducts(); fetchSavedColors(); }}
        />
      )}
      {modal?.type === 'edit' && (
        <ProductModal
          mode="edit"
          product={modal.product}
          mainCategories={mainCategories}
          subCategories={subCategories}
          savedColors={savedColors}
          onClose={() => setModal(null)}
          onSaved={() => { fetchProducts(); fetchSavedColors(); }}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          product={modal.product}
          onClose={() => setModal(null)}
          onDeleted={fetchProducts}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage products displayed on petalpink.lk</p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {/* Category filter buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterMainCategory('all')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filterMainCategory === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {mainCategories.map((cat) => (
            <button
              key={cat.mainCategoryId}
              onClick={() => setFilterMainCategory(String(cat.mainCategoryId))}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filterMainCategory === String(cat.mainCategoryId)
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.mainCategoryName}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg p-4 bg-blue-50 text-blue-700">
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-xs font-medium mt-0.5">Total Products</p>
        </div>
        {mainCategories.slice(0, 3).map((cat, i) => {
          const colors = [
            'bg-pink-50 text-pink-700',
            'bg-purple-50 text-purple-700',
            'bg-amber-50 text-amber-700',
          ];
          return (
            <div key={cat.mainCategoryId} className={`rounded-lg p-4 ${colors[i % colors.length]}`}>
              <p className="text-2xl font-bold">
                {products.filter((p) => p.mainCategoryId === cat.mainCategoryId).length}
              </p>
              <p className="text-xs font-medium mt-0.5">{cat.mainCategoryName}</p>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {fetchError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          {fetchError}
          <button onClick={fetchProducts} className="ml-auto underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Product Name</th>
              <th className="px-4 py-3 text-left">Main Category</th>
              <th className="px-4 py-3 text-left">Sub Category</th>
              <th className="px-4 py-3 text-left">Variants</th>
              <th className="px-4 py-3 text-left">Unit Type</th>
              <th className="px-4 py-3 text-right">Price (LKR)</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <LoaderIcon className="mx-auto h-6 w-6 animate-spin text-teal-500" />
                  <p className="mt-2 text-sm text-gray-400">Loading products…</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400">
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const sp = salePrice(product);
                return (
                  <tr key={product.productId} className="hover:bg-gray-50 transition-colors">

                    {/* Product Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="h-9 w-9 rounded-lg object-cover shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xs">
                            ?
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{product.productName}</span>
                      </div>
                    </td>

                    {/* Main Category */}
                    <td className="px-4 py-3">
                      {product.mainCategoryId ? (
                        <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                          {getMainCategoryName(product.mainCategoryId)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Sub Category */}
                    <td className="px-4 py-3">
                      {product.subCategoryId ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                          {getSubCategoryName(product.subCategoryId)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Variants (colors + sizes) */}
                    <td className="px-4 py-3">
                      {(product.colors?.length || product.sizes?.length) ? (
                        <div className="flex flex-col gap-1">
                          {!!product.colors?.length && (
                            <div className="flex items-center gap-1">
                              {product.colors.slice(0, 5).map((c, i) => (
                                <span
                                  key={i}
                                  title={c.colorName}
                                  className="h-4 w-4 rounded-full border border-gray-200"
                                  style={{ backgroundColor: c.colorCode || '#e5e7eb' }}
                                />
                              ))}
                              {product.colors.length > 5 && (
                                <span className="text-xs text-gray-400">+{product.colors.length - 5}</span>
                              )}
                            </div>
                          )}
                          {!!product.sizes?.length && (
                            <span className="text-xs text-gray-500">
                              {product.sizes.map((s) => s.sizeName).join(', ')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Unit Type */}
                    <td className="px-4 py-3 text-gray-600">{product.unitType}</td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      {sp ? (
                        <>
                          <span className="line-through text-gray-400 text-xs mr-1">
                            {product.productPrice.toLocaleString()}
                          </span>
                          <span className="font-medium text-teal-600">
                            {Math.round(sp).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-gray-800">
                          {product.productPrice.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right text-gray-700">{product.amount}</td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setModal({ type: 'edit', product })}
                          className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setModal({ type: 'delete', product })}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}