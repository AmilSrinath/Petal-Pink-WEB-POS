import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface Location {
  id: string;
  warehouse: string;
  zone: string;
  shelf: string;
  bin: string;
  capacity: number;
  currentUsage: number;
  status: 'Available' | 'Full' | 'Reserved';
}

const mockLocations: Location[] = [
  { id: '1', warehouse: 'Warehouse A', zone: 'Zone 1', shelf: 'A1', bin: 'A1-1', capacity: 100, currentUsage: 85, status: 'Available' },
  { id: '2', warehouse: 'Warehouse A', zone: 'Zone 1', shelf: 'A1', bin: 'A1-2', capacity: 100, currentUsage: 100, status: 'Full' },
  { id: '3', warehouse: 'Warehouse B', zone: 'Zone 2', shelf: 'B1', bin: 'B1-1', capacity: 150, currentUsage: 45, status: 'Available' },
  { id: '4', warehouse: 'Warehouse B', zone: 'Zone 2', shelf: 'B2', bin: 'B2-1', capacity: 150, currentUsage: 0, status: 'Reserved' },
  { id: '5', warehouse: 'Warehouse C', zone: 'Zone 3', shelf: 'C1', bin: 'C1-1', capacity: 200, currentUsage: 120, status: 'Available' },
];

export function StockLocationPage() {
  const [locations, setLocations] = useState(mockLocations);
  const [showForm, setShowForm] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Available': 'bg-green-100 text-green-800',
      'Full': 'bg-red-100 text-red-800',
      'Reserved': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || '';
  };

  const columns: Column<Location>[] = [
    { header: 'Warehouse', accessor: 'warehouse' },
    { header: 'Zone', accessor: 'zone' },
    { header: 'Shelf', accessor: 'shelf' },
    { header: 'Bin', accessor: 'bin' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'Current Usage', accessor: (row) => (
      <div className="flex items-center gap-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full"
            style={{ width: `${(row.currentUsage / row.capacity) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold">{Math.round((row.currentUsage / row.capacity) * 100)}%</span>
      </div>
    )},
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
          <h2 className="text-2xl font-bold text-gray-900">Stock Locations</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Location
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                <select className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                  <option>Warehouse A</option>
                  <option>Warehouse B</option>
                  <option>Warehouse C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zone</label>
                <input type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Zone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Shelf</label>
                <input type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Shelf" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bin</label>
                <input type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Bin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input type="number" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Capacity" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Add Location</button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        <DataTable columns={columns} data={locations} />
      </div>
    </div>
  );
}
