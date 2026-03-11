import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface PrinterType {
  id: string;
  name: string;
  model: string;
  type: string;
  location: string;
  status: 'Active' | 'Inactive';
}

const mockPrinters: PrinterType[] = [
  { id: '1', name: 'Receipt Printer 1', model: 'Epson TM-M30', type: 'Thermal Receipt', location: 'Counter 1', status: 'Active' },
  { id: '2', name: 'Receipt Printer 2', model: 'Star Micronics', type: 'Thermal Receipt', location: 'Counter 2', status: 'Active' },
  { id: '3', name: 'Label Printer', model: 'Zebra GK420d', type: 'Barcode Label', location: 'Store Room', status: 'Active' },
  { id: '4', name: 'Document Printer', model: 'HP LaserJet', type: 'Laser', location: 'Office', status: 'Inactive' },
];

export function PrinterTypePage() {
  const [printers, setPrinters] = useState(mockPrinters);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', model: '', type: '', location: '', status: 'Active' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPrinter = () => {
    if (formData.name.trim()) {
      const newPrinter: PrinterType = {
        id: String(printers.length + 1),
        ...formData,
        status: formData.status as 'Active' | 'Inactive',
      };
      setPrinters([...printers, newPrinter]);
      setFormData({ name: '', model: '', type: '', location: '', status: 'Active' });
      setShowForm(false);
    }
  };

  const columns: Column<PrinterType>[] = [
    { header: 'Printer Name', accessor: 'name' },
    { header: 'Model', accessor: 'model' },
    { header: 'Type', accessor: 'type' },
    { header: 'Location', accessor: 'location' },
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
          <h2 className="text-2xl font-bold text-gray-900">Printer Configuration</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Printer
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Printer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Printer Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Printer name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Model" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                  <option value="">Select type</option>
                  <option>Thermal Receipt</option>
                  <option>Barcode Label</option>
                  <option>Laser</option>
                  <option>Inkjet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="Location" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleAddPrinter} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Add Printer</button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        <DataTable columns={columns} data={printers} />
      </div>
    </div>
  );
}
