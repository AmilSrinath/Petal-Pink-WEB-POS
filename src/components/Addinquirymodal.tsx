import React, { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryOrder {
  deliveryId: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  customerNumber: string;
  phoneOne: string;
  phoneTwo: string;
  address: string;
}

interface Company {
  companyId: number;
  companyName: string;
  companyContact: string;
}

interface Branch {
  branchId: number;
  branchName: string;
  branchContact: string;
  companyId: number;
}

interface Reason {
  resonId: number;
  reson: string;
}

interface InquiryPayload {
  wayBill: string;
  customerId: number | null;
  customerName: string;
  customerPhone1: string;
  customerPhone2: string;
  company: string;
  branch: string;
  branchContact: string;
  reason: string;
  remark: string;
  status: number;
  userId: number;
  statusId: number;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
const steps = ['Tracking', 'Company', 'Branch', 'Reason', 'Confirm'];

function StepDot({ index, current, label }: { index: number; current: number; label: string }) {
  const done    = index < current;
  const active  = index === current;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
          ${done   ? 'bg-teal-500 border-teal-500 text-white' : ''}
          ${active ? 'bg-white border-teal-500 text-teal-600 shadow-md shadow-teal-100' : ''}
          ${!done && !active ? 'bg-gray-100 border-gray-200 text-gray-400' : ''}
        `}
      >
        {done ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          index + 1
        )}
      </div>
      <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-teal-600' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AddInquiryModal({ onClose, onSaved }: Props) {
  const [step, setStep] = useState(0);

  // Step 0 – tracking
  const [orderCode,    setOrderCode]    = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError,   setOrderError]   = useState<string | null>(null);
  const [order,        setOrder]        = useState<DeliveryOrder | null>(null);
  const trackingRef = useRef<HTMLInputElement>(null);

  // Step 1 – company
  const [companies,       setCompanies]       = useState<Company[]>([]);
  const [companiesLoading,setCompaniesLoading]= useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Step 2 – branch
  const [branches,       setBranches]       = useState<Branch[]>([]);
  const [branchesLoading,setBranchesLoading]= useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Step 3 – reason
  const [reasons,        setReasons]        = useState<Reason[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [remark,         setRemark]         = useState('');

  // Step 4 – save
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  // Auto-focus tracking input
  useEffect(() => { trackingRef.current?.focus(); }, []);

  // Load companies when reaching step 1
  useEffect(() => {
    if (step !== 1 || companies.length) return;
    setCompaniesLoading(true);
    fetch('http://localhost:8080/api/courier-companies')
      .then(r => r.json())
      .then(setCompanies)
      .catch(() => {})
      .finally(() => setCompaniesLoading(false));
  }, [step]);

  // Load branches when company is selected
  useEffect(() => {
    if (!selectedCompany) return;
    setBranches([]);
    setSelectedBranch(null);
    setBranchesLoading(true);
    fetch(`http://localhost:8080/api/courier-branches/by-company/${selectedCompany.companyId}`)
      .then(r => r.json())
      .then(setBranches)
      .catch(() => {})
      .finally(() => setBranchesLoading(false));
  }, [selectedCompany]);

  // Load reasons when reaching step 3
  useEffect(() => {
    if (step !== 3 || reasons.length) return;
    setReasonsLoading(true);
    fetch('http://localhost:8080/api/reasons')
      .then(r => r.json())
      .then(setReasons)
      .catch(() => {})
      .finally(() => setReasonsLoading(false));
  }, [step]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLookupTracking = async () => {
    const code = orderCode.trim();
    if (!code) { setOrderError('Please enter a tracking number.'); return; }
    setOrderLoading(true);
    setOrderError(null);
    setOrder(null);
    try {
      const res = await fetch(`http://localhost:8080/api/sales/delivery-orders/tracking/${code}`);
      if (res.status === 404) throw new Error('Tracking number not found.');
      if (!res.ok)            throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setOrder(data);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Failed to fetch order.');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSave = async () => {
    if (!order || !selectedCompany || !selectedBranch || !selectedReason) return;
    setSaving(true);
    setSaveError(null);
    const payload: InquiryPayload = {
      wayBill:       order.orderCode,
      customerId:    order.customerId,
      customerName:  order.customerName,
      customerPhone1: order.phoneOne,
      customerPhone2: order.phoneTwo ?? '',
      company:       selectedCompany.companyName,
      branch:        selectedBranch.branchName,
      branchContact: selectedBranch.branchContact,
      reason:        selectedReason.reson,
      remark,
      status:  1,
      userId:  1,
      statusId: 1,
    };
    try {
      const res = await fetch('http://localhost:8080/api/inquiry/inquiries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      onSaved();
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save inquiry.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-semibold text-right max-w-[55%]">{value || '—'}</span>
    </div>
  );

  // ── Step panels ────────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Order / Tracking Number
        </label>
        <div className="flex gap-2">
          <input
            ref={trackingRef}
            value={orderCode}
            onChange={e => { setOrderCode(e.target.value); setOrderError(null); setOrder(null); }}
            onKeyDown={e => e.key === 'Enter' && handleLookupTracking()}
            placeholder="e.g. NPP0000023"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
          />
          <button
            onClick={handleLookupTracking}
            disabled={orderLoading}
            className="rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white px-4 py-2.5 text-sm font-semibold transition-all"
          >
            {orderLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Looking…
              </span>
            ) : 'Look up'}
          </button>
        </div>
        {orderError && (
          <p className="mt-2 text-xs text-red-600 font-medium">{orderError}</p>
        )}
      </div>

      {order && (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 space-y-1 animate-[fadeIn_0.2s_ease]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"/>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Order Found</span>
          </div>
          <InfoRow label="Tracking"      value={order.orderCode} />
          <InfoRow label="Customer"      value={order.customerName} />
          <InfoRow label="Customer #"    value={order.customerNumber} />
          <InfoRow label="Phone 1"       value={order.phoneOne} />
          <InfoRow label="Phone 2"       value={order.phoneTwo} />
          <InfoRow label="Address"       value={order.address} />
        </div>
      )}

      <button
        disabled={!order}
        onClick={() => setStep(1)}
        className="w-full rounded-xl bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-sm font-semibold transition-all"
      >
        Continue →
      </button>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Select the courier company handling this inquiry.</p>
      {companiesLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading companies…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
          {companies.map(c => (
            <button
              key={c.companyId}
              onClick={() => setSelectedCompany(c)}
              className={`
                text-left rounded-xl border-2 px-4 py-3 transition-all
                ${selectedCompany?.companyId === c.companyId
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50'}
              `}
            >
              <p className="text-sm font-semibold text-gray-800">{c.companyName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.companyContact}</p>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
          ← Back
        </button>
        <button
          disabled={!selectedCompany}
          onClick={() => setStep(2)}
          className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-sm font-semibold transition"
        >
          Continue →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Select branch for <span className="font-semibold text-gray-700">{selectedCompany?.companyName}</span>.
      </p>
      {branchesLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading branches…
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {branches.map(b => (
            <button
              key={b.branchId}
              onClick={() => setSelectedBranch(b)}
              className={`
                text-left rounded-xl border-2 px-3 py-2.5 transition-all
                ${selectedBranch?.branchId === b.branchId
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50'}
              `}
            >
              <p className="text-xs font-semibold text-gray-800">{b.branchName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{b.branchContact}</p>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
          ← Back
        </button>
        <button
          disabled={!selectedBranch}
          onClick={() => setStep(3)}
          className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-sm font-semibold transition"
        >
          Continue →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Select a reason for this inquiry.</p>
      {reasonsLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading reasons…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
          {reasons.map(r => (
            <button
              key={r.resonId}
              onClick={() => setSelectedReason(r)}
              className={`
                text-left rounded-xl border-2 px-4 py-2.5 transition-all text-sm
                ${selectedReason?.resonId === r.resonId
                  ? 'border-teal-500 bg-teal-50 font-semibold text-teal-800'
                  : 'border-gray-200 hover:border-teal-200 text-gray-700'}
              `}
            >
              {r.reson}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Remark <span className="text-gray-300">(optional)</span>
        </label>
        <textarea
          value={remark}
          onChange={e => setRemark(e.target.value)}
          rows={2}
          placeholder="Add any additional notes…"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none transition"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
          ← Back
        </button>
        <button
          disabled={!selectedReason}
          onClick={() => setStep(4)}
          className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-sm font-semibold transition"
        >
          Review →
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Review and confirm the inquiry details.</p>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order</p>
        <InfoRow label="Tracking"    value={order?.orderCode} />
        <InfoRow label="Customer"    value={order?.customerName} />
        <InfoRow label="Phone 1"     value={order?.phoneOne} />
        <InfoRow label="Phone 2"     value={order?.phoneTwo} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Courier</p>
        <InfoRow label="Company"       value={selectedCompany?.companyName} />
        <InfoRow label="Branch"        value={selectedBranch?.branchName} />
        <InfoRow label="Branch Contact" value={selectedBranch?.branchContact} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Inquiry</p>
        <InfoRow label="Reason" value={selectedReason?.reson} />
        <InfoRow label="Remark" value={remark || '—'} />
      </div>

      {saveError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {saveError}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setStep(3)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
          ← Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Saving…
            </>
          ) : '✓ Save Inquiry'}
        </button>
      </div>
    </div>
  );

  const panelContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4][step]?.();

  // ── Modal shell ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Inquiry</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {steps.length}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <StepDot index={i} current={step} label={label} />
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded transition-all duration-500 ${i < step ? 'bg-teal-400' : 'bg-gray-150'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {panelContent}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}