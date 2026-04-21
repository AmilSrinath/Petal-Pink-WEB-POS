import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { TrashIcon } from 'lucide-react';

interface Reason {
  id: string;
  name: string;
}

const mockReasons: Reason[] = [
  { id: '1', name: 'Customer no answer' },
  { id: '2', name: 'Customer phone off' },
  { id: '3', name: 'Check duty free' },
  { id: '4', name: 'Held at branch' },
  { id: '5', name: 'Wrong number' },
  { id: '6', name: 'Customer refused' },
  { id: '7', name: 'Postponed' },
  { id: '8', name: 'Address check' },
  { id: '9', name: 'Number error' },
  { id: '10', name: 'Customer Block' },
  { id: '11', name: 'Out of Service' },
  { id: '12', name: 'Customer call Cut' },
  { id: '13', name: 'Partial Lost in Branch' },
  { id: '14', name: 'Damage Parsal' },
  { id: '15', name: 'Late Pickup' },
  { id: '16', name: 'Stock hold' },
  { id: '17', name: 'Branch mistake' },
  { id: '18', name: 'Mis root' },
];

export function ManageReasonsPage() {
  const [reasons, setReasons] = useState(mockReasons);
  const [inputValue, setInputValue] = useState('');

  const handleAddReason = () => {
    if (inputValue.trim()) {
      const newReason: Reason = {
        id: String(reasons.length + 1),
        name: inputValue.trim(),
      };
      setReasons([...reasons, newReason]);
      setInputValue('');
    }
  };

  const handleDeleteReason = (id: string) => {
    setReasons(reasons.filter(r => r.id !== id));
  };

  const columns: Column<Reason>[] = [
    { header: 'Reason', accessor: 'name' },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => handleDeleteReason(row.id)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddReason()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="Enter reason"
              />
            </div>
            <button
              onClick={handleAddReason}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              Add Reason
            </button>
          </div>
        </div>

        <DataTable columns={columns} data={reasons} />
      </div>
    </div>
  );
}
