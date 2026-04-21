import React, { useEffect, useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';

interface Inquiry {
  inquiryId: number;
  wayBill: string;
  customerNumber: string;
  customerName: string;
  customerPhoneOne: string;
  customerPhoneTwo: string;
  company: string;
  branch: string;
  branchContact: string;
  createdDate: string;
  reason: string;
  remark: string;
  status: number;
  statusId: number;
}

const STATUS_MAP: Record<number, { label: string; className: string; btnClass: string }> = {
  10: { label: 'Delivered',     className: 'bg-green-100 text-green-800',  btnClass: 'bg-green-500 hover:bg-green-600 text-white' },
  11: { label: 'Not Delivered', className: 'bg-red-100 text-red-800',     btnClass: 'bg-red-500 hover:bg-red-600 text-white' },
  14: { label: 'Returned',      className: 'bg-yellow-100 text-yellow-800', btnClass: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  15: { label: 'Cancelled',     className: 'bg-gray-100 text-gray-800',   btnClass: 'bg-gray-500 hover:bg-gray-600 text-white' },
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB');
}

// ─── Status Change Modal ───────────────────────────────────────────────────────
interface StatusModalProps {
  inquiry: Inquiry;
  onClose: () => void;
  onStatusChanged: (inquiryId: number, newStatusId: number) => void;
}

function StatusModal({ inquiry, onClose, onStatusChanged }: StatusModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleSelect = async (statusId: number) => {
    if (statusId === inquiry.statusId) { onClose(); return; }

    try {
      setSaving(true);
      setError(null);
      const res = await fetch(
        `http://localhost:8080/api/inquiry/inquiries/${inquiry.inquiryId}/status?statusId=${statusId}`,
        { method: 'PUT' }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      onStatusChanged(inquiry.inquiryId, statusId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-1">Change Status</h2>
        <p className="text-sm text-gray-500 mb-5">
          Way Bill: <span className="font-medium text-teal-600">{inquiry.wayBill}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(STATUS_MAP).map(([id, { label, btnClass }]) => {
            const statusId = Number(id);
            const isCurrent = statusId === inquiry.statusId;
            return (
              <button
                key={id}
                disabled={saving}
                onClick={() => handleSelect(statusId)}
                className={`
                  relative rounded-xl px-4 py-3 text-sm font-semibold transition-all
                  ${btnClass}
                  ${isCurrent ? 'ring-4 ring-offset-2 ring-black/20 scale-95' : 'opacity-90 hover:opacity-100 hover:scale-105'}
                  ${saving ? 'cursor-not-allowed opacity-60' : ''}
                `}
              >
                {label}
                {isCurrent && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    current
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        {saving && (
          <p className="mt-3 text-center text-xs text-gray-400 animate-pulse">Saving…</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function InquiryPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [wayBill,      setWayBill]      = useState('');
  const [startDate,    setStartDate]    = useState(today);
  const [endDate,      setEndDate]      = useState(today);
  const [statusFilter, setStatusFilter] = useState('');

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesWayBill =
      wayBill.trim() === '' ||
      inq.wayBill.toLowerCase().includes(wayBill.trim().toLowerCase());
    const matchesStatus =
      statusFilter === '' || String(inq.statusId) === statusFilter;
    return matchesWayBill && matchesStatus;
  });

  useEffect(() => { fetchInquiries(); }, []); // eslint-disable-line

  const fetchInquiries = async () => {
    if (!startDate || !endDate) { setError('Please select both From and To dates.'); return; }
    if (endDate < startDate)    { setError('"To" date cannot be before "From" date.'); return; }

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`http://localhost:8080/api/inquiry/inquiries/by-date?${params}`);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      setInquiries(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Called by modal after a successful API update — update local state instantly
  const handleStatusChanged = (inquiryId: number, newStatusId: number) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.inquiryId === inquiryId ? { ...inq, statusId: newStatusId } : inq
      )
    );
  };

  const columns: Column<Inquiry>[] = [
    { header: 'Way Bill',         accessor: 'wayBill',         className: 'font-medium text-teal-600 whitespace-nowrap' },
    { header: 'Customer Code',    accessor: 'customerNumber',  className: 'whitespace-nowrap' },
    { header: 'Customer Name',    accessor: 'customerName',    className: 'whitespace-nowrap' },
    { header: 'Customer Phone 1', accessor: 'customerPhoneOne',className: 'whitespace-nowrap' },
    { header: 'Customer Phone 2', accessor: 'customerPhoneTwo',className: 'whitespace-nowrap' },
    { header: 'Branch',           accessor: 'branch',          className: 'whitespace-nowrap' },
    { header: 'Branch Contact',   accessor: 'branchContact',   className: 'whitespace-nowrap' },
    { header: 'Created Date',     accessor: (row) => formatDate(row.createdDate), className: 'whitespace-nowrap' },
    { header: 'Reason',           accessor: 'reason',          className: 'max-w-[150px] truncate' },
    { header: 'Remark',           accessor: 'remark',          className: 'max-w-[150px] truncate' },
    {
      header: 'Status',
      accessor: (row) => {
        const s = STATUS_MAP[row.statusId] ?? { label: `Status ${row.statusId}`, className: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${s.className}`}>
            {s.label}
          </span>
        );
      }
    },
  ];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">View Inquiry</h1>
        <p className="text-xs text-gray-400">Double-click a row to change its status</p>
      </div>

      <FilterBar
        filters={[
          { type: 'text',   label: 'Way Bill', placeholder: 'e.g. EC706310723', value: wayBill, onChange: setWayBill },
          { type: 'date',   label: 'From',     value: startDate,    onChange: setStartDate },
          { type: 'date',   label: 'To',       value: endDate,      onChange: setEndDate },
          {
            type: 'select', label: 'Status',   value: statusFilter, onChange: setStatusFilter,
            options: [
              { label: 'Delivered',     value: '10' },
              { label: 'Not Delivered', value: '11' },
              { label: 'Returned',      value: '14' },
              { label: 'Cancelled',     value: '15' },
            ]
          }
        ]}
        totalCount={filteredInquiries.length}
        totalLabel="Total Inquiries"
        onSearch={fetchInquiries}
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredInquiries}
          onRowDoubleClick={(row) => setSelectedInquiry(row)}
        />
      </div>

      {selectedInquiry && (
        <StatusModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusChanged={handleStatusChanged}
        />
      )}
    </div>
  );
}