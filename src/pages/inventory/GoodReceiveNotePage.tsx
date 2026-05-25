import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from 'lucide-react';
import { api } from './Integratedpages';

export function GoodReceiveNotePage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    invoiceNo: '',
    supplierId: '',
    totalPrice: '',
    totalDiscount: '',
    createdDate: new Date().toISOString().split('T')[0],
    status: 1,
    userId: 1,
    visible: 1,
  });

  useEffect(() => {
    api.getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createGrn({
        ...formData,
        supplierId: parseInt(formData.supplierId),
        totalPrice: parseFloat(formData.totalPrice) || 0,
        totalDiscount: parseFloat(formData.totalDiscount) || 0,
      });
      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          invoiceNo: '', supplierId: '', totalPrice: '', totalDiscount: '',
          createdDate: new Date().toISOString().split('T')[0], status: 1, userId: 1, visible: 1,
        });
        setSubmitted(false);
      }, 2000);
    } catch {
      alert('Failed to create GRN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">GRN Created Successfully</h2>
          <p className="text-gray-600">Good Receive Note has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Good Receive Note</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">GRN Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice No</label>
                <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <select name="supplierId" value={formData.supplierId} onChange={handleChange} required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                  <option value="">Select supplier</option>
                  {suppliers.map(s => (
                    <option key={s.supplierId} value={s.supplierId}>{s.companyName || s.salesmanName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Price</label>
                <input type="number" name="totalPrice" value={formData.totalPrice} onChange={handleChange} step="0.01" required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Discount</label>
                <input type="number" name="totalDiscount" value={formData.totalDiscount} onChange={handleChange} step="0.01"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Receive Date</label>
                <input type="date" name="createdDate" value={formData.createdDate} onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button type="submit" disabled={loading}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create GRN'}
            </button>
            <button type="button" className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}