import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { Trash2, Pencil, X, Check, Loader2, Plus } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API_BASE = `${API_BASE_URL}/api/courier-companies`;

interface CourierCompany {
  companyId: number;
  companyName: string;
  companyContact: string;
  address: string;
  email: string;
  createdDate: string;
  editedDate: string;
  status: number;
  userId: number;
}

interface FormData {
  companyName: string;
  companyContact: string;
  address: string;
  email: string;
}

const emptyForm: FormData = {
  companyName: '',
  companyContact: '',
  address: '',
  email: '',
};

export function ManageCourierCompanyPage() {
  const [companies, setCompanies] = useState<CourierCompany[]>([]);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all ──────────────────────────────────────────────────────────────
  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data: CourierCompany[] = await res.json();
      setCompanies(data);
    } catch (err: any) {
      setError(err.message ?? 'Could not load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.companyName.trim() || !formData.companyContact.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      if (editingId !== null) {
        // ── Update ────────────────────────────────────────────────────────
        const userId = parseInt(localStorage.getItem('userId') ?? '0', 10);
        const res = await fetch(API_BASE, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: editingId, ...formData, status: 1, userId }),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      } else {
        // ── Create ────────────────────────────────────────────────────────
        const userId = parseInt(localStorage.getItem('userId') ?? '0', 10);
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, status: 1, userId }),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      }
      await fetchCompanies();
      cancelEdit();
    } catch (err: any) {
      setError(err.message ?? 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (company: CourierCompany) => {
    setEditingId(company.companyId);
    setFormData({
      companyName: company.companyName,
      companyContact: company.companyContact,
      address: company.address,
      email: company.email,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this company?')) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchCompanies();
    } catch (err: any) {
      setError(err.message ?? 'Delete failed.');
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: Column<CourierCompany>[] = [
    { header: 'Company Name', accessor: 'companyName' },
    { header: 'Contact',      accessor: 'companyContact' },
    { header: 'Address',      accessor: 'address' },
    { header: 'Email',        accessor: 'email' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.companyId)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const isEditing = editingId !== null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">

        {/* Form card */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              {isEditing ? 'Edit Company' : 'Add New Company'}
            </h2>
            {isEditing && (
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
          </div>

          {/* Fields + button */}
          <div className="flex items-end gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              {(
                [
                  { label: 'Company Name', name: 'companyName',    type: 'text',  placeholder: 'Enter company name'    },
                  { label: 'Contact',      name: 'companyContact', type: 'text',  placeholder: 'Enter contact number'  },
                  { label: 'Address',      name: 'address',     type: 'text',  placeholder: 'Enter address'         },
                  { label: 'Email',        name: 'email',       type: 'email', placeholder: 'Enter email'           },
                ] as const
              ).map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={(formData as any)[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                               focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                               transition-colors"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm
                         font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60
                         transition-colors h-10 whitespace-nowrap"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                <><Check className="h-4 w-4" /> Update</>
              ) : (
                <><Plus className="h-4 w-4" /> Add Company</>
              )}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <DataTable columns={columns} data={companies} />
        )}
      </div>
    </div>
  );
}