import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { TrashIcon } from 'lucide-react';

interface OrderType {
  id: string;
  name: string;
}

const mockOrderTypes: OrderType[] = [
  { id: '1', name: 'Whatsapp' },
  { id: '2', name: 'Website' },
  { id: '3', name: 'Reseller' },
];

export function ManageOrderTypePage() {
  const [orderTypes, setOrderTypes] = useState(mockOrderTypes);
  const [inputValue, setInputValue] = useState('');

  const handleAddOrderType = () => {
    if (inputValue.trim()) {
      const newOrderType: OrderType = {
        id: String(orderTypes.length + 1),
        name: inputValue.trim(),
      };
      setOrderTypes([...orderTypes, newOrderType]);
      setInputValue('');
    }
  };

  const handleReset = () => {
    setInputValue('');
  };

  const handleDeleteOrderType = (id: string) => {
    setOrderTypes(orderTypes.filter(o => o.id !== id));
  };

  const columns: Column<OrderType>[] = [
    { header: 'Order Type', accessor: 'name' },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => handleDeleteOrderType(row.id)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddOrderType()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="Enter order type"
              />
            </div>
            <button
              onClick={handleAddOrderType}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              Add Order Type
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        <DataTable columns={columns} data={orderTypes} />
      </div>
    </div>
  );
}
