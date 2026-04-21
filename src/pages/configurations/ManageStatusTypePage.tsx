import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { TrashIcon } from 'lucide-react';

interface StatusType {
  id: string;
  regId: string;
  statusType: string;
}

const mockStatusTypes: StatusType[] = [
  { id: '1', regId: 'Delivery Status', statusType: 'Active' },
  { id: '2', regId: 'Delivery Status', statusType: 'Pending' },
  { id: '3', regId: 'Delivery Status', statusType: 'Wrapping' },
  { id: '4', regId: 'Delivery Status', statusType: 'Despatch' },
  { id: '5', regId: 'Delivery Status', statusType: 'Deilvared' },
  { id: '6', regId: 'Delivery Status', statusType: 'Return' },
  { id: '7', regId: 'Delivery Status', statusType: 'Cancel' },
  { id: '8', regId: 'Delivery Status', statusType: 'Returning' },
  { id: '9', regId: 'Delivery Status', statusType: 'Checking' },
  { id: '10', regId: 'Pay Status', statusType: 'Paid' },
  { id: '11', regId: 'Pay Status', statusType: 'Not Paid' },
  { id: '12', regId: 'Inquiry Status', statusType: 'Deilvared' },
  { id: '13', regId: 'Inquiry Status', statusType: 'Not Delivered' },
  { id: '14', regId: 'Inquiry Status', statusType: 'Returned' },
  { id: '15', regId: 'Inquiry Status', statusType: 'Cancel' },
];

export function ManageStatusTypePage() {
  const [statusTypes, setStatusTypes] = useState(mockStatusTypes);
  const [formData, setFormData] = useState({
    regId: 'Delivery Status',
    statusType: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStatusType = () => {
    if (formData.statusType.trim()) {
      const newStatusType: StatusType = {
        id: String(statusTypes.length + 1),
        regId: formData.regId,
        statusType: formData.statusType.trim(),
      };
      setStatusTypes([...statusTypes, newStatusType]);
      setFormData({ regId: 'Delivery Status', statusType: '' });
    }
  };

  const handleDeleteStatusType = (id: string) => {
    setStatusTypes(statusTypes.filter(s => s.id !== id));
  };

  const columns: Column<StatusType>[] = [
    { header: 'Reg ID', accessor: 'regId' },
    { header: 'Status Type', accessor: 'statusType' },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => handleDeleteStatusType(row.id)}
          className="text-red-600 hover:text-red-800"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Reg</label>
              <select
                name="regId"
                value={formData.regId}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              >
                <option>Delivery Status</option>
                <option>Pay Status</option>
                <option>Inquiry Status</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Type</label>
              <input
                type="text"
                name="statusType"
                value={formData.statusType}
                onChange={handleChange}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStatusType()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="Enter status type"
              />
            </div>
            <button
              onClick={handleAddStatusType}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              Add Status Type
            </button>
          </div>
        </div>

        <DataTable columns={columns} data={statusTypes} />
      </div>
    </div>
  );
}
