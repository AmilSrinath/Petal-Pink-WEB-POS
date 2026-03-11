import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface SubCategory {
  id: string;
  name: string;
  mainCategory: string;
  description: string;
  status: 'Active' | 'Inactive';
}

const mockSubCategories: SubCategory[] = [
  { id: '1', name: 'Soft Drinks', mainCategory: 'Beverages', description: 'Non-alcoholic beverages', status: 'Active' },
  { id: '2', name: 'Juices', mainCategory: 'Beverages', description: 'Fruit and vegetable juices', status: 'Active' },
  { id: '3', name: 'Energy Drinks', mainCategory: 'Beverages', description: 'Energy and sports drinks', status: 'Active' },
  { id: '4', name: 'Biscuits', mainCategory: 'Snacks', description: 'Various types of biscuits', status: 'Active' },
  { id: '5', name: 'Chips', mainCategory: 'Snacks', description: 'Potato and corn chips', status: 'Active' },
];

export function ItemSubCategoryPage() {
  const [subCategories, setSubCategories] = useState(mockSubCategories);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', mainCategory: '', description: '', status: 'Active' });

  const handleAddSubCategory = () => {
    if (formData.name.trim() && formData.mainCategory) {
      const newSubCategory: SubCategory = {
        id: String(subCategories.length + 1),
        name: formData.name,
        mainCategory: formData.mainCategory,
        description: formData.description,
        status: formData.status as 'Active' | 'Inactive',
      };
      setSubCategories([...subCategories, newSubCategory]);
      setFormData({ name: '', mainCategory: '', description: '', status: 'Active' });
      setShowForm(false);
    }
  };

  const columns: Column<SubCategory>[] = [
    { header: 'Sub-Category Name', accessor: 'name' },
    { header: 'Main Category', accessor: 'mainCategory' },
    { header: 'Description', accessor: 'description' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {row.status}
      </span>
    )},
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
          <h2 className="text-2xl font-bold text-gray-900">Sub Categories</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Sub-Category
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Sub-Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sub-Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter sub-category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Main Category</label>
                <select
                  value={formData.mainCategory}
                  onChange={(e) => setFormData({ ...formData, mainCategory: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select main category</option>
                  <option>Beverages</option>
                  <option>Food Items</option>
                  <option>Snacks</option>
                  <option>Dairy Products</option>
                </select>
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
              <div className="flex gap-2">
                <button
                  onClick={handleAddSubCategory}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Add Sub-Category
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

        <DataTable columns={columns} data={subCategories} />
      </div>
    </div>
  );
}
