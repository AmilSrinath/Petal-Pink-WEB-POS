import React, { useState, useEffect, useCallback } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';

const PAYMENT_TYPE_MAP: Record<number, string> = {
  1: 'Cash',
  2: 'Card',
  3: 'Bank Transfer',
};

// Cycle through these badge colours for however many statuses the API returns
const BADGE_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-red-100 text-red-800',
];

interface PaymentStatusType {
  statusId: number;
  statusType: string;
  regId: number;
  status: number;
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

  // Fetch payment status types once on mount
  useEffect(() => {
    fetch('http://localhost:8080/api/status/types/2')
      .then((res) => {
        if (!res.ok) throw new Error(`Status API error: ${res.status}`);
        return res.json() as Promise<PaymentStatusType[]>;
      })
      .then(setPaymentStatuses)
      .catch((err) => console.error('Failed to load payment statuses:', err));
  }, []);

  // Build a lookup map: statusId → { label, className }
  const statusMap = React.useMemo(() => {
    const map: Record<number, { label: string; className: string }> = {};
    paymentStatuses.forEach((s) => {
      map[s.statusId] = {
        label: s.statusType,
        className: s.statusType.toLowerCase().includes("not paid") ? "bg-red-100 text-red-800" : s.statusType.toLowerCase().includes("paid") ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
      };
    });
    return map;
  }, [paymentStatuses]);

  const updatePaymentStatus = async (orderId: number, statusId: number) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/payment-report/status-by-order?orderId=${orderId}&statusId=${statusId}`,
        {
          method: "PUT",
        }
      );

      if (!res.ok) throw new Error("Failed to update status");

      // Refresh table
      fetchPayments(filters.from, filters.to);
    } catch (err) {
      alert("Error updating payment status");
    }
  };

  // Options for the Payment Status combobox — dynamically built from API
  const statusOptions = paymentStatuses.map((s) => ({
    label: s.statusType,
    value: String(s.statusId),
  }));

  const fetchPayments = useCallback(async (from: string, to: string) => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:8080/api/payment-report?from=${from}&to=${to}`
      );
      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
      const data: PaymentRecord[] = await res.json();
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPayments(filters.from, filters.to);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply client-side filters
  const filtered = payments.filter((p) => {
    if (
      filters.orderCode &&
      !p.orderCode.toLowerCase().includes(filters.orderCode.toLowerCase())
    )
      return false;

    if (filters.paymentType && String(p.paymentTypeId) !== filters.paymentType)
      return false;

    // Match against statusId (the field returned in the payment report)
    if (filters.paymentStatus && String(p.statusId) !== filters.paymentStatus)
      return false;

    return true;
  });

  const columns: Column<PaymentRecord>[] = [
    {
      header: 'Order Code',
      accessor: 'orderCode',
      className: 'font-medium text-teal-600',
    },
    {
      header: 'Customer No.',
      accessor: (row) => row.customerNumber.trim(),
    },
    {
      header: 'COD',
      accessor: (row) => `${row.cod.toFixed(2)}`,
    },
    {
      header: 'Sub Total',
      accessor: (row) => `${row.subTotalPrice.toFixed(2)}`,
    },
    {
      header: 'Delivery Fee',
      accessor: (row) => `${row.deliveryFee.toFixed(2)}`,
    },
    {
      header: 'Total Amount',
      accessor: (row) => `${row.totalOrderPrice.toFixed(2)}`,
      className: 'font-semibold',
    },
    {
      header: 'Payment Type',
      accessor: (row) =>
        PAYMENT_TYPE_MAP[row.paymentTypeId] ?? `Type ${row.paymentTypeId}`,
    },
    {
      header: 'Payment Status',
      accessor: (row) => {
        const s = statusMap[row.statusId] ?? {
          label: `Status ${row.statusId}`,
          className: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${s.className}`}
          >
            {s.label}
          </span>
        );
      },
    },
    {
      header: 'Date',
      accessor: (row) => row.createdDate.split('T')[0],
    },
    {
      header: "Action",
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
            onChange: (v) => setFilters((f) => ({ ...f, orderCode: v })),
          },
          {
            type: 'date',
            label: 'From',
            value: filters.from,
            onChange: (v) => setFilters((f) => ({ ...f, from: v })),
          },
          {
            type: 'date',
            label: 'To',
            value: filters.to,
            onChange: (v) => setFilters((f) => ({ ...f, to: v })),
          },
          {
            type: 'select',
            label: 'Profile',
            value: filters.profile,
            onChange: (v) => setFilters((f) => ({ ...f, profile: v })),
            options: [
              { label: 'AmilGrainCo', value: 'amil' },
              { label: 'BeautyCare', value: 'beauty' },
            ],
          },
          {
            type: 'select',
            label: 'Payment Type',
            value: filters.paymentType,
            onChange: (v) => setFilters((f) => ({ ...f, paymentType: v })),
            options: [
              { label: 'Cash', value: '1' },
              { label: 'Card', value: '2' },
              { label: 'Bank Transfer', value: '3' },
            ],
          },
          {
            type: 'select',
            label: 'Payment Status',
            value: filters.paymentStatus,
            onChange: (v) => setFilters((f) => ({ ...f, paymentStatus: v })),
            options: statusOptions, // ← dynamically populated from API
          },
        ]}
        totalCount={filtered.length}
        onSearch={() => fetchPayments(filters.from, filters.to)}
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