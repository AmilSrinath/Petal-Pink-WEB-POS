import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchIcon,
  PlusIcon,
  MinusIcon,
  FlaskConicalIcon,
  PackageIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  SaveIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  Loader2Icon,
  CalendarIcon,
  SendIcon,
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = `${API_BASE_URL}`;

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function stockStatus(needed, available) {
  if (available >= needed) return 'ok';
  if (available > 0) return 'low';
  return 'none';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockBadge({ needed, available }) {
  const status = stockStatus(needed, available);
  const styles = {
    ok:   { background: '#d1fae5', color: '#065f46', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
    low:  { background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
    none: { background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
  };
  const labels = { ok: 'Sufficient', low: 'Low', none: 'Insufficient' };
  return <span style={styles[status]}>{labels[status]}</span>;
}

function QtyControl({ value, onChange, min = 1 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 32, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', border: 'none', cursor: 'pointer', color: '#374151' }}
      >
        <MinusIcon size={14} />
      </button>
      <input
        type="number"
        min={min}
        value={value}
        onChange={e => onChange(Math.max(min, parseInt(e.target.value) || min))}
        style={{ width: 52, textAlign: 'center', border: 'none', borderLeft: '1px solid #d1d5db', borderRight: '1px solid #d1d5db', height: 36, fontSize: 14, fontWeight: 500, outline: 'none', color: '#111827' }}
      />
      <button
        onClick={() => onChange(value + 1)}
        style={{ width: 32, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', border: 'none', cursor: 'pointer', color: '#374151' }}
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}

function DateField({ label, value, onChange, readOnly = false, min }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <CalendarIcon
          size={13}
          style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: readOnly ? '#9ca3af' : '#0f766e', pointerEvents: 'none' }}
        />
        <input
          type="date"
          value={value}
          min={min}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          style={{
            paddingLeft: 28, paddingRight: 8, height: 34,
            border: `1px solid ${readOnly ? '#e5e7eb' : '#d1d5db'}`,
            borderRadius: 7, fontSize: 12, fontWeight: 500,
            color: readOnly ? '#9ca3af' : '#111827',
            background: readOnly ? '#f9fafb' : 'white',
            outline: 'none', cursor: readOnly ? 'default' : 'pointer',
            width: 148, boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}

// Toast notification
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af';
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: 'white', borderRadius: 10,
      padding: '12px 18px', fontSize: 13, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxWidth: 380,
      animation: 'slideUp 0.2s ease',
    }}>
      {type === 'success' ? <CheckCircleIcon size={16} /> : type === 'error' ? <XCircleIcon size={16} /> : <Loader2Icon size={16} />}
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7, fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductionPage() {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [sellingItems, setSellingItems] = useState([]);
  const [stockMap, setStockMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Selection state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  const [produceQty, setProduceQty] = useState(1);
  const [wastage, setWastage] = useState({});
  const [manufactureDate, setManufactureDate] = useState(todayISO());
  const [expireDate, setExpireDate] = useState('');

  // ── Queue state ────────────────────────────────────────────────────────────
  const [productionLines, setProductionLines] = useState([]);

  // ── Submission state ───────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitResults, setSubmitResults] = useState([]); // per-line result tracking
  const [toast, setToast] = useState(null); // { message, type }

  // ── Fetch items + stocks ───────────────────────────────────────────────────
  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${BASE_URL}/api/items`).then(r => {
        if (!r.ok) throw new Error(`Items API error: ${r.status}`);
        return r.json();
      }),
      fetch(`${BASE_URL}/api/stocks`).then(r => {
        if (!r.ok) throw new Error(`Stocks API error: ${r.status}`);
        return r.json();
      }),
    ])
      .then(([items, stocks]) => {
        const map = new Map(
          stocks.map(s => [s.itemId, { qty: s.qty, unitTypeName: s.unitTypeName ?? null, unitType: s.unitType }])
        );
        setStockMap(map);

        const mapped = items
          .filter(item => item.sellingStatus === 1)
          .map(item => {
            const stockEntry = map.get(item.itemId);
            return {
              id: item.itemId,
              name: item.itemName,
              sku: item.itemCodePrefix,
              category: item.subItemCategoryName,
              unit: stockEntry?.unitTypeName ?? item.unitType,
              unitTypeId: stockEntry?.unitType ?? item.unitTypeId ?? null,
              currentStock: stockEntry?.qty ?? item.quantity ?? 0,
              ingredients: [],
            };
          });
        setSellingItems(mapped);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // ── Fetch item template when item is selected ──────────────────────────────
  useEffect(() => {
    if (!selectedItem) return;

    setTemplateLoading(true);
    setTemplateError(null);
    setProduceQty(1);
    setWastage({});
    setManufactureDate(todayISO());
    setExpireDate('');

    fetch(`${BASE_URL}/api/item-templates/${selectedItem.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Template not found`);
        return res.json();
      })
      .then(data => {
        const ingredients = data.ingredients.map(ing => {
          const stockEntry = stockMap.get(ing.subItemId);
          return {
            id: ing.subItemId,
            name: ing.subItemName,
            unit: stockEntry?.unitTypeName ?? ing.unitType,
            qtyPerUnit: ing.quantity,
            currentStock: stockEntry?.qty ?? 0,
          };
        });
        setSelectedItem(prev => prev ? { ...prev, ingredients } : prev);
        setSellingItems(prev =>
          prev.map(item =>
            item.id === selectedItem.id ? { ...item, ingredients } : item
          )
        );
      })
      .catch(err => setTemplateError(err.message))
      .finally(() => setTemplateLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = Array.from(new Set(sellingItems.map(i => i.category)));
    return ['All', ...cats];
  }, [sellingItems]);

  const filteredItems = useMemo(() => {
    return sellingItems.filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.sku || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [sellingItems, search, categoryFilter]);

  const requiredIngredients = useMemo(() => {
    if (!selectedItem) return [];
    return selectedItem.ingredients.map(ing => ({
      ...ing,
      required: +(ing.qtyPerUnit * produceQty).toFixed(3),
    }));
  }, [selectedItem, produceQty]);

  const canProduce = useMemo(() => {
    if (!selectedItem || selectedItem.ingredients.length === 0) return true;
    return requiredIngredients.every(ing => ing.currentStock >= ing.required);
  }, [requiredIngredients, selectedItem]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSelectItem(item) {
    if (selectedItem?.id === item.id) return;
    setSelectedItem(item);
  }

  function handleAddToProduction() {
    if (!selectedItem) return;
    setProductionLines(prev => {
      const existing = prev.findIndex(l => l.sellingItem.id === selectedItem.id);
      const newLine = {
        sellingItem: selectedItem,
        produceQty,
        wastage: { ...wastage },
        manufactureDate,
        expireDate,
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          produceQty: updated[existing].produceQty + produceQty,
          wastage: { ...wastage },
          manufactureDate,
          expireDate,
        };
        return updated;
      }
      return [...prev, newLine];
    });
    setSubmitResults([]);
    showToast(`${selectedItem.name} added to production queue`, 'info');
  }

  function handleRemoveLine(id) {
    setProductionLines(prev => prev.filter(l => l.sellingItem.id !== id));
    setSubmitResults([]);
  }

  function handleUpdateLineDate(id, field, value) {
    setProductionLines(prev =>
      prev.map(l => l.sellingItem.id === id ? { ...l, [field]: value } : l)
    );
    setSubmitResults([]);
  }

  function showToast(message, type = 'info') {
    setToast({ message, type });
  }

  function handleReset() {
    setSelectedItem(null);
    setProductionLines([]);
    setSubmitResults([]);
    setManufactureDate(todayISO());
    setExpireDate('');
    setWastage({});
  }

  // ── CONFIRM PRODUCTION — calls POST /api/production for each line ──────────
  async function handleConfirmProduction() {
    if (productionLines.length === 0) return;

    // Validate: all lines need expireDate
    const missing = productionLines.filter(l => !l.expireDate);
    if (missing.length > 0) {
      showToast(`Set expire date for: ${missing.map(l => l.sellingItem.name).join(', ')}`, 'error');
      return;
    }

    setSubmitting(true);
    setSubmitResults([]);

    const results = [];

    for (const line of productionLines) {
      // Calculate total wastage as a number for the backend
      const totalWastage = Object.values(line.wastage).reduce((sum, v) => sum + (v || 0), 0);

      const payload = {
        itemId:       line.sellingItem.id,
        itemName:     line.sellingItem.name,
        manDate:      line.manufactureDate,
        expDate:      line.expireDate,
        unitType:     line.sellingItem.unitTypeId ?? null,
        qty:          line.produceQty,
        wastage:      totalWastage,
        userId:       1, // replace with actual logged-in user ID from your auth context
      };

      try {
        const res = await fetch(`${BASE_URL}/api/production`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const text = await res.text();

        if (res.ok) {
          results.push({ id: line.sellingItem.id, success: true, message: text });
        } else {
          results.push({ id: line.sellingItem.id, success: false, message: text || `HTTP ${res.status}` });
        }
      } catch (err) {
        results.push({ id: line.sellingItem.id, success: false, message: err.message });
      }
    }

    setSubmitResults(results);

    const successCount = results.filter(r => r.success).length;
    const failCount    = results.filter(r => !r.success).length;

    if (failCount === 0) {
      showToast(`All ${successCount} production(s) confirmed successfully!`, 'success');
      // Reload stock data to reflect changes
      loadData();
      // Remove successful lines from queue
      setProductionLines([]);
      setSubmitResults([]);
    } else if (successCount > 0) {
      showToast(`${successCount} succeeded, ${failCount} failed. See details below.`, 'error');
      // Remove successful lines, keep failed ones
      const failedIds = new Set(results.filter(r => !r.success).map(r => r.id));
      setProductionLines(prev => prev.filter(l => failedIds.has(l.sellingItem.id)));
    } else {
      showToast(`All ${failCount} production(s) failed. See details below.`, 'error');
    }

    setSubmitting(false);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#6b7280' }}>
        <Loader2Icon size={32} style={{ color: '#0f766e', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, margin: 0 }}>Loading items…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
        <XCircleIcon size={36} style={{ color: '#dc2626' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Failed to load items</p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{error}</p>
        <button
          onClick={loadData}
          style={{ marginTop: 8, padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .prod-item-btn:hover { border-color: #0f766e !important; background: #f0fdfa !important; }
        .prod-action-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Production</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>
            Select a selling item, configure quantity and dates, then confirm to post to stock.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, color: '#374151' }}
          >
            <RefreshCwIcon size={14} /> Reset
          </button>
          <button
            onClick={handleConfirmProduction}
            disabled={productionLines.length === 0 || submitting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none',
              background: productionLines.length === 0 || submitting ? '#d1d5db' : '#0f766e',
              cursor: productionLines.length === 0 || submitting ? 'not-allowed' : 'pointer',
              fontSize: 13, color: 'white', fontWeight: 600, minWidth: 170,
            }}
          >
            {submitting
              ? <><Loader2Icon size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              : <><SendIcon size={14} /> Confirm Production</>
            }
          </button>
        </div>
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>

        {/* LEFT — Item picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Selling Items
              <span style={{ marginLeft: 8, background: '#f0fdfa', color: '#0f766e', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {sellingItems.length}
              </span>
            </p>

            <div style={{ position: 'relative' }}>
              <SearchIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search item or SKU…"
                style={{ width: '100%', paddingLeft: 30, paddingRight: 12, height: 36, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, border: '1px solid',
                    borderColor: categoryFilter === cat ? '#0f766e' : '#e5e7eb',
                    background: categoryFilter === cat ? '#ccfbf1' : 'white',
                    color: categoryFilter === cat ? '#0f766e' : '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: 13 }}>No items found</div>
            )}
            {filteredItems.map(item => {
              const isSelected = selectedItem?.id === item.id;
              const inQueue = productionLines.some(l => l.sellingItem.id === item.id);
              return (
                <button
                  key={item.id}
                  className="prod-item-btn"
                  onClick={() => handleSelectItem(item)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                    border: isSelected ? '2px solid #0f766e' : '1px solid #e5e7eb',
                    background: isSelected ? '#f0fdfa' : 'white',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#0f766e' : '#111827', margin: 0 }}>
                        {item.name}
                        {inQueue && (
                          <span style={{ marginLeft: 6, background: '#d1fae5', color: '#065f46', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 600 }}>
                            IN QUEUE
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{item.sku} · {item.category}</p>
                    </div>
                    {isSelected && <ChevronRightIcon size={16} style={{ color: '#0f766e', marginTop: 2 }} />}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <PackageIcon size={12} style={{ color: '#9ca3af' }} />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      Stock: <strong>{item.currentStock}</strong> {item.unit}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>·</span>
                    <FlaskConicalIcon size={12} style={{ color: '#9ca3af' }} />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{item.ingredients.length} ingredients</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Template detail + queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 0, overflowY: 'auto' }}>

          {/* Item detail panel */}
          {selectedItem ? (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{selectedItem.name}</h2>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{selectedItem.sku} · {selectedItem.category}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Current Stock</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#0f766e', margin: 0 }}>{selectedItem.currentStock}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{selectedItem.unit}</p>
                </div>
              </div>

              {templateLoading ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Loader2Icon size={20} style={{ color: '#0f766e', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Loading ingredient template…</p>
                </div>
              ) : templateError ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: '#fff5f5', borderRadius: 8, border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <XCircleIcon size={20} style={{ color: '#dc2626' }} />
                  <p style={{ fontSize: 13, color: '#991b1b', margin: 0, fontWeight: 600 }}>Failed to load template</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{templateError}</p>
                </div>
              ) : (
                <>
                  {/* Controls row */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16, padding: '14px 16px', background: '#f9fafb', borderRadius: 8, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Produce Qty</p>
                      <QtyControl value={produceQty} onChange={setProduceQty} />
                    </div>
                    <div style={{ width: 1, height: 40, background: '#e5e7eb', alignSelf: 'center' }} />
                    <DateField label="Manufacture Date" value={manufactureDate} readOnly />
                    <DateField label="Expire Date" value={expireDate} onChange={setExpireDate} min={manufactureDate} />
                    <div style={{ marginLeft: 'auto' }}>
                      {canProduce ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontSize: 12, fontWeight: 600 }}>
                          <CheckCircleIcon size={14} /> Can Produce
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 12, fontWeight: 600 }}>
                          <XCircleIcon size={14} /> Insufficient Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ingredient table */}
                  {selectedItem.ingredients.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: 8, border: '1px dashed #e5e7eb' }}>
                      <FlaskConicalIcon size={24} style={{ color: '#d1d5db', marginBottom: 6 }} />
                      <p style={{ fontSize: 13, margin: 0 }}>No ingredients configured for this item.</p>
                      <p style={{ fontSize: 11, margin: '4px 0 0' }}>Add ingredients via the item template to display requirements here.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                            {['Ingredient', 'Per Unit', `Required (${produceQty}×)`, 'In Stock', 'Status', 'Wastage'].map((h, i) => (
                              <th key={h} style={{ textAlign: i === 0 ? 'left' : i === 4 ? 'center' : 'right', padding: '8px 10px', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', background: i === 2 ? '#f0fdfa' : 'transparent' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {requiredIngredients.map(ing => {
                            const status = stockStatus(ing.required, ing.currentStock);
                            const rowBg = status === 'none' ? '#fff5f5' : status === 'low' ? '#fffbeb' : 'transparent';
                            return (
                              <tr key={ing.id} style={{ borderBottom: '1px solid #f3f4f6', background: rowBg }}>
                                <td style={{ padding: '10px', color: '#111827', fontWeight: 500 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {status !== 'ok' && <AlertTriangleIcon size={13} style={{ color: status === 'none' ? '#dc2626' : '#d97706', flexShrink: 0 }} />}
                                    {ing.name}
                                  </div>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right', color: '#6b7280' }}>{ing.qtyPerUnit} {ing.unit}</td>
                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0f766e', background: '#f0fdfa' }}>{ing.required} {ing.unit}</td>
                                <td style={{ padding: '10px', textAlign: 'right', color: ing.currentStock < ing.required ? '#dc2626' : '#374151' }}>{ing.currentStock} {ing.unit}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <StockBadge needed={ing.required} available={ing.currentStock} />
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    value={wastage[ing.id] ?? ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setWastage(prev => ({
                                        ...prev,
                                        [ing.id]: val === '' ? 0 : Math.max(0, parseFloat(val) || 0),
                                      }));
                                    }}
                                    placeholder="0"
                                    style={{ width: 72, textAlign: 'right', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', color: '#111827', background: 'white' }}
                                  />
                                  <span style={{ marginLeft: 4, fontSize: 11, color: '#9ca3af' }}>{ing.unit}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Add to queue */}
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
                    {!expireDate && (
                      <span style={{ fontSize: 11, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangleIcon size={12} /> Expire date not set
                      </span>
                    )}
                    <button
                      onClick={handleAddToProduction}
                      className="prod-action-btn"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                        background: '#0f766e', color: 'white', border: 'none', borderRadius: 8,
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      <PlusIcon size={15} />
                      Add {produceQty}× {selectedItem.name} to Queue
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 12, border: '2px dashed #e5e7eb', color: '#9ca3af', gap: 8, minHeight: 200 }}>
              <FlaskConicalIcon size={36} style={{ color: '#d1d5db' }} />
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Select a selling item</p>
              <p style={{ fontSize: 12, margin: 0 }}>Its ingredient template will appear here</p>
            </div>
          )}

          {/* Production queue */}
          {productionLines.length > 0 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
                Production Queue
                <span style={{ marginLeft: 8, background: '#f0fdfa', color: '#0f766e', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                  {productionLines.length} item{productionLines.length > 1 ? 's' : ''}
                </span>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {productionLines.map(line => {
                  const canMake =
                    line.sellingItem.ingredients.length === 0 ||
                    line.sellingItem.ingredients.every(
                      ing => ing.currentStock >= +(ing.qtyPerUnit * line.produceQty).toFixed(3)
                    );

                  // Find submit result for this line if any
                  const result = submitResults.find(r => r.id === line.sellingItem.id);

                  return (
                    <div
                      key={line.sellingItem.id}
                      style={{
                        padding: '12px 14px', borderRadius: 8,
                        border: result
                          ? result.success ? '1px solid #6ee7b7' : '1px solid #fca5a5'
                          : '1px solid #e5e7eb',
                        background: result
                          ? result.success ? '#f0fdf4' : '#fff5f5'
                          : '#f9fafb',
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{line.sellingItem.name}</p>
                          <p style={{ fontSize: 11, color: '#9ca3af', margin: '1px 0 0' }}>{line.sellingItem.sku} · {line.sellingItem.category}</p>

                          {/* Per-ingredient wastage tags */}
                          {Object.entries(line.wastage).some(([, v]) => v > 0) && (
                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {line.sellingItem.ingredients
                                .filter(ing => (line.wastage[ing.id] ?? 0) > 0)
                                .map(ing => (
                                  <span key={ing.id} style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 6px' }}>
                                    {ing.name}: {line.wastage[ing.id]} {ing.unit} wasted
                                  </span>
                                ))}
                            </div>
                          )}

                          {/* API result message */}
                          {result && (
                            <p style={{ fontSize: 11, margin: '4px 0 0', color: result.success ? '#065f46' : '#991b1b', fontWeight: 500 }}>
                              {result.success ? '✓' : '✗'} {result.message}
                            </p>
                          )}
                        </div>

                        <div style={{ textAlign: 'center', minWidth: 60 }}>
                          <p style={{ fontSize: 18, fontWeight: 700, color: '#0f766e', margin: 0 }}>{line.produceQty}</p>
                          <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{line.sellingItem.unit}</p>
                        </div>

                        {canMake ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#059669', fontWeight: 600 }}>
                            <CheckCircleIcon size={13} /> Ready
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                            <XCircleIcon size={13} /> Stock Issue
                          </span>
                        )}

                        <button
                          onClick={() => handleRemoveLine(line.sellingItem.id)}
                          disabled={submitting}
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#fee2e2', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', color: '#dc2626' }}
                        >
                          <XCircleIcon size={13} />
                        </button>
                      </div>

                      {/* Date row */}
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <DateField label="Manufacture Date" value={line.manufactureDate} readOnly />
                        <DateField
                          label="Expire Date"
                          value={line.expireDate}
                          onChange={v => handleUpdateLineDate(line.sellingItem.id, 'expireDate', v)}
                          min={line.manufactureDate}
                        />
                        {!line.expireDate && (
                          <span style={{ fontSize: 11, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 6 }}>
                            <AlertTriangleIcon size={12} /> Expire date missing
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary + submit */}
              <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, background: '#f0fdfa', border: '1px solid #99f6e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 13, color: '#0f766e', fontWeight: 600, margin: 0 }}>Total to Produce</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>
                    {productionLines.reduce((s, l) => s + l.produceQty, 0)} units across {productionLines.length} SKU{productionLines.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleConfirmProduction}
                  disabled={productionLines.length === 0 || submitting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: submitting ? '#d1d5db' : '#0f766e',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    color: 'white', border: 'none', borderRadius: 8,
                    fontWeight: 600, fontSize: 13,
                  }}
                >
                  {submitting
                    ? <><Loader2Icon size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                    : <><SaveIcon size={14} /> Confirm & Post to Stock</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductionPage;