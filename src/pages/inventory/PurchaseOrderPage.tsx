import React, { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon } from 'lucide-react';
import { api } from './Integratedpages';

interface Item {
  itemId: number;
  itemName: string;
  unitType: string;
  costPrice: number;
  unitPrice: number;
}

interface UnitType {
  unitTypeId: number;
  unitType: string;
}

interface OrderItem {
  itemId: string;
  itemName: string;
  qty: string;
  expectedPrice: string;
  lastGrnPrice: string;
  totalPrice: string;
  unitType: string;         // base unit from item
  selectedUnitType: string; // currently selected unit in dropdown
  searchQuery: string;
  searchResults: Item[];
  showDropdown: boolean;
}

// Maps a base unit to its allowed display units
const UNIT_GROUP_MAP: Record<string, string[]> = {
  ml: ['ml', 'l'],
  g: ['g', 'kg'],
  unit: ['unit'],
};

function getRelatedUnits(baseUnit: string, allUnitTypes: UnitType[]): string[] {
  const group = UNIT_GROUP_MAP[baseUnit.toLowerCase()] ?? [baseUnit];
  return allUnitTypes
    .map((u) => u.unitType)
    .filter((u) => group.includes(u.toLowerCase()));
}

export function PurchaseOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allUnitTypes, setAllUnitTypes] = useState<UnitType[]>([]);

  const emptyItem = (): OrderItem => ({
    itemId: '',
    itemName: '',
    qty: '',
    expectedPrice: '',
    lastGrnPrice: '',
    totalPrice: '',
    unitType: '',
    selectedUnitType: '',
    searchQuery: '',
    searchResults: [],
    showDropdown: false,
  });

  const [formData, setFormData] = useState({
    poPrefix: 'PO',
    poCode: Date.now(),
    poCodePrefix: 'PO',
    supplierId: '',
    supplierName: '',
    poDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    totalPrice: 0,
    paymentType: 1,
    status: 1,
    userId: 1,
    visible: 1,
    items: [emptyItem()] as OrderItem[],
  });

  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    api.getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('http://localhost:8080/api/items')
      .then((r) => r.json())
      .then((data: Item[]) => setAllItems(data))
      .catch(() => {});
  }, []);

  // Fetch unit types
  useEffect(() => {
    fetch('http://localhost:8080/api/unit-types')
      .then((r) => r.json())
      .then((data: UnitType[]) => setAllUnitTypes(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((item, i) => {
          if (dropdownRefs.current[i] && !dropdownRefs.current[i]!.contains(e.target as Node)) {
            return { ...item, showDropdown: false };
          }
          return item;
        }),
      }));
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'supplierId') {
      const supplier = suppliers.find((s) => s.supplierId === parseInt(value));
      setFormData((prev) => ({
        ...prev,
        supplierId: value,
        supplierName: supplier?.companyName || supplier?.salesmanName || '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleItemSearch = (index: number, query: string) => {
    const results = query.trim()
      ? allItems.filter((item) =>
          item.itemName.toLowerCase().includes(query.toLowerCase())
        )
      : [];

    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      searchQuery: query,
      itemName: query,
      itemId: '',
      unitType: '',
      selectedUnitType: '',
      searchResults: results,
      showDropdown: results.length > 0,
    };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleSelectItem = (index: number, item: Item) => {
    const relatedUnits = getRelatedUnits(item.unitType, allUnitTypes);
    const defaultUnit = relatedUnits[0] ?? item.unitType;

    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      itemId: String(item.itemId),
      itemName: item.itemName,
      searchQuery: item.itemName,
      expectedPrice: String(item.costPrice || ''),
      unitType: item.unitType,
      selectedUnitType: defaultUnit,
      showDropdown: false,
      searchResults: [],
    };

    const qty = parseFloat(newItems[index].qty) || 0;
    const price = parseFloat(newItems[index].expectedPrice) || 0;
    newItems[index].totalPrice = (qty * price).toFixed(2);

    const grandTotal = newItems.reduce(
      (sum, it) => sum + (parseFloat(it.totalPrice) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, items: newItems, totalPrice: grandTotal }));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const qty = parseFloat(field === 'qty' ? value : newItems[index].qty) || 0;
    const price = parseFloat(field === 'expectedPrice' ? value : newItems[index].expectedPrice) || 0;
    newItems[index].totalPrice = (qty * price).toFixed(2);
    const grandTotal = newItems.reduce(
      (sum, it) => sum + (parseFloat(it.totalPrice) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, items: newItems, totalPrice: grandTotal }));
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const grandTotal = newItems.reduce(
      (sum, it) => sum + (parseFloat(it.totalPrice) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, items: newItems, totalPrice: grandTotal }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        poPrefix: formData.poPrefix,
        poCode: formData.poCode,
        poCodePrefix: formData.poCodePrefix,
        supplierId: parseInt(formData.supplierId),
        supplierName: formData.supplierName,
        poDate: formData.poDate,
        expectedDate: formData.expectedDate,
        totalPrice: formData.totalPrice,
        paymentType: formData.paymentType,
        status: formData.status,
        userId: formData.userId,
        visible: formData.visible,
        details: formData.items.map((item) => ({
          itemId: parseInt(item.itemId) || 0,
          itemName: item.itemName,
          qty: parseFloat(item.qty) || 0,
          expectedPrice: parseFloat(item.expectedPrice) || 0,
          lastGrnPrice: parseFloat(item.lastGrnPrice) || 0,
          totalPrice: parseFloat(item.totalPrice) || 0,
          unitType: item.selectedUnitType,
        })),
      };

      await fetch('http://localhost:8080/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          poPrefix: 'PO',
          poCode: Date.now(),
          poCodePrefix: 'PO',
          supplierId: '',
          supplierName: '',
          poDate: new Date().toISOString().split('T')[0],
          expectedDate: '',
          totalPrice: 0,
          paymentType: 1,
          status: 1,
          userId: 1,
          visible: 1,
          items: [emptyItem()],
        });
        setSubmitted(false);
      }, 2000);
    } catch {
      alert('Failed to create Purchase Order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Order Created</h2>
          <p className="text-gray-600">The purchase order has been created successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Purchase Order</h2>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Order Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">PO Code Prefix</label>
                <input
                  type="text"
                  name="poCodePrefix"
                  value={formData.poCodePrefix}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.companyName || s.salesmanName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <input
                  type="date"
                  name="poDate"
                  value={formData.poDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
                <input
                  type="date"
                  name="expectedDate"
                  value={formData.expectedDate}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                <select
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value={1}>Cash</option>
                  <option value={2}>Credit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {formData.items.map((item, index) => {
                const relatedUnits = item.unitType
                  ? getRelatedUnits(item.unitType, allUnitTypes)
                  : [];

                return (
                  <div key={index} className="flex gap-3 items-end">

                    {/* Item Name with Search Autocomplete */}
                    <div
                      className="flex-1 relative"
                      ref={(el) => { dropdownRefs.current[index] = el; }}
                    >
                      <label className="block text-sm font-medium text-gray-700">Item Name</label>
                      <input
                        type="text"
                        value={item.searchQuery}
                        onChange={(e) => handleItemSearch(index, e.target.value)}
                        onFocus={() => {
                          if (item.searchResults.length > 0) {
                            const newItems = [...formData.items];
                            newItems[index] = { ...newItems[index], showDropdown: true };
                            setFormData((prev) => ({ ...prev, items: newItems }));
                          }
                        }}
                        placeholder="Search item..."
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                        required
                      />
                      {item.showDropdown && item.searchResults.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {item.searchResults.map((result) => (
                            <button
                              key={result.itemId}
                              type="button"
                              onMouseDown={() => handleSelectItem(index, result)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 hover:text-teal-700 border-b border-gray-100 last:border-0"
                            >
                              <span className="font-medium">{result.itemName}</span>
                              <span className="ml-2 text-xs text-gray-400">
                                {result.unitType} — Rs.{result.costPrice}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Unit Type Dropdown — shown only after an item is selected */}
                    <div className="w-28">
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      {relatedUnits.length > 0 ? (
                        <select
                          value={item.selectedUnitType}
                          onChange={(e) => handleItemChange(index, 'selectedUnitType', e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                        >
                          {relatedUnits.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-400">
                          —
                        </div>
                      )}
                    </div>

                    {/* Qty */}
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700">Qty</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-28">
                      <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                      <input
                        type="number"
                        value={item.expectedPrice}
                        step="0.01"
                        onChange={(e) => handleItemChange(index, 'expectedPrice', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Last GRN Price */}
                    <div className="w-28">
                      <label className="block text-sm font-medium text-gray-700">Last GRN Price</label>
                      <input
                        type="number"
                        value={item.lastGrnPrice}
                        step="0.01"
                        onChange={(e) => handleItemChange(index, 'lastGrnPrice', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700">Total</label>
                      <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium">
                        Rs.{item.totalPrice || '0.00'}
                      </div>
                    </div>

                    {/* Remove */}
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
                );
              })}

              <button
                type="button"
                onClick={addItem}
                className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Grand Total */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="font-medium">Order Total:</span>
                  <span className="font-bold text-lg">Rs. {formData.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Purchase Order'}
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