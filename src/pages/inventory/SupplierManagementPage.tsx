import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon, PhoneIcon, MailIcon, XIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API = `${API_BASE_URL}/api/suppliers`;

interface Supplier {
  supplierId?: number;
  salesmanName: string;
  companyName: string;
  brandName: string;
  telephone: string;
  phone: string;
  addree: string;
  gmail: string;
  status: number; // 1 = Active, 0 = Inactive
}

const emptyForm: Supplier = {
  salesmanName: '', companyName: '', brandName: '',
  telephone: '', phone: '', addree: '', gmail: '', status: 1,
};

export function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Supplier>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setSuppliers(data);
  };

  const openAddModal = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setFormData(supplier);
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'status' ? Number(value) : value }));
  };

  const handleSave = async () => {
    if (!formData.companyName.trim()) return;
    const method = isEditing ? 'PUT' : 'POST';
    await fetch(API, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    closeModal();
    fetchSuppliers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchSuppliers();
  };

  const columns: Column<Supplier>[] = [
    { header: 'Company', accessor: 'companyName' },
    { header: 'Brand', accessor: 'brandName' },
    { header: 'Salesman', accessor: 'salesmanName' },
    { header: 'Contact', accessor: (row) => (
      <div className="flex flex-col gap-1 text-xs">
        {row.phone && <div className="flex items-center gap-1"><PhoneIcon className="h-3 w-3" />{row.phone}</div>}
        {row.gmail && <div className="flex items-center gap-1"><MailIcon className="h-3 w-3" />{row.gmail}</div>}
      </div>
    )},
    { header: 'Address', accessor: 'addree' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        row.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>{row.status === 1 ? 'Active' : 'Inactive'}</span>
    )},
    { header: 'Actions', accessor: (row) => (
      <div className="flex gap-2">
        <button onClick={() => openEditModal(row)} className="text-blue-600 hover:text-blue-800">
          <EditIcon className="h-4 w-4" />
        </button>
        <button onClick={() => handleDelete(row.supplierId!)} className="text-red-600 hover:text-red-800">
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
          <button onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700">
            <PlusIcon className="h-4 w-4" /> Add Supplier
          </button>
        </div>

        <DataTable columns={columns} data={suppliers} />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Company Name *', name: 'companyName', placeholder: 'e.g. Fresh Supplies Ltd' },
                  { label: 'Brand Name', name: 'brandName', placeholder: 'Brand name' },
                  { label: 'Salesman Name', name: 'salesmanName', placeholder: 'Contact person' },
                  { label: 'Gmail', name: 'gmail', type: 'email', placeholder: 'email@example.com' },
                  { label: 'Phone', name: 'phone', type: 'tel', placeholder: 'Mobile number' },
                  { label: 'Telephone', name: 'telephone', type: 'tel', placeholder: 'Office number' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700">{f.label}</label>
                    <input type={f.type || 'text'} name={f.name}
                      value={(formData as any)[f.name]}
                      onChange={handleChange} placeholder={f.placeholder}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input type="text" name="addree" value={formData.addree} onChange={handleChange}
                    placeholder="Street address"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave}
                className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                {isEditing ? 'Update Supplier' : 'Save Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}