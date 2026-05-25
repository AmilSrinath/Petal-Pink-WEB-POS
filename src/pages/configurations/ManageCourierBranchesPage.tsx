import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { Trash2, Pencil, X, Check, Loader2, Plus } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/courier-branches';
const COMPANIES_API = 'http://localhost:8080/api/courier-companies';

interface CourierBranch {
  branchId: number;
  branchName: string;
  branchContact: string;
  company: string;
  status: number;
  userId: number;
  createdDate: string;
  editedDate: string;
}

interface CourierCompany {
  companyId: number;
  companyName: string;
}

interface FormData {
  branchName: string;
  branchContact: string;
  companyId: string;
}

const emptyForm: FormData = {
  branchName: '',
  branchContact: '',
  companyId: '',
};

export function ManageCourierBranchesPage() {
  const [branches, setBranches] = useState<CourierBranch[]>([]);
  const [companies, setCompanies] = useState<CourierCompany[]>([]);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch branches ─────────────────────────────────────────────────────────
  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data: CourierBranch[] = await res.json();
      setBranches(data);
    } catch (err: any) {
      setError(err.message ?? 'Could not load branches.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch companies ────────────────────────────────────────────────────────
  const fetchCompanies = async () => {
    try {
      const res = await fetch(COMPANIES_API);
      if (!res.ok) throw new Error(`Failed to fetch companies: ${res.status}`);
      const data: CourierCompany[] = await res.json();
      setCompanies(data);
    } catch (err: any) {
      setError(err.message ?? 'Could not load companies.');
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchCompanies();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.branchName.trim() || !formData.branchContact.trim() || !formData.companyId) return;

    const userId = parseInt(localStorage.getItem('userId') ?? '0', 10);

    setSubmitting(true);
    setError(null);
    try {
      if (editingId !== null) {
        const res = await fetch(API_BASE, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branchId: editingId,
            branchName: formData.branchName,
            branchContact: formData.branchContact,
            companyId: parseInt(formData.companyId, 10),
            status: 1,
            userId,
          }),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      } else {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branchName: formData.branchName,
            branchContact: formData.branchContact,
            companyId: parseInt(formData.companyId, 10),
            status: 1,
            userId,
          }),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      }
      await fetchBranches();
      cancelEdit();
    } catch (err: any) {
      setError(err.message ?? 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (branch: CourierBranch) => {
    setEditingId(branch.branchId);

    // Find the matching company by name to get its ID
    const matchedCompany = companies.find(c => c.companyName === branch.company);

    setFormData({
      branchName: branch.branchName,
      branchContact: branch.branchContact,
      companyId: matchedCompany ? String(matchedCompany.companyId) : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this branch?')) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchBranches();
    } catch (err: any) {
      setError(err.message ?? 'Delete failed.');
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns: Column<CourierBranch>[] = [
    { header: 'Branch Name',  accessor: 'branchName' },
    { header: 'Contact',      accessor: 'branchContact' },
    { header: 'Company',      accessor: 'company' },
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
            onClick={() => handleDelete(row.branchId)}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              {isEditing ? 'Edit Branch' : 'Add New Branch'}
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

          <div className="flex items-end gap-4">
            <div className="flex-1 grid grid-cols-3 gap-4">
              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  placeholder="Enter branch name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                             transition-colors"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <input
                  type="text"
                  name="branchContact"
                  value={formData.branchContact}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                             transition-colors"
                />
              </div>

              {/* Company Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                             transition-colors bg-white text-gray-700"
                >
                  <option value="">Select a company</option>
                  {companies.map(c => (
                    <option key={c.companyId} value={c.companyId}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
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
                <><Plus className="h-4 w-4" /> Add Branch</>
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
          <DataTable columns={columns} data={branches} />
        )}
      </div>
    </div>
  );
}