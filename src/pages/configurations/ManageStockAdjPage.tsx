import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { TrashIcon, PencilIcon, XIcon, CheckIcon, PlusCircleIcon, MinusCircleIcon } from 'lucide-react';

interface StockAdjType {
  stockAdjTypeId: number;
  stockAdjTypeName: string;
  isStockAdd: number; // 1 = Add stock, 0 = Reduce stock
  userId: number;
  status: number;
}

const API_BASE = 'http://localhost:8080/api/stock-adj-types';

export function ManageStockAdjPage() {
  const [stockAdjTypes, setStockAdjTypes] = useState<StockAdjType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStockAdd, setIsStockAdd] = useState<number>(1); // default: Add
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingIsStockAdd, setEditingIsStockAdd] = useState<number>(1);

  // GET all
  const fetchStockAdjTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch stock adjustment types');
      const data: StockAdjType[] = await res.json();
      setStockAdjTypes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockAdjTypes();
  }, []);

  // POST
  const handleAdd = async () => {
    if (!inputValue.trim()) return;
    setError(null);
    try {
      const payload: Partial<StockAdjType> = {
        stockAdjTypeName: inputValue.trim(),
        isStockAdd: isStockAdd,
        userId: 1,
        status: 1,
      };
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create stock adjustment type');
      setInputValue('');
      setIsStockAdd(1);
      fetchStockAdjTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // PUT
  const handleUpdate = async (row: StockAdjType) => {
    if (!editingValue.trim()) return;
    setError(null);
    try {
      const payload: StockAdjType = {
        ...row,
        stockAdjTypeName: editingValue.trim(),
        isStockAdd: editingIsStockAdd,
        userId: 1,
      };
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update stock adjustment type');
      setEditingId(null);
      setEditingValue('');
      fetchStockAdjTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditStart = (row: StockAdjType) => {
    setEditingId(row.stockAdjTypeId);
    setEditingValue(row.stockAdjTypeName);
    setEditingIsStockAdd(row.isStockAdd);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingValue('');
    setEditingIsStockAdd(1);
  };

  // DELETE (soft)
  const handleDelete = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete stock adjustment type');
      fetchStockAdjTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const columns: Column<StockAdjType>[] = [
    {
      header: 'Stock Adjustment Type',
      accessor: (row) =>
        editingId === row.stockAdjTypeId ? (
          <input
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdate(row);
              if (e.key === 'Escape') handleEditCancel();
            }}
            className="w-full rounded-md border border-teal-400 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            autoFocus
          />
        ) : (
          row.stockAdjTypeName
        ),
    },
    {
      header: 'Stock Effect',
      accessor: (row) =>
        editingId === row.stockAdjTypeId ? (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`edit-stock-effect-${row.stockAdjTypeId}`}
                value={1}
                checked={editingIsStockAdd === 1}
                onChange={() => setEditingIsStockAdd(1)}
                className="accent-teal-600"
              />
              <span className="text-sm text-green-700 font-medium">Add</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`edit-stock-effect-${row.stockAdjTypeId}`}
                value={0}
                checked={editingIsStockAdd === 0}
                onChange={() => setEditingIsStockAdd(0)}
                className="accent-red-500"
              />
              <span className="text-sm text-red-700 font-medium">Reduce</span>
            </label>
          </div>
        ) : (
          <StockEffectBadge isStockAdd={row.isStockAdd} />
        ),
    },
    {
      header: 'Actions',
      accessor: (row) =>
        editingId === row.stockAdjTypeId ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdate(row)}
              className="text-green-600 hover:text-green-800"
              title="Save"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleEditCancel}
              className="text-gray-500 hover:text-gray-700"
              title="Cancel"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditStart(row)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.stockAdjTypeId)}
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

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end gap-4">

            {/* Name input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Adjustment Type
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="Enter stock adjustment type"
              />
            </div>

            {/* Stock Effect radio */}
            <div className="shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Effect
              </label>
              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stock-effect"
                    value={1}
                    checked={isStockAdd === 1}
                    onChange={() => setIsStockAdd(1)}
                    className="accent-teal-600"
                  />
                  <span className="flex items-center gap-1 text-sm text-green-700 font-medium">
                    <PlusCircleIcon className="h-4 w-4" />
                    Add Stock
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stock-effect"
                    value={0}
                    checked={isStockAdd === 0}
                    onChange={() => setIsStockAdd(0)}
                    className="accent-red-500"
                  />
                  <span className="flex items-center gap-1 text-sm text-red-700 font-medium">
                    <MinusCircleIcon className="h-4 w-4" />
                    Reduce Stock
                  </span>
                </label>
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Type
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-sm text-gray-500 py-8">Loading...</div>
        ) : (
          <DataTable columns={columns} data={stockAdjTypes} />
        )}

      </div>
    </div>
  );
}

// ── Helper badge component ──────────────────────────────────────────────────
function StockEffectBadge({ isStockAdd }: { isStockAdd: number }) {
  if (isStockAdd === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        <PlusCircleIcon className="h-3.5 w-3.5" />
        Add Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      <MinusCircleIcon className="h-3.5 w-3.5" />
      Reduce Stock
    </span>
  );
}