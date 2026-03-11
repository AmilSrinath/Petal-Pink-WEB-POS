import React, { useState } from 'react';
import { CheckCircleIcon } from 'lucide-react';

export function StockTransferPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    transferNumber: `TRANSFER-${Date.now()}`,
    fromWarehouse: '',
    toWarehouse: '',
    transferDate: new Date().toISOString().split('T')[0],
    items: [{ itemName: '', quantity: '' }],
    reason: '',
    remarks: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: '' }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        transferNumber: `TRANSFER-${Date.now()}`,
        fromWarehouse: '',
        toWarehouse: '',
        transferDate: new Date().toISOString().split('T')[0],
        items: [{ itemName: '', quantity: '' }],
        reason: '',
        remarks: '',
      });
      setSubmitted(false);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Stock Transfer Created</h2>
          <p className="text-gray-600">The stock transfer has been initiated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Stock Transfer</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transfer Number</label>
                <input
                  type="text"
                  value={formData.transferNumber}
                  disabled
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transfer Date</label>
                <input
                  type="date"
                  name="transferDate"
                  value={formData.transferDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Warehouse</label>
                <select
                  name="fromWarehouse"
                  value={formData.fromWarehouse}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select warehouse</option>
                  <option>Warehouse A</option>
                  <option>Warehouse B</option>
                  <option>Warehouse C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To Warehouse</label>
                <select
                  name="toWarehouse"
                  value={formData.toWarehouse}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select warehouse</option>
                  <option>Warehouse A</option>
                  <option>Warehouse B</option>
                  <option>Warehouse C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Transfer</label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select reason</option>
                  <option>Stock Balancing</option>
                  <option>Redistribution</option>
                  <option>Maintenance</option>
                  <option>Relocation</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items to Transfer</h3>
            <div className="space-y-4 overflow-x-auto">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                      placeholder="Select item"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                      required
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-600 hover:bg-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50"
              >
                + Add Item
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="Additional remarks"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Create Transfer
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
