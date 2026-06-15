import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface MainCategory {
  mainItemCategoryId: number;
  mainItemCategoryName: string;
}

interface SubCategory {
  subItemCategoryId: number;
  mainItemCategoryId: number;
  mainItemCategoryName: string;
  subItemCategoryName: string;
  imagePath: string | null;
  status: number;
  userId: number | null;
  visible: number | null;
}

interface FormData {
  subItemCategoryId?: number;
  mainItemCategoryId: number | '';
  mainItemCategoryName: string;
  subItemCategoryName: string;
  imagePath: string;
  status: number;
  userId: number;
  visible: number;
}

const BASE_URL = `${API_BASE_URL}/api/sub-categories`;
const CATEGORY_URL = `${API_BASE_URL}/api/categories`;

const defaultForm: FormData = {
  mainItemCategoryId: '',
  mainItemCategoryName: '',
  subItemCategoryName: '',
  imagePath: '',
  status: 1,
  userId: 1,
  visible: 1,
};

export function ItemSubCategoryPage() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubCategories();
    fetchMainCategories();
  }, []);

  const fetchSubCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error('Failed to fetch sub categories');
      const data = await res.json();
      setSubCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMainCategories = async () => {
    try {
      const res = await fetch(CATEGORY_URL);
      if (!res.ok) throw new Error('Failed to fetch main categories');
      const data = await res.json();
      setMainCategories(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    const selectedCategory = mainCategories.find(c => c.mainItemCategoryId === selectedId);
    setFormData({
      ...formData,
      mainItemCategoryId: selectedId,
      mainItemCategoryName: selectedCategory?.mainItemCategoryName || '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.subItemCategoryName.trim() || !formData.mainItemCategoryId) return;
    setError(null);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(BASE_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} sub category`);
      await fetchSubCategories();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (subCategory: SubCategory) => {
    setFormData({
      subItemCategoryId: subCategory.subItemCategoryId,
      mainItemCategoryId: subCategory.mainItemCategoryId,
      mainItemCategoryName: subCategory.mainItemCategoryName,
      subItemCategoryName: subCategory.subItemCategoryName,
      imagePath: subCategory.imagePath || '',
      status: subCategory.status,
      userId: subCategory.userId || 1,
      visible: subCategory.visible || 1,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sub category?')) return;
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete sub category');
      await fetchSubCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setIsEditing(false);
    setShowForm(false);
  };

  const columns: Column<SubCategory>[] = [
    { header: 'Sub-Category Name', accessor: 'subItemCategoryName' },
    { header: 'Main Category', accessor: 'mainItemCategoryName' },
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
          <button onClick={() => handleDelete(row.subItemCategoryId)} className="text-red-600 hover:text-red-800">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Sub Categories</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Sub-Category
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Sub-Category' : 'Add New Sub-Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sub-Category Name</label>
                <input
                  type="text"
                  value={formData.subItemCategoryName}
                  onChange={(e) => setFormData({ ...formData, subItemCategoryName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter sub-category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Main Category</label>
                <select
                  value={formData.mainItemCategoryId}
                  onChange={handleMainCategoryChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select main category</option>
                  {mainCategories.map((cat) => (
                    <option key={cat.mainItemCategoryId} value={cat.mainItemCategoryId}>
                      {cat.mainItemCategoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image Path</label>
                <input
                  type="text"
                  value={formData.imagePath}
                  onChange={(e) => setFormData({ ...formData, imagePath: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter image path (optional)"
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
                  {isEditing ? 'Update Sub-Category' : 'Add Sub-Category'}
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

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading sub categories...</div>
        ) : (
          <DataTable columns={columns} data={subCategories} />
        )}

      </div>
    </div>
  );
}