import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon, XIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

// ─── API ──────────────────────────────────────────────────────────────────────

const BASE_URL = `${API_BASE_URL}/api/stock-location`;

interface StockCategoryDTO {
  stockCategoryId?: number;
  stockName: string;
  location: string;
  status: number;
  userId: number;
  visible: number;
}

const stockCategoryApi = {
  getAll: async (): Promise<StockCategoryDTO[]> => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch stock categories');
    return res.json();
  },

  create: async (dto: StockCategoryDTO): Promise<string> => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create stock category');
    return res.text();
  },

  update: async (dto: StockCategoryDTO): Promise<string> => {
    const res = await fetch(BASE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to update stock category');
    return res.text();
  },

  delete: async (id: number): Promise<string> => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete stock category');
    return res.text();
  },
};

// ─── Empty form state ─────────────────────────────────────────────────────────

const emptyForm = (): StockCategoryDTO => ({
  stockName: '',
  location: '',
  status: 1,
  userId: 1,
  visible: 1,
});

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  formData: StockCategoryDTO;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

function StockLocationModal({ title, onClose, onSave, saving, formData, onChange }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Name</label>
            <input
              type="text"
              name="stockName"
              value={formData.stockName}
              onChange={onChange}
              placeholder="e.g. Main Warehouse"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={onChange}
              placeholder="e.g. Building A, Floor 2"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

function DeleteConfirmModal({ onClose, onConfirm, deleting }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-900">Delete Location</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete this stock location? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function StockLocationPage() {
  const [locations, setLocations] = useState<StockCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<StockCategoryDTO>(emptyForm());
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<StockCategoryDTO>(emptyForm());
  const [editSaving, setEditSaving] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockCategoryApi.getAll();
      setLocations(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddForm(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : value }));
  };

  const handleAdd = async () => {
    if (!addForm.stockName.trim() || !addForm.location.trim()) {
      alert('Please fill in Stock Name and Location.');
      return;
    }
    setAddSaving(true);
    try {
      await stockCategoryApi.create(addForm);
      setShowAddModal(false);
      setAddForm(emptyForm());
      load();
    } catch (err: any) {
      alert(err.message ?? 'Failed to add location.');
    } finally {
      setAddSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const openEdit = (row: StockCategoryDTO) => {
    setEditForm({ ...row });
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : value }));
  };

  const handleUpdate = async () => {
    if (!editForm.stockName.trim() || !editForm.location.trim()) {
      alert('Please fill in Stock Name and Location.');
      return;
    }
    setEditSaving(true);
    try {
      await stockCategoryApi.update(editForm);
      setShowEditModal(false);
      load();
    } catch (err: any) {
      alert(err.message ?? 'Failed to update location.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await stockCategoryApi.delete(deleteId);
      setDeleteId(null);
      load();
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete location.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<StockCategoryDTO>[] = [
    { header: 'ID', accessor: 'stockCategoryId' },
    { header: 'Stock Name', accessor: 'stockName' },
    { header: 'Location', accessor: 'location' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          row.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status === 1 ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteId(row.stockCategoryId!)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Stock Locations</h2>
          <button
            onClick={() => { setAddForm(emptyForm()); setShowAddModal(true); }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" /> Add Location
          </button>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={locations} />
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <StockLocationModal
          title="Add New Location"
          formData={addForm}
          onChange={handleAddChange}
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
          saving={addSaving}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <StockLocationModal
          title="Edit Location"
          formData={editForm}
          onChange={handleEditChange}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdate}
          saving={editSaving}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <DeleteConfirmModal
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}