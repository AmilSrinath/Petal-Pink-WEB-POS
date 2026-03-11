import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface SubLocation {
  id: string;
  mainTable: string;
  subCode: string;
  description: string;
  status: 'Active' | 'Inactive';
}

const mockSubLocations: SubLocation[] = [
  { id: '1', mainTable: 'Table 1', subCode: 'T001-A', description: 'Left side seating', status: 'Active' },
  { id: '2', mainTable: 'Table 1', subCode: 'T001-B', description: 'Right side seating', status: 'Active' },
  { id: '3', mainTable: 'Table 4', subCode: 'T004-VIP1', description: 'VIP Prime Seats', status: 'Active' },
  { id: '4', mainTable: 'Table 4', subCode: 'T004-VIP2', description: 'VIP Secondary Seats', status: 'Active' },
  { id: '5', mainTable: 'Table 5', subCode: 'T005-A', description: 'Standard seating', status: 'Inactive' },
];

export function SubTableLocationPage() {
  const [locations, setLocations] = useState(mockSubLocations);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ mainTable: '', subCode: '', description: '', status: 'Active' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLocation = () => {
    if (formData.mainTable && formData.subCode.trim()) {
      const newLocation: SubLocation = {
        id: String(locations.length + 1),
        mainTable: formData.mainTable,
        subCode: formData.subCode,
        description: formData.description,
        status: formData.status as 'Active' | 'Inactive',
      };
      setLocations([...locations, newLocation]);
      setFormData({ mainTable: '', subCode: '', description: '', status: 'Active' });
      setShowForm(false);
    }
  };

  const columns: Column<SubLocation>[] = [
    { header: 'Main Table', accessor: 'mainTable' },
    { header: 'Sub-Location Code', accessor: 'subCode' },
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
          <h2 className="text-2xl font-bold text-gray-900">Sub-Table Locations</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Sub-Location
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Sub-Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Main Table</label>
                <select name="mainTable" value={formData.mainTable} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                  <option value="">Select main table</option>
                  <option>Table 1</option>
                  <option>Table 2</option>
                  <option>Table 3</option>
                  <option>Table 4</option>
                  <option>Table 5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sub-Location Code</label>
                <input type="text" name="subCode" value={formData.subCode} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="T001-A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Description" rows={2} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddLocation} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Add Sub-Location</button>
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <DataTable columns={columns} data={locations} />
      </div>
    </div>
  );
}
