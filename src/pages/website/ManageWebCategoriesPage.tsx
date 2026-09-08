import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, AlertCircleIcon, RefreshCwIcon, XIcon } from 'lucide-react';
import { categoryApi, WsMainCategory, WsSubCategory } from '../../services/websiteService';

function getUserId(): number {
  const raw = localStorage.getItem('userId');
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : 1;
}

type MainModalState = { open: boolean; id: number | null; name: string };
type SubModalState = { open: boolean; id: number | null; name: string; mainCategoryId: number | null };

const EMPTY_MAIN_MODAL: MainModalState = { open: false, id: null, name: '' };
const EMPTY_SUB_MODAL: SubModalState = { open: false, id: null, name: '', mainCategoryId: null };

export function ManageWebCategoriesPage() {
  const [mainCategories, setMainCategories] = useState<WsMainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<WsSubCategory[]>([]);
  const [activeMainId, setActiveMainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMain, setSavingMain] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [mainError, setMainError] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  const [mainModal, setMainModal] = useState<MainModalState>(EMPTY_MAIN_MODAL);
  const [subModal, setSubModal] = useState<SubModalState>(EMPTY_SUB_MODAL);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mains, subs] = await Promise.all([
        categoryApi.main.getAll().catch(() => [] as WsMainCategory[]),
        categoryApi.sub.getAll().catch(() => [] as WsSubCategory[]),
      ]);
      setMainCategories(mains);
      setSubCategories(subs);
      setActiveMainId(prev => {
        if (prev && mains.some(m => m.mainCategoryId === prev)) return prev;
        return mains[0]?.mainCategoryId ?? null;
      });
    } catch (e: any) {
      setError(e.message ?? 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredSubs = useMemo(
    () => subCategories.filter(s => s.mainCategoryId === activeMainId),
    [subCategories, activeMainId]
  );

  const subCountFor = (mainId: number) => subCategories.filter(s => s.mainCategoryId === mainId).length;

  // ─── Main category actions ───────────────────────────────────────────────

  const openAddMain = () => { setMainModal({ open: true, id: null, name: '' }); setMainError(null); };
  const openEditMain = (c: WsMainCategory) => { setMainModal({ open: true, id: c.mainCategoryId, name: c.mainCategoryName }); setMainError(null); };

  const saveMain = async () => {
    if (!mainModal.name.trim()) { setMainError('Category name is required.'); return; }
    setSavingMain(true);
    setMainError(null);
    try {
      const userId = getUserId();
      if (mainModal.id === null) {
        await categoryApi.main.save(mainModal.name.trim(), userId);
      } else {
        await categoryApi.main.update(mainModal.id, mainModal.name.trim(), userId);
      }
      setMainModal(EMPTY_MAIN_MODAL);
      await fetchAll();
    } catch (e: any) {
      setMainError(e.message ?? 'Failed to save category.');
    } finally {
      setSavingMain(false);
    }
  };

  const deleteMain = async (c: WsMainCategory) => {
    const subCount = subCountFor(c.mainCategoryId);
    const warn = subCount > 0
      ? `Delete "${c.mainCategoryName}" and its ${subCount} sub-categor${subCount === 1 ? 'y' : 'ies'}? This cannot be undone.`
      : `Delete "${c.mainCategoryName}"? This cannot be undone.`;
    if (!confirm(warn)) return;
    try {
      await categoryApi.main.delete(c.mainCategoryId);
      await fetchAll();
    } catch (e: any) {
      alert('Delete failed: ' + (e.message ?? 'Unknown error'));
    }
  };

  // ─── Sub category actions ────────────────────────────────────────────────

  const openAddSub = () => {
    if (activeMainId === null) return;
    setSubModal({ open: true, id: null, name: '', mainCategoryId: activeMainId });
    setSubError(null);
  };
  const openEditSub = (c: WsSubCategory) => {
    setSubModal({ open: true, id: c.subCategoryId, name: c.subCategoryName, mainCategoryId: c.mainCategoryId });
    setSubError(null);
  };

  const saveSub = async () => {
    if (!subModal.name.trim()) { setSubError('Sub-category name is required.'); return; }
    if (!subModal.mainCategoryId) { setSubError('A main category is required.'); return; }
    setSavingSub(true);
    setSubError(null);
    try {
      const userId = getUserId();
      if (subModal.id === null) {
        await categoryApi.sub.save(subModal.name.trim(), subModal.mainCategoryId, userId);
      } else {
        await categoryApi.sub.update(subModal.id, subModal.name.trim(), subModal.mainCategoryId, userId);
      }
      setSubModal(EMPTY_SUB_MODAL);
      await fetchAll();
    } catch (e: any) {
      setSubError(e.message ?? 'Failed to save sub-category.');
    } finally {
      setSavingSub(false);
    }
  };

  const deleteSub = async (c: WsSubCategory) => {
    if (!confirm(`Delete "${c.subCategoryName}"? This cannot be undone.`)) return;
    try {
      await categoryApi.sub.delete(c.subCategoryId);
      setSubCategories(prev => prev.filter(s => s.subCategoryId !== c.subCategoryId));
    } catch (e: any) {
      alert('Delete failed: ' + (e.message ?? 'Unknown error'));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories shown on petalpink.lk</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openAddMain}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Main Category
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      ) : mainCategories.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400">
          No categories yet. Click "Add Main Category" to create the first one (e.g. Cosmetics, Clothing).
        </div>
      ) : (
        <>
          {/* Main category tabs */}
          <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 w-fit">
            {mainCategories.map((cat) => (
              <button
                key={cat.mainCategoryId}
                onClick={() => setActiveMainId(cat.mainCategoryId)}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeMainId === cat.mainCategoryId ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {cat.mainCategoryName}
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeMainId === cat.mainCategoryId ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {subCountFor(cat.mainCategoryId)}
                </span>
              </button>
            ))}
          </div>

          {/* Active main category header actions */}
          {activeMainId !== null && (
            <>
              {(() => {
                const active = mainCategories.find(m => m.mainCategoryId === activeMainId);
                if (!active) return null;
                return (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      Sub-categories under <span className="font-semibold text-gray-800">{active.mainCategoryName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditMain(active)}
                        className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Rename main category"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMain(active)}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete main category"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSubs.map((cat) => (
                  <div
                    key={cat.subCategoryId}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg bg-pink-100 text-pink-600">
                        {cat.subCategoryName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{cat.subCategoryName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditSub(cat)} className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50 transition-colors">
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteSub(cat)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={openAddSub}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    New sub-category
                  </span>
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Main category modal */}
      {mainModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {mainModal.id === null ? 'Add Main Category' : 'Rename Main Category'}
              </h2>
              <button onClick={() => setMainModal(EMPTY_MAIN_MODAL)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              {mainError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertCircleIcon className="h-4 w-4 shrink-0" />
                  {mainError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category Name</label>
                <input
                  type="text"
                  value={mainModal.name}
                  onChange={(e) => setMainModal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Cosmetics"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button onClick={() => setMainModal(EMPTY_MAIN_MODAL)} disabled={savingMain} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={saveMain} disabled={savingMain} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                {savingMain ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub category modal */}
      {subModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {subModal.id === null ? 'Add Sub-category' : 'Edit Sub-category'}
              </h2>
              <button onClick={() => setSubModal(EMPTY_SUB_MODAL)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              {subError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertCircleIcon className="h-4 w-4 shrink-0" />
                  {subError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Main Category</label>
                <select
                  value={subModal.mainCategoryId ?? ''}
                  onChange={(e) => setSubModal(prev => ({ ...prev, mainCategoryId: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {mainCategories.map(m => (
                    <option key={m.mainCategoryId} value={m.mainCategoryId}>{m.mainCategoryName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Sub-category Name</label>
                <input
                  type="text"
                  value={subModal.name}
                  onChange={(e) => setSubModal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Skin Care"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button onClick={() => setSubModal(EMPTY_SUB_MODAL)} disabled={savingSub} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={saveSub} disabled={savingSub} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                {savingSub ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
