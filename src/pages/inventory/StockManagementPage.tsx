import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockMaster {
  stockId: number;
  itemId: number;
  itemName: string;
  itemCodePrefix: string | null;
  qty: number;
  status: number;
}

interface StockDetail {
  stockDetailsId: number;
  stockId: number;
  grnId: number | null;
  mainItemCategoryId: number | null;
  subItemCategoryId: number | null;
  itemId: number;
  itemBarCode: number | null;
  stockCategoryId: number | null;
  stockName: string;
  unitTypeId: number | null;
  costPrice: number;
  lastGrnPrice: number;
  quantity: number;
  status: number;
  userId: number | null;
  visible: number;
}

interface StockCategory {
  stockCategoryId: number;
  stockName: string;
  location: string;
  status: number;
  userId: number;
  visible: number;
}

interface Item {
  stockId: number;
  itemId: number;
  itemName: string;
  itemCodePrefix: string | null;
  qty: number;
  status: number;
}

interface UnitType {
  unitTypeId: number;
  unitType: string;
  status: number;
  userId: number;
  visible: number;
}

interface StockTransactionPayload {
  itemId: number;
  itemName: string;
  quantityChange: number;
  grnId?: number | null;
  stockName?: string;
  costPrice?: number;
  lastGrnPrice?: number;
  itemBarCode?: number | null;
  mainItemCategoryId?: number | null;
  subItemCategoryId?: number | null;
  stockCategoryId?: number | null;
  unitTypeId?: number | null;
  userId?: number | null;
  visible?: number;
  reason?: string;
}

// ─── Batch Merge Types ────────────────────────────────────────────────────────

interface BatchProfile {
  profileId: number;
  regId: number;
  itemId: number;
  grnId: number | null;
  costPrice: number;
  retailPrice: number | null;
  wholeSalePrice: number | null;
  expDate: string | null;
  isReleaseForSell: number;
  poNo: string | null;
  unitType: number | null;
  isActive: number;
  userId: number | null;
  remark: string | null;
  plusQty: number;
}

interface BatchMergeRequest {
  sourceProfileIds: number[];
  targetGrnId: number | null;
  remark: string;
  userId: number | null;
}

type TxnMode = 'add' | 'reduce';
type TabId = 'overview' | 'transaction' | 'history' | 'batchMerge';

// ─── API layer ────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8080/api/stocks';

