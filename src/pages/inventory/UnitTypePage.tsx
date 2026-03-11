import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface UnitType {
  id: string;
  name: string;
  symbol: string;
  description: string;
  status: 'Active' | 'Inactive';
}

const mockUnits: UnitType[] = [
  { id: '1', name: 'Piece', symbol: 'pc', description: 'Individual unit', status: 'Active' },
  { id: '2', name: 'Kilogram', symbol: 'kg', description: 'Weight measurement', status: 'Active' },
  { id: '3', name: 'Liter', symbol: 'L', description: 'Volume measurement', status: 'Active' },
  { id: '4', name: 'Box', symbol: 'Box', description: 'Box packaging', status: 'Active' },
  { id: '5', name: 'Pack', symbol: 'Pack', description: 'Pack packaging', status: 'Active' },
  { id: '6', name: 'Dozen', symbol: 'dz', description: '12 units', status: 'Inactive' },
];

export function UnitTypePage() {
  const [units, setUnits] = useState(mockUnits);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', symbol: '', description: '', status: 'Active' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUnit = () => {
    if (formData.name.trim() && formData.symbol.trim()) {
      const newUnit: UnitType = {
        id: String(units.length + 1),
        ...formData,
        status: formData.status as 'Active' | 'Inactive',
      };
      setUnits([...units, newUnit]);
      setFormData({ name: '', symbol: '', description: '', status: 'Active' });
      setShowForm(false);
    }
  };

  const columns: Column<UnitType>[] = [
    { header: 'Unit Name', accessor: 'name' },
    { header: 'Symbol', accessor: 'symbol' },
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
          <h2 className="text-2xl font-bold text-gray-900">Unit Types</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Unit
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Unit Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="e.g., Kilogram"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Symbol</label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="e.g., kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter description"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddUnit}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Add Unit
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

        <DataTable columns={columns} data={units} />
      </div>
    </div>
  );
}
