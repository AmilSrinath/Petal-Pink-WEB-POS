import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { TrashIcon } from 'lucide-react';

interface Status {
  id: string;
  description: string;
}

const mockStatuses: Status[] = [
  { id: '1', description: 'Delivery Status' },
  { id: '2', description: 'Pay Status' },
  { id: '3', description: 'Inquiry Status' },
];

export function ManageStatusPage() {
  const [statuses, setStatuses] = useState(mockStatuses);
  const [inputValue, setInputValue] = useState('');

  const handleAddStatus = () => {
    if (inputValue.trim()) {
      const newStatus: Status = {
        id: String(statuses.length + 1),
        description: inputValue.trim(),
      };
      setStatuses([...statuses, newStatus]);
      setInputValue('');
    }
  };

  const handleDeleteStatus = (id: string) => {
    setStatuses(statuses.filter(s => s.id !== id));
  };

  const columns: Column<Status>[] = [
    { header: 'Description', accessor: 'description' },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => handleDeleteStatus(row.id)}
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
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStatus()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="Enter status description"
              />
            </div>
            <button
              onClick={handleAddStatus}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              Add Status Reg
            </button>
          </div>
        </div>

        <DataTable columns={columns} data={statuses} />
      </div>
    </div>
  );
}
