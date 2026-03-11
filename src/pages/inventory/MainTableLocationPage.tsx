import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface TableLocation {
  id: string;
  name: string;
  code: string;
  section: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved';
}

const mockLocations: TableLocation[] = [
  { id: '1', name: 'Table 1', code: 'T001', section: 'Main Hall', capacity: 4, status: 'Available' },
  { id: '2', name: 'Table 2', code: 'T002', section: 'Main Hall', capacity: 4, status: 'Occupied' },
  { id: '3', name: 'Table 3', code: 'T003', section: 'Main Hall', capacity: 6, status: 'Available' },
  { id: '4', name: 'Table 4', code: 'T004', section: 'VIP Section', capacity: 8, status: 'Reserved' },
  { id: '5', name: 'Table 5', code: 'T005', section: 'VIP Section', capacity: 8, status: 'Available' },
];

export function MainTableLocationPage() {
  const [locations, setLocations] = useState(mockLocations);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', section: '', capacity: '', status: 'Available' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLocation = () => {
    if (formData.name.trim() && formData.code.trim()) {
      const newLocation: TableLocation = {
        id: String(locations.length + 1),
        name: formData.name,
        code: formData.code,
        section: formData.section,
        capacity: parseInt(formData.capacity),
        status: formData.status as 'Available' | 'Occupied' | 'Reserved',
      };
      setLocations([...locations, newLocation]);
      setFormData({ name: '', code: '', section: '', capacity: '', status: 'Available' });
      setShowForm(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Available': 'bg-green-100 text-green-800',
      'Occupied': 'bg-red-100 text-red-800',
      'Reserved': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || '';
  };

  const columns: Column<TableLocation>[] = [
    { header: 'Table Name', accessor: 'name' },
    { header: 'Code', accessor: 'code' },
    { header: 'Section', accessor: 'section' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(row.status)}`}>
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
          <h2 className="text-2xl font-bold text-gray-900">Main Table Locations</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Table
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Table Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Table Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Table name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="T001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <select name="section" value={formData.section} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                  <option value="">Select section</option>
                  <option>Main Hall</option>
                  <option>VIP Section</option>
                  <option>Outdoor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Seating capacity" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleAddLocation} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Add Table</button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        <DataTable columns={columns} data={locations} />
      </div>
    </div>
  );
}
