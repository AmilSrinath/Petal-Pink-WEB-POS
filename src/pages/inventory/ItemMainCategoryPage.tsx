import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface MainCategory {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

const mockCategories: MainCategory[] = [
  { id: '1', name: 'Beverages', description: 'Soft drinks and juices', status: 'Active', createdDate: '2024-01-15' },
  { id: '2', name: 'Food Items', description: 'Packaged and fresh food', status: 'Active', createdDate: '2024-01-16' },
  { id: '3', name: 'Snacks', description: 'Chips, crackers, and snack items', status: 'Active', createdDate: '2024-01-17' },
  { id: '4', name: 'Dairy Products', description: 'Milk, cheese, and dairy items', status: 'Active', createdDate: '2024-01-18' },
  { id: '5', name: 'Frozen Items', description: 'Frozen vegetables and prepared meals', status: 'Inactive', createdDate: '2024-01-19' },
];

export function ItemMainCategoryPage() {
  const [categories, setCategories] = useState(mockCategories);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' });

  const handleAddCategory = () => {
    if (formData.name.trim()) {
      const newCategory: MainCategory = {
        id: String(categories.length + 1),
        name: formData.name,
        description: formData.description,
        status: formData.status as 'Active' | 'Inactive',
        createdDate: new Date().toISOString().split('T')[0],
      };
      setCategories([...categories, newCategory]);
      setFormData({ name: '', description: '', status: 'Active' });
      setShowForm(false);
    }
  };

  const columns: Column<MainCategory>[] = [
    { header: 'Category Name', accessor: 'name' },
    { header: 'Description', accessor: 'description' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {row.status}
      </span>
    )},
    { header: 'Created Date', accessor: 'createdDate' },
    { header: 'Actions', accessor: () => (
      <div className="flex gap-2">
        <button className="text-blue-600 hover:text-blue-800"><EditIcon className="h-4 w-4" /></button>
        <button className="text-red-600 hover:text-red-800"><TrashIcon className="h-4 w-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Main Categories</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Add Category
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <DataTable columns={columns} data={categories} />
      </div>
    </div>
  );
}
