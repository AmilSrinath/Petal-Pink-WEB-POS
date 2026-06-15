import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { API_BASE_URL } from '../config';

interface BusinessProfile {
  bussinessProfileId: number;
  bussinessProfileName: string;
}

interface PaymentStatusType {
  statusId: number;
  statusType: string;
  regId: number;
  status: number;
}

interface PaymentType {
  paymentTypeId: number;
  paymentType: string;
  status: number;
  userId: number;
  visible: number;
}

interface PaymentRecord {
  paymentId: number;
  cod: number;
  totalAmount: number;
  paymentStatus: number;
  orderId: number;
  customerId: number;
  deliveryOrderId: number;
  billNo: string;
  subTotalPrice: number;
  deliveryFee: number;
  totalOrderPrice: number;
  paymentTypeId: number;
  createdDate: string;
  remark: string;
  isPrint: number;
  statusId: number;
  orderCode: string;
  deliveryStatusId: number;
  customerNumber: string;
}

interface Filters {
  orderCode: string;
  from: string;
  to: string;
  profile: string;
  paymentType: string;
  paymentStatus: string;
}

export function PaymentPage() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatusType[]>([]);
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    orderCode: '',
    from: todayStr,
    to: todayStr,
    profile: '',
    paymentType: '',
    paymentStatus: '',
  });

  // Keep a ref that always holds the latest orderCode so onKeyDown
  // never reads a stale closure value — this is what caused the double-Enter bug.
  const orderCodeRef = useRef('');

  // Guard: prevents a second search firing while one is already running
  const isSearchingRef = useRef(false);

  // Fetch payment status types once on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/status/types/2`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status API error: ${res.status}`);
        return res.json() as Promise<PaymentStatusType[]>;
      })
      .then(setPaymentStatuses)
      .catch((err) => console.error('Failed to load payment statuses:', err));
  }, []);

  // Fetch business profiles once on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config/business-profiles`)
      .then((res) => {
        if (!res.ok) throw new Error(`Profile API error: ${res.status}`);
        return res.json() as Promise<BusinessProfile[]>;
      })
      .then(setBusinessProfiles)
      .catch((err) => console.error('Failed to load business profiles:', err));
  }, []);

  // Fetch payment types once on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/payment-types`)
      .then((res) => {
        if (!res.ok) throw new Error(`Payment types API error: ${res.status}`);
        return res.json() as Promise<PaymentType[]>;
      })
      .then(setPaymentTypes)
      .catch((err) => console.error('Failed to load payment types:', err));
  }, []);

  // Build a lookup map: statusId → { label, className }
  const statusMap = React.useMemo(() => {
    const map: Record<number, { label: string; className: string }> = {};
    paymentStatuses.forEach((s) => {
      map[s.statusId] = {
        label: s.statusType,
        className: s.statusType.toLowerCase().includes('not paid')
          ? 'bg-red-100 text-red-800'
          : s.statusType.toLowerCase().includes('paid')
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800',
      };
    });
    return map;
  }, [paymentStatuses]);

  // Build a lookup map: paymentTypeId → label
  const paymentTypeMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    paymentTypes.forEach((t) => {
      map[t.paymentTypeId] = t.paymentType;
    });
    return map;
  }, [paymentTypes]);

  // Fetch by date range
  const fetchPaymentsByDate = useCallback(async (from: string, to: string) => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payment-report?from=${from}&to=${to}`
      );
      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
      const data: PaymentRecord[] = await res.json();
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  }, []);

  // Fetch wide range then filter client-side by order code
  const fetchPaymentsByOrderCode = useCallback(async (orderCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const wideFrom = '2020-01-01';
      const wideTo = new Date().toISOString().split('T')[0];
      const res = await fetch(
        `${API_BASE_URL}/api/payment-report?from=${wideFrom}&to=${wideTo}`
      );
      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
      const data: PaymentRecord[] = await res.json();
      const matched = data.filter((p) =>
        p.orderCode?.toLowerCase().includes(orderCode.toLowerCase())
      );
      setPayments(matched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  }, []);

  // Unified search — reads orderCode from ref so it's always fresh
  const handleSearch = useCallback(
    (overrideFilters?: Filters) => {
      // Block duplicate calls while a search is already in-flight
      if (isSearchingRef.current) return;
      isSearchingRef.current = true;

      const activeFilters = overrideFilters ?? { ...filters, orderCode: orderCodeRef.current };
      const code = activeFilters.orderCode.trim();

      if (code) {
        fetchPaymentsByOrderCode(code);
      } else {
        fetchPaymentsByDate(activeFilters.from, activeFilters.to);
      }
    },
    [filters, fetchPaymentsByDate, fetchPaymentsByOrderCode]
  );

  const updatePaymentStatus = async (orderId: number, statusId: number) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payment-report/status-by-order?orderId=${orderId}&statusId=${statusId}`,
        { method: 'PUT' }
      );
      if (!res.ok) throw new Error('Failed to update status');
      handleSearch();
    } catch (err) {
      alert('Error updating payment status');
    }
  };

  // Options for dropdowns
  const statusOptions = paymentStatuses.map((s) => ({
    label: s.statusType,
    value: String(s.statusId),
  }));

  const profileOptions = businessProfiles.map((p) => ({
    label: p.bussinessProfileName,
    value: String(p.bussinessProfileId),
  }));

  const paymentTypeOptions = paymentTypes.map((t) => ({
    label: t.paymentType,
    value: String(t.paymentTypeId),
  }));

  // Initial load
  useEffect(() => {
    fetchPaymentsByDate(filters.from, filters.to);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply remaining client-side filters (paymentType, paymentStatus)
  const filtered = payments.filter((p) => {
    if (filters.paymentType && String(p.paymentTypeId) !== filters.paymentType)
      return false;
    if (filters.paymentStatus && String(p.statusId) !== filters.paymentStatus)
      return false;
    return true;
  });

  const paidCount = filtered.filter(
    (p) =>
      statusMap[p.statusId]?.label.toLowerCase().includes('not paid') === false &&
      statusMap[p.statusId]?.label.toLowerCase().includes('paid')
  ).length;

  const notPaidCount = filtered.filter((p) =>
    statusMap[p.statusId]?.label.toLowerCase().includes('not paid')
  ).length;

  const columns: Column<PaymentRecord>[] = [
    {
      header: 'Order Code',
      accessor: 'orderCode',
      className: 'font-medium text-teal-600',
    },
    {
      header: 'Customer No.',
      accessor: (row) => row.customerNumber?.trim() ?? '—',
    },
    {
      header: 'COD',
      accessor: (row) => row.cod != null ? row.cod.toFixed(2) : '—',
    },
    {
      header: 'Sub Total',
      accessor: (row) => row.subTotalPrice != null ? row.subTotalPrice.toFixed(2) : '—',
    },
    {
      header: 'Delivery Fee',
      accessor: (row) => row.deliveryFee != null ? row.deliveryFee.toFixed(2) : '—',
    },
    {
      header: 'Total Amount',
      accessor: (row) => row.totalOrderPrice != null ? row.totalOrderPrice.toFixed(2) : '—',
      className: 'font-semibold',
    },
    {
      header: 'Current Status',
      accessor: (row) => {
        const status = statusMap[row.statusId];
        if (!status) return <span className="text-gray-400 text-xs">—</span>;
        const isNotPaid = status.label.toLowerCase().includes('not paid');
        const isPaid = !isNotPaid && status.label.toLowerCase().includes('paid');
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isNotPaid
              ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
              : isPaid
              ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
              : 'bg-gray-100 text-gray-600 ring-1 ring-gray-300'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              isNotPaid ? 'bg-red-500' : isPaid ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {status.label}
          </span>
        );
      },
    },
    {
      header: 'Date',
      accessor: (row) => row.createdDate?.split('T')[0] ?? '—',
    },
    {
      header: 'Action',
      accessor: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => updatePaymentStatus(row.orderId, 8)}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded"
          >
            Paid
          </button>
          <button
            onClick={() => updatePaymentStatus(row.orderId, 9)}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded"
          >
            Not Paid
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payment Tracking</h1>
      </div>

      <FilterBar
        filters={[
          {
            type: 'text',
            label: 'Order Code',
            value: filters.orderCode,
            placeholder: 'Type & press Enter…',
            onChange: (v) => {
              orderCodeRef.current = v;
              setFilters((f) => ({ ...f, orderCode: v }));
            },
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                // Use the ref value — always current, never stale
                handleSearch({ ...filters, orderCode: orderCodeRef.current });
              }
            },
          },
          {
            type: 'date',
            label: 'From',
            value: filters.from,
            disabled: !!filters.orderCode.trim(),
            onChange: (v) => setFilters((f) => ({ ...f, from: v })),
          },
          {
            type: 'date',
            label: 'To',
            value: filters.to,
            disabled: !!filters.orderCode.trim(),
            onChange: (v) => setFilters((f) => ({ ...f, to: v })),
          },
          {
            type: 'select',
            label: 'Profile',
            value: filters.profile,
            onChange: (v) => setFilters((f) => ({ ...f, profile: v })),
            options: profileOptions,
          },
          {
            type: 'select',
            label: 'Payment Type',
            value: filters.paymentType,
            onChange: (v) => setFilters((f) => ({ ...f, paymentType: v })),
            options: paymentTypeOptions,
          },
          {
            type: 'select',
            label: 'Payment Status',
            value: filters.paymentStatus,
            onChange: (v) => setFilters((f) => ({ ...f, paymentStatus: v })),
            options: statusOptions,
          },
        ]}
        totalCount={filtered.length}
        counts={[
          { label: 'Paid', value: paidCount, className: 'text-green-700' },
          { label: 'Not Paid', value: notPaidCount, className: 'text-red-600' },
        ]}
        onSearch={() => handleSearch()}
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-gray-500">
          Loading payments…
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-lg border border-gray-200">
          <DataTable columns={columns} data={filtered} />
        </div>
      )}
    </div>
  );
}