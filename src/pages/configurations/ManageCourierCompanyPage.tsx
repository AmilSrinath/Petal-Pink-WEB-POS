import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { TrashIcon, EditIcon } from 'lucide-react';

interface CourierCompany {
  id: string;
  companyName: string;
  contact: string;
  address: string;
  email: string;
}

const mockCompanies: CourierCompany[] = [
  {
    id: '1',
    companyName: 'Domex',
    contact: '0117759759',
    address: 'No.511, 10th Mile Post Rd, Warahera, Boralesgamuwa',
    email: 'mailrs@domex.lk',
  },
];

export function ManageCourierCompanyPage() {
  const [companies, setCompanies] = useState(mockCompanies);
  const [formData, setFormData] = useState({
    companyName: '',
    contact: '',
    address: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCompany = () => {
    if (formData.companyName.trim() && formData.contact.trim()) {
      const newCompany: CourierCompany = {
        id: String(companies.length + 1),
        ...formData,
      };
      setCompanies([...companies, newCompany]);
      setFormData({ companyName: '', contact: '', address: '', email: '' });
    }
  };

  const handleDeleteCompany = (id: string) => {
    setCompanies(companies.filter(c => c.id !== id));
  };

  const columns: Column<CourierCompany>[] = [
    { header: 'Company Name', accessor: 'companyName' },
    { header: 'Contact', accessor: 'contact' },
    { header: 'Address', accessor: 'address' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <button className="text-blue-600 hover:text-blue-800" title="Edit">
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteCompany(row.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter email"
                />
              </div>
            </div>
            <button
              onClick={handleAddCompany}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 h-10"
            >
              Add Company
            </button>
          </div>
        </div>

        <DataTable columns={columns} data={companies} />
      </div>
    </div>
  );
}
