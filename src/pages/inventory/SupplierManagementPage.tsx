import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon, PhoneIcon, MailIcon } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  status: 'Active' | 'Inactive';
  paymentTerms: string;
}

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Fresh Supplies Ltd', contactPerson: 'John Smith', phone: '9876543210', email: 'john@freshsupplies.com', address: '123 Supply Street', city: 'Mumbai', status: 'Active', paymentTerms: 'Net 30' },
  { id: '2', name: 'Quick Distributors', contactPerson: 'Sarah Johnson', phone: '9876543211', email: 'sarah@quickdist.com', address: '456 Distribution Ave', city: 'Delhi', status: 'Active', paymentTerms: 'COD' },
  { id: '3', name: 'Premium Foods Inc', contactPerson: 'Mike Wilson', phone: '9876543212', email: 'mike@premiumfoods.com', address: '789 Quality Road', city: 'Bangalore', status: 'Active', paymentTerms: 'Net 15' },
  { id: '4', name: 'Quality Imports', contactPerson: 'Lisa Brown', phone: '9876543213', email: 'lisa@qualityimports.com', address: '101 Import Lane', city: 'Chennai', status: 'Inactive', paymentTerms: 'Net 45' },
];

export function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    status: 'Active',
    paymentTerms: 'Net 30',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSupplier = () => {
    if (formData.name.trim()) {
      const newSupplier: Supplier = {
        id: String(suppliers.length + 1),
        ...formData,
        status: formData.status as 'Active' | 'Inactive',
      };
      setSuppliers([...suppliers, newSupplier]);
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        status: 'Active',
        paymentTerms: 'Net 30',
      });
      setShowForm(false);
    }
  };

  const columns: Column<Supplier>[] = [
    { header: 'Supplier Name', accessor: 'name' },
    { header: 'Contact Person', accessor: 'contactPerson' },
    { header: 'Contact', accessor: (row) => (
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1">
          <PhoneIcon className="h-3 w-3" />
          {row.phone}
        </div>
        <div className="flex items-center gap-1">
          <MailIcon className="h-3 w-3" />
          {row.email}
        </div>
      </div>
    )},
    { header: 'City', accessor: 'city' },
    { header: 'Payment Terms', accessor: 'paymentTerms' },
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
          <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Supplier
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Supplier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option>COD</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddSupplier}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Add Supplier
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <DataTable columns={columns} data={suppliers} />
      </div>
    </div>
  );
}