const api = {
  getMasterStocks: (): Promise<StockMaster[]> =>
    fetch(`${BASE}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),

  getAllDetails: (): Promise<StockDetail[]> =>
    fetch(`${BASE}/details`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),

  getDetailsByStockId: (stockId: number): Promise<StockDetail[]> =>
    fetch(`${BASE}/${stockId}/details`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),

  getStockCategories: (): Promise<StockCategory[]> =>
    fetch('http://localhost:8080/api/stock-location')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); }),

  getItems: (): Promise<Item[]> =>
    fetch('http://localhost:8080/api/stocks')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); }),

  getUnitTypes: (): Promise<UnitType[]> =>
    fetch('http://localhost:8080/api/unit-types')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); }),

  addStock: (payload: StockTransactionPayload): Promise<string> =>
    fetch(`${BASE}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.text()),

  reduceStock: (payload: StockTransactionPayload): Promise<string> =>
    fetch(`${BASE}/reduce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.text()),

  // ── Batch Merge ──────────────────────────────────────────────────────────
  getBatchProfilesByItem: (itemId: number): Promise<BatchProfile[]> =>
    fetch(`http://localhost:8080/api/batch/item/${itemId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); }),

  mergeBatches: (payload: BatchMergeRequest): Promise<string> =>
    fetch('http://localhost:8080/api/batch/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.text()),
};

// ─── Unit conversion helpers ──────────────────────────────────────────────────

type UnitFamily = {
  baseUnit: string;
  baseUnitTypeId: number;
  displayUnits: { label: string; unitTypeId: number; factor: number }[];
};

function resolveUnitFamily(
  unitTypeName: string,
  allUnitTypes: UnitType[],
): UnitFamily | null {
  const name = unitTypeName.toLowerCase();
  const find = (label: string) => allUnitTypes.find(u => u.unitType.toLowerCase() === label);

  if (name === 'ml' || name === 'l') {
    const ml = find('ml');
    const l  = find('l');
    if (!ml) return null;
    return {
      baseUnit: 'ml',
      baseUnitTypeId: ml.unitTypeId,
      displayUnits: [
        { label: 'ml', unitTypeId: ml.unitTypeId, factor: 1 },
        ...(l ? [{ label: 'l', unitTypeId: l.unitTypeId, factor: 1000 }] : []),
      ],
    };
  }

  if (name === 'g' || name === 'kg') {
    const g  = find('g');
    const kg = find('kg');
    if (!g) return null;
    return {
      baseUnit: 'g',
      baseUnitTypeId: g.unitTypeId,
      displayUnits: [
        { label: 'g', unitTypeId: g.unitTypeId, factor: 1 },
        ...(kg ? [{ label: 'kg', unitTypeId: kg.unitTypeId, factor: 1000 }] : []),
      ],
    };
  }

  const self = find(name) ?? find('unit') ?? allUnitTypes[0];
  if (!self) return null;
  return {
    baseUnit: self.unitType,
    baseUnitTypeId: self.unitTypeId,
    displayUnits: [{ label: self.unitType, unitTypeId: self.unitTypeId, factor: 1 }],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockStatus(qty: number) {
  if (!qty || qty === 0) return { label: 'Critical',  cls: 'bg-red-50 text-red-600 border border-red-200',             dot: 'bg-red-500' };
  if (qty < 50)          return { label: 'Low',       cls: 'bg-amber-50 text-amber-700 border border-amber-200',       dot: 'bg-amber-500' };
  if (qty > 500)         return { label: 'Overstock', cls: 'bg-violet-50 text-violet-700 border border-violet-200',    dot: 'bg-violet-500' };
  return                        { label: 'Optimal',   cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' };
}

const ADD_REASONS    = ['GRN_ADD', 'RETURN', 'ADJUSTMENT_IN'];
const REDUCE_REASONS = ['SALE', 'DAMAGE', 'ADJUSTMENT_OUT', 'EXPIRED'];

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const show = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ qty }: { qty: number }) {
  const s = getStockStatus(qty);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── ItemSearchInput ──────────────────────────────────────────────────────────

function ItemSearchInput({
  items,
  selectedId,
  onSelect,
}: {
  items: Item[];
  selectedId: string;
  onSelect: (item: Item) => void;
}) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState(-1);
  const [dropUp, setDropUp] = useState(false);
  const wrapRef             = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!selectedId) setQuery(''); }, [selectedId]);

  const filtered = query.trim()
    ? items.filter(i => i.itemName.toLowerCase().includes(query.toLowerCase()))
    : items;

  const choose = (item: Item) => {
    onSelect(item);
    setQuery(item.itemName);
    setOpen(false);
    setActive(-1);
  };

  const handleOpen = () => {
    if (wrapRef.current) {
      const rect       = wrapRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 320);
    }
    setOpen(true);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const inputCls = "w-full bg-white border border-stone-300 rounded-lg text-stone-800 text-sm px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-stone-300";
  const dropCls  = `absolute z-50 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`;

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        className={inputCls}
        placeholder="Search item name…"
        value={query}
        onChange={e => { setQuery(e.target.value); handleOpen(); setActive(-1); }}
        onFocus={handleOpen}
        onKeyDown={e => {
          if (!open) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
          if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(filtered[active]); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {selectedId && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full pointer-events-none">
          #{selectedId}
        </span>
      )}
      {open && filtered.length > 0 && (
        <ul className={dropCls}>
          {filtered.map((item, idx) => (
            <li
              key={item.itemId}
              onMouseDown={() => choose(item)}
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                idx === active ? 'bg-blue-50 text-blue-700' : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="font-medium">{item.itemName}</span>
              <span className="font-mono text-xs text-stone-400 ml-3">Qty {item.qty} · #{item.itemCodePrefix }</span>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && filtered.length === 0 && (
        <div className={`absolute z-50 w-full bg-white border border-stone-200 rounded-xl shadow-lg px-4 py-3 text-xs text-stone-400 italic ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          No items match "{query}"
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ stocks, details }: { stocks: StockMaster[]; details: StockDetail[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const counts    = stocks.reduce<Record<string, number>>((acc, s) => {
    const lbl = getStockStatus(s.qty).label;
    acc[lbl]  = (acc[lbl] || 0) + 1;
    return acc;
  }, {});
  const totalUnits = stocks.reduce((s, x) => s + (x.qty || 0), 0);

  const toggle = (id: number) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const statCards = [
    { label: 'Optimal',   count: counts['Optimal']   || 0, bg: 'bg-emerald-50', border: 'border-emerald-200', num: 'text-emerald-600', sub: 'text-emerald-500', icon: '✓' },
    { label: 'Low',       count: counts['Low']        || 0, bg: 'bg-amber-50',   border: 'border-amber-200',   num: 'text-amber-600',   sub: 'text-amber-500',   icon: '↓' },
    { label: 'Critical',  count: counts['Critical']   || 0, bg: 'bg-red-50',     border: 'border-red-200',     num: 'text-red-600',     sub: 'text-red-500',     icon: '!' },
    { label: 'Overstock', count: counts['Overstock']  || 0, bg: 'bg-violet-50',  border: 'border-violet-200',  num: 'text-violet-600',  sub: 'text-violet-500',  icon: '↑' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(c => (
          <div key={c.label} className={`rounded-2xl border-2 ${c.border} ${c.bg} p-5 relative overflow-hidden`}>
            <div className={`absolute top-3 right-4 text-2xl font-black opacity-10 ${c.num}`}>{c.icon}</div>
            <div className={`text-4xl font-black tracking-tight ${c.num}`}>{c.count}</div>
            <p className={`text-xs font-semibold mt-1 uppercase tracking-widest ${c.sub}`}>{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Current Stock Levels</span>
          <span className="font-mono text-xs text-stone-400 bg-white border border-stone-200 px-3 py-1 rounded-full">
            {totalUnits.toLocaleString()} total units
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60">
                {['Stock ID', 'Item Name', 'Item Code', 'Qty', 'Status', 'History'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-stone-400 text-sm">No stock records found</td></tr>
              ) : stocks.map(s => {
                const txns   = details.filter(d => d.stockId === s.stockId);
                const isOpen = expanded.has(s.stockId);
                return (
                  <React.Fragment key={s.stockId}>
                    <tr className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-stone-400">#{s.stockId}</td>
                      <td className="px-5 py-3.5 font-semibold text-stone-800">{s.itemName || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{s.itemCodePrefix }</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-stone-800">{(s.qty || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5"><StatusBadge qty={s.qty} /></td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => toggle(s.stockId)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full transition-colors"
                        >
                          {isOpen ? '▲ Hide' : `▼ ${txns.length} txns`}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-stone-50/80">
                        <td colSpan={6} className="px-8 py-4 border-b border-stone-100">
                          {txns.length === 0 ? (
                            <p className="text-xs text-stone-400 italic">No transactions yet</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr>
                                  {['Txn ID', 'Qty Change', 'Cost Price', 'GRN ID', 'User ID'].map(h => (
                                    <th key={h} className="text-left pb-2 pr-8 text-stone-400 uppercase tracking-wider font-bold">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {txns.map(d => (
                                  <tr key={d.stockDetailsId} className="border-t border-stone-200/60">
                                    <td className="font-mono py-1.5 pr-8 text-stone-500">#{d.stockDetailsId}</td>
                                    <td className={`font-mono font-bold py-1.5 pr-8 ${d.quantity >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {d.quantity >= 0 ? '+' : ''}{d.quantity}
                                    </td>
                                    <td className="font-mono py-1.5 pr-8 text-stone-700">Rs. {(d.costPrice || 0).toFixed(2)}</td>
                                    <td className="font-mono py-1.5 pr-8 text-stone-500">{d.grnId ?? '—'}</td>
                                    <td className="font-mono py-1.5 text-stone-500">{d.userId ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Tab ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  itemId: '', itemName: '', qty: '',
  grnId: '', stockName: '', costPrice: '', lastGrnPrice: '',
  barcode: '', mainCat: '', subCat: '', stockCat: '',
  unitType: '', userId: '', visible: '1',
};

function TransactionTab({
  onSuccess, stockCategories, items, unitTypes,
}: {
  onSuccess: (msg: string) => void;
  stockCategories: StockCategory[];
  items: Item[];
  unitTypes: UnitType[];
}) {
  const [mode,         setMode]         = useState<TxnMode>('add');
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [reason,       setReason]       = useState(ADD_REASONS[0]);
  const [loading,      setLoading]      = useState(false);
  const [errMsg,       setErrMsg]       = useState('');
  const [unitFamily,   setUnitFamily]   = useState<UnitFamily | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<{ label: string; unitTypeId: number; factor: number } | null>(null);

  const reasons = mode === 'add' ? ADD_REASONS : REDUCE_REASONS;

  useEffect(() => { setReason(mode === 'add' ? ADD_REASONS[0] : REDUCE_REASONS[0]); }, [mode]);

  const setField = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleItemSelect = (item: Item) => {
    setForm(p => ({ ...p, itemId: String(item.itemId), itemName: item.itemName, qty: '' }));
    setUnitFamily(null);
    setSelectedUnit(null);
  };

  const handleUnitPick = (ut: UnitType) => {
    const family = resolveUnitFamily(ut.unitType, unitTypes);
    setUnitFamily(family);
    if (family) {
      const match = family.displayUnits.find(u => u.label.toLowerCase() === ut.unitType.toLowerCase());
      setSelectedUnit(match ?? family.displayUnits[0]);
    }
  };

  const computedQty = (() => {
    const raw = parseFloat(form.qty);
    if (!raw || !selectedUnit) return null;
    return Math.round(raw * selectedUnit.factor);
  })();

  const handleSubmit = async () => {
    setErrMsg('');
    const itemId = parseInt(form.itemId);
    const qty    = computedQty ?? parseInt(form.qty);
    if (!itemId || !qty || qty <= 0) { setErrMsg('Please select an item and enter a positive quantity.'); return; }
    if (!selectedUnit) { setErrMsg('Please select a unit type for this item.'); return; }

    const payload: StockTransactionPayload = {
      itemId,
      itemName:           form.itemName,
      quantityChange:     qty,
      grnId:              parseInt(form.grnId) || null,
      stockName:          form.stockName,
      costPrice:          parseFloat(form.costPrice) || 0,
      lastGrnPrice:       parseFloat(form.lastGrnPrice) || 0,
      itemBarCode:        parseInt(form.barcode) || null,
      mainItemCategoryId: parseInt(form.mainCat) || null,
      subItemCategoryId:  parseInt(form.subCat) || null,
      stockCategoryId:    parseInt(form.stockCat) || null,
      unitTypeId:         unitFamily?.baseUnitTypeId ?? null,
      userId:             parseInt(form.userId) || null,
      visible:            parseInt(form.visible),
      reason,
    };

    setLoading(true);
    try {
      const msg    = mode === 'add' ? await api.addStock(payload) : await api.reduceStock(payload);
      const isErr  = msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('insufficient');
      if (isErr) setErrMsg(msg);
      else { setForm(EMPTY_FORM); setUnitFamily(null); setSelectedUnit(null); onSuccess(msg); }
    } catch {
      setErrMsg('Request failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white border border-stone-300 rounded-lg text-stone-800 text-sm px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-stone-300";
  const labelCls = "block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5";

  const pickableUnits = unitTypes.filter(u => u.unitType.toLowerCase() !== 'no convertion');
  const noConvUnit    = unitTypes.find(u => u.unitType.toLowerCase() === 'no convertion');

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 rounded-t-2xl flex items-center gap-4">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Stock Adjustment</span>
        <div className="ml-auto flex bg-white border border-stone-200 rounded-xl p-1 gap-1 shadow-sm">
          <button onClick={() => setMode('add')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'add' ? 'bg-emerald-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>＋ Add Stock</button>
          <button onClick={() => setMode('reduce')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'reduce' ? 'bg-red-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>－ Reduce Stock</button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {errMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="font-bold mt-0.5">⚠</span><span>{errMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Item <span className="text-red-400">*</span></label>
            <ItemSearchInput items={items} selectedId={form.itemId} onSelect={handleItemSelect} />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Quantity <span className="text-red-400">*</span></label>
            {form.itemId && (
              <div className="mb-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-stone-400 mr-1">Unit:</span>
                {noConvUnit && (
                  <button onClick={() => handleUnitPick(noConvUnit)} className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${selectedUnit?.label === noConvUnit.unitType ? 'bg-stone-700 border-stone-700 text-white' : 'border-stone-200 text-stone-500 bg-white hover:border-stone-400'}`}>unit</button>
                )}
                {['ml', 'l'].map(label => {
                  const ut = unitTypes.find(u => u.unitType.toLowerCase() === label);
                  if (!ut) return null;
                  return (
                    <button key={label} onClick={() => handleUnitPick(ut)} className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${selectedUnit?.label === label ? 'bg-blue-500 border-blue-500 text-white' : 'border-stone-200 text-stone-500 bg-white hover:border-blue-300 hover:text-blue-600'}`}>{label}</button>
                  );
                })}
                <span className="text-stone-300 text-xs">·</span>
                {['g', 'kg'].map(label => {
                  const ut = unitTypes.find(u => u.unitType.toLowerCase() === label);
                  if (!ut) return null;
                  return (
                    <button key={label} onClick={() => handleUnitPick(ut)} className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${selectedUnit?.label === label ? 'bg-amber-500 border-amber-500 text-white' : 'border-stone-200 text-stone-500 bg-white hover:border-amber-300 hover:text-amber-600'}`}>{label}</button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input type="number" className={inputCls} value={form.qty} onChange={setField('qty')} placeholder={selectedUnit ? `Enter in ${selectedUnit.label}` : 'Select unit first…'} min="1" step={selectedUnit?.label === 'l' || selectedUnit?.label === 'kg' ? '0.001' : '1'} disabled={!selectedUnit} />
              {computedQty !== null && selectedUnit && unitFamily && selectedUnit.factor > 1 && (
                <div className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 font-mono whitespace-nowrap">= {computedQty.toLocaleString()} {unitFamily.baseUnit}</div>
              )}
              {selectedUnit && selectedUnit.factor === 1 && form.qty && (
                <div className="flex-shrink-0 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-500 font-mono whitespace-nowrap">{selectedUnit.label}</div>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Stock Location</label>
            <select className={inputCls} value={form.stockCat} onChange={setField('stockCat')}>
              <option value="">Select location</option>
              {stockCategories.map(cat => (
                <option key={cat.stockCategoryId} value={cat.stockCategoryId}>{cat.stockName} - {cat.location}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className={labelCls}>Reason <span className="text-red-400">*</span></label>
            <div className="flex gap-2 flex-wrap">
              {reasons.map(r => (
                <button key={r} onClick={() => setReason(r)} className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${reason === r ? mode === 'add' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-red-500 border-red-500 text-white' : 'border-stone-200 text-stone-500 bg-white hover:border-stone-400 hover:text-stone-700'}`}>
                  {r.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
          <button onClick={() => { setForm(EMPTY_FORM); setUnitFamily(null); setSelectedUnit(null); }} className="px-5 py-2 text-sm font-semibold rounded-xl bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 transition-colors">Clear</button>
          <button onClick={handleSubmit} disabled={loading} className={`px-6 py-2 text-sm font-bold rounded-xl text-white transition-all disabled:opacity-50 shadow-sm ${mode === 'add' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'}`}>
            {loading ? 'Processing…' : mode === 'add' ? '＋ Add Stock' : '－ Reduce Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({ details }: { details: StockDetail[] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">All Transactions</span>
        <span className="font-mono text-xs text-stone-400 bg-white border border-stone-200 px-3 py-1 rounded-full">{details.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/60">
              {['Txn ID', 'Stock ID', 'Stock Name', 'Item ID', 'Qty Change', 'Cost Price', 'Last GRN', 'GRN ID', 'User ID', 'Barcode'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-stone-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-stone-400 text-sm italic">No transactions yet</td></tr>
            ) : details.map(d => (
              <tr key={d.stockDetailsId} className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-stone-400">#{d.stockDetailsId}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{d.stockId}</td>
                <td className="px-5 py-3.5 font-semibold text-stone-800">{d.stockName || '—'}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{d.itemId}</td>
                <td className={`px-5 py-3.5 font-mono font-bold text-sm ${d.quantity >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {d.quantity >= 0 ? '+' : ''}{d.quantity}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-stone-700">Rs. {(d.costPrice || 0).toFixed(2)}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-stone-700">Rs. {(d.lastGrnPrice || 0).toFixed(2)}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{d.grnId ?? '—'}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{d.userId ?? '—'}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{d.itemBarCode ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Batch Merge Tab ──────────────────────────────────────────────────────────

function BatchMergeTab({
  items,
  onSuccess,
}: {
  items: Item[];
  onSuccess: (msg: string) => void;
}) {
  const [selectedItem,    setSelectedItem]    = useState<Item | null>(null);
  const [batches,         setBatches]         = useState<BatchProfile[]>([]);
  const [batchesLoading,  setBatchesLoading]  = useState(false);
  const [batchesErr,      setBatchesErr]      = useState('');
  const [selectedIds,     setSelectedIds]     = useState<Set<number>>(new Set());
  const [targetGrnId,     setTargetGrnId]     = useState('');
  const [remark,          setRemark]          = useState('');
  const [userId,          setUserId]          = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [submitErr,       setSubmitErr]       = useState('');

  // Load batches whenever selected item changes
  useEffect(() => {
    if (!selectedItem) { setBatches([]); setSelectedIds(new Set()); return; }
    setBatchesLoading(true);
    setBatchesErr('');
    setBatches([]);
    setSelectedIds(new Set());

    api.getBatchProfilesByItem(selectedItem.itemId)
      .then(data => {
        // Only show active batches (is_active === 1)
        setBatches(data.filter(b => b.isActive === 1));
      })
      .catch(() => setBatchesErr('Failed to load batches for this item.'))
      .finally(() => setBatchesLoading(false));
  }, [selectedItem]);

  const toggleBatch = (profileId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(profileId) ? next.delete(profileId) : next.add(profileId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === batches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(batches.map(b => b.profileId)));
    }
  };

  const selectedBatches  = batches.filter(b => selectedIds.has(b.profileId));
  const mergedQty        = selectedBatches.reduce((sum, b) => sum + (b.plusQty ?? 0), 0);
  const avgCostPrice     = selectedBatches.length > 0
    ? selectedBatches.reduce((sum, b) => sum + (b.costPrice ?? 0), 0) / selectedBatches.length
    : 0;

  const canMerge = selectedIds.size >= 2 && !submitting;

  const handleMerge = async () => {
    setSubmitErr('');
    if (selectedIds.size < 2) { setSubmitErr('Select at least 2 batches to merge.'); return; }

    const payload: BatchMergeRequest = {
      sourceProfileIds: Array.from(selectedIds),
      targetGrnId:      parseInt(targetGrnId) || null,
      remark:           remark || `Merged ${selectedIds.size} batches`,
      userId:           parseInt(userId) || null,
    };

    setSubmitting(true);
    try {
      const msg    = await api.mergeBatches(payload);
      const isErr  = msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('cannot') || msg.toLowerCase().includes('error');
      if (isErr) {
        setSubmitErr(msg);
      } else {
        // Reset state
        setSelectedItem(null);
        setBatches([]);
        setSelectedIds(new Set());
        setTargetGrnId('');
        setRemark('');
        onSuccess(msg);
      }
    } catch {
      setSubmitErr('Request failed. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-white border border-stone-300 rounded-lg text-stone-800 text-sm px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-stone-300";
  const labelCls = "block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-5">

      {/* ── Step 1: Select Item ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-visible">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-stone-800 text-white text-xs font-black flex items-center justify-center flex-shrink-0">1</span>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Select Item</span>
        </div>
        <div className="p-6">
          <label className={labelCls}>Item <span className="text-red-400">*</span></label>
          <ItemSearchInput
            items={items}
            selectedId={selectedItem ? String(selectedItem.itemId) : ''}
            onSelect={item => { setSelectedItem(item); setSubmitErr(''); }}
          />
          {selectedItem && (
            <div className="mt-3 flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5">
              <span className="text-xs text-stone-400 font-mono">Item Code</span>
              <span className="font-mono text-xs font-bold text-stone-700">#{selectedItem.itemCodePrefix }</span>
              <span className="text-stone-300">·</span>
              <span className="text-xs text-stone-400 font-mono">Current Stock</span>
              <span className="font-mono text-xs font-bold text-stone-700">{(selectedItem.qty || 0).toLocaleString()}</span>
              <StatusBadge qty={selectedItem.qty} />
            </div>
          )}
        </div>
      </div>

      {/* ── Step 2: Select Batches ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0 transition-colors ${selectedItem ? 'bg-stone-800' : 'bg-stone-300'}`}>2</span>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Select Batches to Merge</span>
          {batches.length > 0 && (
            <span className="ml-auto font-mono text-xs text-stone-400 bg-white border border-stone-200 px-3 py-1 rounded-full">
              {selectedIds.size} / {batches.length} selected
            </span>
          )}
        </div>

        <div className="p-6">
          {!selectedItem && (
            <p className="text-sm text-stone-400 italic text-center py-8">Select an item above to see its active batches.</p>
          )}

          {selectedItem && batchesLoading && (
            <div className="flex items-center justify-center py-10 gap-3 text-stone-400 text-sm">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading batches…
            </div>
          )}

          {selectedItem && batchesErr && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{batchesErr}</div>
          )}

          {selectedItem && !batchesLoading && !batchesErr && batches.length === 0 && (
            <p className="text-sm text-stone-400 italic text-center py-8">No active batches found for this item.</p>
          )}

          {selectedItem && !batchesLoading && batches.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60">
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === batches.length && batches.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-stone-300 text-stone-800 cursor-pointer accent-stone-800"
                      />
                    </th>
                    {['Profile ID', 'Reg ID', 'GRN ID', 'Qty', 'Cost Price', 'Retail Price', 'Exp Date', 'Remark'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-stone-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => {
                    const isChecked = selectedIds.has(b.profileId);
                    return (
                      <tr
                        key={b.profileId}
                        onClick={() => toggleBatch(b.profileId)}
                        className={`border-b border-stone-100 cursor-pointer transition-colors ${isChecked ? 'bg-stone-50 hover:bg-stone-100/70' : 'hover:bg-stone-50/70'}`}
                      >
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBatch(b.profileId)}
                            className="w-4 h-4 rounded border-stone-300 cursor-pointer accent-stone-800"
                          />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-stone-400">#{b.profileId}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-stone-500">{b.regId}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-stone-500">{b.grnId ?? '—'}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-stone-800">{(b.plusQty ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-stone-700">Rs. {(b.costPrice ?? 0).toFixed(2)}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-stone-700">
                          {b.retailPrice != null ? `Rs. ${b.retailPrice.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-stone-500">
                          {b.expDate ? new Date(b.expDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-stone-500 max-w-[160px] truncate">{b.remark || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 3: Merge Preview + Config ───────────────────────────────── */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0 transition-colors ${selectedIds.size >= 2 ? 'bg-stone-800' : 'bg-stone-300'}`}>3</span>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Merge Configuration &amp; Preview</span>
        </div>

        <div className="p-6 space-y-5">

          {/* Merge preview summary */}
          {selectedIds.size >= 2 ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-stone-50 border border-stone-200 px-5 py-4">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Batches Merging</p>
                <p className="text-3xl font-black text-stone-800">{selectedIds.size}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Combined Qty</p>
                <p className="text-3xl font-black text-emerald-700">{mergedQty.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Avg Cost Price</p>
                <p className="text-3xl font-black text-blue-700">Rs. {avgCostPrice.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-stone-50 border border-dashed border-stone-300 px-5 py-6 text-center">
              <p className="text-sm text-stone-400">Select at least <span className="font-bold text-stone-600">2 batches</span> above to see the merge preview.</p>
            </div>
          )}

          {/* Config fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Target GRN ID <span className="text-stone-300 font-normal normal-case tracking-normal">(optional)</span></label>
              <input
                type="number"
                className={inputCls}
                value={targetGrnId}
                onChange={e => setTargetGrnId(e.target.value)}
                placeholder="e.g. 30"
                min="1"
              />
            </div>
            <div>
              <label className={labelCls}>User ID</label>
              <input
                type="number"
                className={inputCls}
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="e.g. 1"
                min="1"
              />
            </div>
            <div>
              <label className={labelCls}>Remark</label>
              <input
                type="text"
                className={inputCls}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="e.g. End of season consolidation"
                maxLength={200}
              />
            </div>
          </div>

          {submitErr && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="font-bold mt-0.5">⚠</span><span>{submitErr}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
            <button
              onClick={() => { setSelectedItem(null); setBatches([]); setSelectedIds(new Set()); setTargetGrnId(''); setRemark(''); setUserId(''); setSubmitErr(''); }}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleMerge}
              disabled={!canMerge}
              className="px-6 py-2 text-sm font-bold rounded-xl text-white bg-stone-800 hover:bg-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-stone-300"
            >
              {submitting
                ? 'Merging…'
                : selectedIds.size >= 2
                  ? `Merge ${selectedIds.size} Batches →`
                  : 'Select Batches to Merge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function StockManagementPage() {
  const [stocks,          setStocks]          = useState<StockMaster[]>([]);
  const [details,         setDetails]         = useState<StockDetail[]>([]);
  const [stockCategories, setStockCategories] = useState<StockCategory[]>([]);
  const [items,           setItems]           = useState<Item[]>([]);
  const [unitTypes,       setUnitTypes]       = useState<UnitType[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [tab,             setTab]             = useState<TabId>('overview');
  const { toast, show: showToast }            = useToast();

  const loadAll = useCallback(async () => {
    try {
      const [s, d, cats, itms, uts] = await Promise.all([
        api.getMasterStocks(),
        api.getAllDetails(),
        api.getStockCategories(),
        api.getItems(),
        api.getUnitTypes(),
      ]);
      setStocks(s);
      setDetails(d);
      setStockCategories(cats);
      setItems(itms);
      setUnitTypes(uts);
    } catch {
      showToast('Failed to load stock data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleTxnSuccess = (msg: string) => {
    showToast(msg, 'success');
    loadAll();
    setTab('overview');
  };

  const handleMergeSuccess = (msg: string) => {
    showToast(msg, 'success');
    loadAll();
    setTab('overview');
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview',    label: 'Overview' },
    { id: 'transaction', label: 'Stock Adjustment' },
    { id: 'history',     label: 'Transaction History' },
    { id: 'batchMerge',  label: 'Batch Merge' },
  ];

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">Loading inventory…</div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-stone-100 text-stone-800">
      <div className="px-7 py-4 border-b border-stone-200 bg-white flex items-center justify-between flex-shrink-0 shadow-sm">
        <div>
          <h1 className="text-xl font-black tracking-tight text-stone-900">Stock Management</h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            {stocks.length} items · {details.length} transactions
          </p>
        </div>
        <button onClick={loadAll} className="px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 transition-colors">
          ⟳ Refresh
        </button>
      </div>

      <div className="flex gap-1 px-7 py-3 border-b border-stone-200 bg-white flex-shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-7">
        {tab === 'overview'    && <OverviewTab     stocks={stocks} details={details} />}
        {tab === 'transaction' && <TransactionTab  onSuccess={handleTxnSuccess} stockCategories={stockCategories} items={items} unitTypes={unitTypes} />}
        {tab === 'history'     && <HistoryTab      details={details} />}
        {tab === 'batchMerge'  && <BatchMergeTab   items={items} onSuccess={handleMergeSuccess} />}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg border z-50 ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100'
            : 'bg-red-50 border-red-200 text-red-600 shadow-red-100'
        }`}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}
    </div>
  );
}