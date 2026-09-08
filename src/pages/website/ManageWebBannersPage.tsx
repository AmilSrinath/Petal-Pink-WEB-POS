import React, { useCallback, useEffect, useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, ImageIcon, XIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { bannerApi, WsBanner } from '../../services/websiteService';

function getUserId(): number {
  const raw = localStorage.getItem('userId');
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : 1;
}

interface BannerFormState {
  bannerId: number | null;
  title: string;
  subtitle: string;
  imageUrl: string; // existing image (for preview / kept on update if no new file)
  file: File | null;
}

const EMPTY_FORM: BannerFormState = { bannerId: null, title: '', subtitle: '', imageUrl: '', file: null };

export function ManageWebBannersPage() {
  const [banners, setBanners] = useState<WsBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<BannerFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bannerApi.getAll();
      setBanners(data);
    } catch (e: any) {
      // Empty result now returns [] from the backend, but keep this in case
      // an older backend build still 500s on an empty table.
      setBanners([]);
      setError(e.message ?? 'Failed to load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (banner: WsBanner) => {
    setForm({
      bannerId: banner.bannerId,
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? '',
      imageUrl: banner.imageUrl ?? '',
      file: null,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm(prev => ({ ...prev, file }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.subtitle.trim()) {
      setFormError('Title and subtitle are required.');
      return;
    }
    if (form.bannerId === null && !form.file) {
      setFormError('An image is required for a new banner.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const userId = getUserId();
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('subtitle', form.subtitle.trim());
      fd.append('user_id', String(userId));

      if (form.bannerId === null) {
        // create — backend expects the file under "image_url"
        fd.append('image_url', form.file as File);
        await bannerApi.save(fd);
      } else {
        // update — existing url kept as "image_url", new file (optional) as "image_file"
        fd.append('image_url', form.imageUrl ?? '');
        if (form.file) fd.append('image_file', form.file);
        await bannerApi.update(form.bannerId, fd);
      }

      setShowModal(false);
      await fetchBanners();
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (banner: WsBanner) => {
    if (!confirm(`Delete banner "${banner.title}"? This cannot be undone.`)) return;
    setDeletingId(banner.bannerId);
    try {
      await bannerApi.delete(banner.bannerId);
      setBanners(prev => prev.filter(b => b.bannerId !== banner.bannerId));
    } catch (e: any) {
      alert('Delete failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage banners shown on petalpink.lk</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBanners}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Banner
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
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <div key={banner.bannerId} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              {banner.imageUrl ? (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="h-16 w-28 flex-shrink-0 rounded-lg object-cover bg-gray-50"
                />
              ) : (
                <div className="h-16 w-28 flex-shrink-0 rounded-lg bg-gradient-to-br from-teal-100 to-pink-100 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-teal-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                {banner.subtitle && <p className="text-sm text-gray-500 mt-0.5 truncate">{banner.subtitle}</p>}
                {banner.createdDate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Added {new Date(banner.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEditModal(banner)}
                  className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50 transition-colors"
                  title="Edit"
                >
                  <EditIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(banner)}
                  disabled={deletingId === banner.bannerId}
                  className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {banners.length === 0 && !error && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400">
              No banners yet. Click "Add Banner" to create the first one.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {form.bannerId === null ? 'Add Banner' : 'Edit Banner'}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertCircleIcon className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Summer Collection 2026"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subtitle</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="New fashion arrivals"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Image</label>
                {form.imageUrl && !form.file && (
                  <img src={form.imageUrl} alt="Current banner" className="mb-2 h-20 w-full rounded-lg object-cover bg-gray-50" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
                />
                {form.bannerId !== null && (
                  <p className="mt-1 text-xs text-gray-400">Leave empty to keep the current image.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
