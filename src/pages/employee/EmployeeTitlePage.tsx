import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface EmployeeTitle {
  titleId: number;
  titleName: string;
  status: number;
}

interface FormData {
  titleId?: number;
  titleName: string;
  status: number;
}

const BASE_URL = `${API_BASE_URL}/api/employee-titles`;

const defaultForm: FormData = {
  titleName: '',
  status: 1,
};

export function EmployeeTitlePage() {
  const [titles, setTitles] = useState<EmployeeTitle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTitles();
  }, []);

  const fetchTitles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error('Failed to fetch titles');
      setTitles(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.titleName.trim()) return;
    setError(null);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(BASE_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} title`);
      await fetchTitles();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (title: EmployeeTitle) => {
    setFormData({
      titleId: title.titleId,
      titleName: title.titleName,
      status: title.status,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this title?')) return;
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete title');
      await fetchTitles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setIsEditing(false);
    setShowForm(false);
  };

  const columns: Column<EmployeeTitle>[] = [
    { header: 'Title Name', accessor: 'titleName' },
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
          <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
            <EditIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row.titleId)} className="text-red-600 hover:text-red-800">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Employee Title</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Title
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Title' : 'Add New Title'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title Name</label>
                <input
                  type="text"
                  value={formData.titleName}
                  onChange={(e) => setFormData({ ...formData, titleName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="e.g. Mr., Mrs., Dr., Eng."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value={1}>Active</option>
                  <option value={2}>Inactive</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  {isEditing ? 'Update Title' : 'Add Title'}
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading titles...</div>
        ) : (
          <DataTable columns={columns} data={titles} />
        )}

      </div>
    </div>
  );
}