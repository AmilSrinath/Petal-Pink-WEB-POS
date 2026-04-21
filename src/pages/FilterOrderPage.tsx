import React, { useEffect, useState, useMemo } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { PrinterIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Order {
  orderId: number;
  customerId: number;
  billNo: string;
  subTotalPrice: number;
  totalDiscountPrice: number | null;
  deliveryFee: number;
  totalOrderPrice: number;
  paymentTypeId: number;
  createdDate: string;
  statusId: number;
  paidAmount: number;
  customerName: string;
  address: string;
  phoneOne: string;
  phoneTwo: string;
  customerNumber: string;
  remark: string;
  orderType: string | null;
  deliveryId?: number;
  weight?: string | null;
}

interface PaymentType {
  paymentTypeId: number;
  paymentType: string;
}

interface StatusType {
  statusId: number;
  statusType: string;
}

interface OrderType {
  id: number;
  type: string;
}

interface FilterValues {
  orderCode: string;
  customerCode: string;
  from: string;
  to: string;
  paymentType: string;
  status: string;
  orderType: string;
}

type ToastType = 'success' | 'error' | 'loading';

interface Toast {
  type: ToastType;
  message: string;
}

export function FilterOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const [paymentTypes, setPaymentTypes] = useState<{ label: string; value: string }[]>([]);
  const [statusTypes, setStatusTypes] = useState<{ label: string; value: string }[]>([]);
  const [orderTypes, setOrderTypes] = useState<{ label: string; value: string }[]>([]);

  const [paymentTypeMap, setPaymentTypeMap] = useState<Record<number, string>>({});
  const [statusTypeMap, setStatusTypeMap] = useState<Record<number, string>>({});

  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState<FilterValues>({
    orderCode: '',
    customerCode: '',
    from: today,
    to: today,
    paymentType: '',
    status: '',
    orderType: '',
  });

  const showToast = (type: ToastType, message: string, duration = 4000) => {
    setToast({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setToast(null), duration);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordersRes, paymentRes, statusRes, orderTypeRes] = await Promise.all([
          fetch('http://localhost:8080/api/sales/get-all-orders'),
          fetch('http://localhost:8080/api/payment-types'),
          fetch('http://localhost:8080/api/status/types/1'),
          fetch('http://localhost:8080/api/order-types'),
        ]);

        const ordersData: Order[] = await ordersRes.json();
        const paymentData: PaymentType[] = await paymentRes.json();
        const statusData: StatusType[] = await statusRes.json();
        const orderTypeData: OrderType[] = await orderTypeRes.json();

        setOrders(ordersData);

        const pMap: Record<number, string> = {};
        paymentData.forEach((p) => { pMap[p.paymentTypeId] = p.paymentType; });
        setPaymentTypeMap(pMap);

        const sMap: Record<number, string> = {};
        statusData.forEach((s) => { sMap[s.statusId] = s.statusType; });
        setStatusTypeMap(sMap);

        setPaymentTypes(paymentData.map((p) => ({ label: p.paymentType, value: String(p.paymentTypeId) })));
        setStatusTypes(statusData.map((s) => ({ label: s.statusType, value: String(s.statusId) })));
        setOrderTypes(orderTypeData.map((o) => ({ label: o.type, value: String(o.type) })));

      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdDate);

      if (filters.orderCode && !order.billNo?.toLowerCase().includes(filters.orderCode.toLowerCase())) return false;
      if (filters.customerCode && !order.customerNumber?.toLowerCase().includes(filters.customerCode.toLowerCase())) return false;
      if (filters.from && orderDate < new Date(filters.from)) return false;
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) return false;
      }
      if (filters.paymentType && String(order.paymentTypeId) !== filters.paymentType) return false;
      if (filters.status && String(order.statusId) !== filters.status) return false;
      if (filters.orderType) {
        if (!order.orderType || order.orderType.toLowerCase() !== filters.orderType.toLowerCase()) return false;
      }

      return true;
    });
  }, [orders, filters]);

  // ─── Wrapping orders = statusId 3 (Wrapping) ───────────────────────────────
  const wrappingOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.statusId === 3);
  }, [filteredOrders]);

  // ─── Export to XLSX using File System Access API ────────────────────────────
  const handlePrintWrapping = async () => {
    if (wrappingOrders.length === 0) {
      showToast('error', 'No Wrapping orders found in the current filter.');
      return;
    }

    setPrinting(true);
    showToast('loading', 'Preparing Excel file...');

    try {
      // 1. Build worksheet data matching the template columns
      const wsData = [
        [
          'TrackingNumber', 'Reference', 'PackageDescription',
          'ReceiverName', 'ReceiverAddress', 'ReceiverCity',
          'ReceiverContactNo', 'NoOfPcs', 'Kilo', 'Gram',
          'Amount', 'Exchange', 'Remark',
        ],
        ...wrappingOrders.map((o) => {
          // weight is stored as total grams (e.g. "1500.00" = 1kg 500g)
          const totalGrams = parseFloat(o.weight ?? '0') || 0;
          const kilo = Math.floor(totalGrams / 1000);
          const gram = Math.round(totalGrams % 1000);
          return [
            o.billNo ?? '',
            o.orderId ?? '',
            '0',                     // PackageDescription
            o.customerName ?? '',
            o.address ?? '',
            '0',                     // ReceiverCity
            `${o.phoneOne ?? ''}${o.phoneTwo ? ` / ${o.phoneTwo}` : ' /'}`,
            1,                      // NoOfPcs
            kilo,                   // Kilo  (e.g. 1 for 1500g)
            gram,                   // Gram  (e.g. 500 for 1500g)
            o.totalOrderPrice ?? 0,
            '0',                     // Exchange
            '0',
          ];
        }),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Column widths
      ws['!cols'] = [
        { wch: 18 }, { wch: 12 }, { wch: 20 },
        { wch: 22 }, { wch: 30 }, { wch: 16 },
        { wch: 16 }, { wch: 8 },  { wch: 8 },  { wch: 8 },
        { wch: 12 }, { wch: 10 }, { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Wrapping Orders');

      // 2. Ask user for save location via File System Access API
      let fileHandle: FileSystemFileHandle | null = null;
      try {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: `wrapping_orders_${today}.xlsx`,
          types: [
            {
              description: 'Excel Spreadsheet',
              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
            },
          ],
        });
      } catch (err: any) {
        // User cancelled the picker
        if (err?.name === 'AbortError') {
          setPrinting(false);
          setToast(null);
          return;
        }
        throw err;
      }

      // 3. Write the file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const writable = await fileHandle.createWritable();
      await writable.write(new Blob([wbout], { type: 'application/octet-stream' }));
      await writable.close();

      showToast('loading', `Saved! Updating ${wrappingOrders.length} orders to Despatch...`);

      // 4. Update all wrapping orders to statusId = 4 (Despatch)
      const results = await Promise.allSettled(
        wrappingOrders.map((o) => {
          const id = o.deliveryId ?? o.orderId;
          return fetch(`http://localhost:8080/api/sales/${id}/status?statusId=4`, {
            method: 'PATCH',
          });
        })
      );

      const failed = results.filter((r) => r.status === 'rejected').length;

      // 5. Refresh orders list
      const refreshed = await fetch('http://localhost:8080/api/sales/get-all-orders');
      const refreshedData: Order[] = await refreshed.json();
      setOrders(refreshedData);

      if (failed === 0) {
        showToast('success', `✓ Excel saved & ${wrappingOrders.length} orders moved to Despatch.`);
      } else {
        showToast('error', `Excel saved, but ${failed} status update(s) failed. Please retry.`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Something went wrong. Check console for details.');
    } finally {
      setPrinting(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      header: 'Order Code',
      accessor: (row) => row.billNo || '-',
      className: 'font-medium text-teal-600',
    },
    {
      header: 'Customer',
      accessor: 'customerName',
    },
    {
      header: 'Cust. No',
      accessor: 'customerNumber',
    },
    {
      header: 'Phone One',
      accessor: 'phoneOne',
    },
    {
      header: 'Phone Two',
      accessor: 'phoneTwo',
    },
    {
      header: 'Address',
      accessor: 'address',
      className: 'max-w-[150px] truncate',
    },
    {
      header: 'Payment',
      accessor: (row) => paymentTypeMap[row.paymentTypeId] ?? '-',
    },
    {
      header: 'Delivery Fee',
      accessor: (row) => `${(row.deliveryFee ?? 0).toFixed(2)}`,
    },
    {
      header: 'Total',
      accessor: (row) => `${(row.totalOrderPrice ?? 0).toFixed(2)}`,
      className: 'font-semibold',
    },
    {
      header: 'Status',
      accessor: (row) => {
        const statusStyles: Record<number, { bg: string; fg: string }> = {
          1:  { bg: 'rgb(145,200,228)', fg: 'rgb(92,136,196)'  },  // Active    - blue
          2:  { bg: 'rgba(206, 206, 206, 1)', fg: 'rgba(100, 100, 100, 1)'   },  // Pending   - yellow
          3:  { bg: 'rgb(255,255,102)', fg: 'rgb(128,128,0)'   },  // Wrapping  - yellow
          4:  { bg: 'rgb(230,204,255)', fg: 'rgb(102,0,153)'   },  // Despatch  - purple
          5:  { bg: 'rgb(198,239,206)', fg: 'rgb(0,97,0)'      },  // Delivered - green
          6:  { bg: 'rgb(255,178,102)', fg: 'rgb(207,83,0)'    },  // Return    - orange
          7:  { bg: 'rgb(255,204,204)', fg: 'rgb(178,34,34)'   },  // Cancel    - red
          12: { bg: 'rgb(255,180,180)', fg: 'rgb(255,68,52)'   },  // Returning - light orange
          13: { bg: 'rgb(152,161,188)', fg: 'rgb(85,88,121)'   },  // Checking  - gray
        };
        const label = statusTypeMap[row.statusId] ?? '-';
        const style = statusStyles[row.statusId] ?? { bg: '#fff', fg: '#000' };
        return (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: style.bg, color: style.fg }}
          >
            {label}
          </span>
        );
      },
    },
    {
      header: 'Date',
      accessor: (row) => new Date(row.createdDate).toLocaleDateString(),
    },
    {
      header: 'Order Type',
      accessor: (row) => row.orderType ?? '-',
    },
  ];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col relative">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl text-sm font-medium transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-gray-900 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
          {toast.type === 'error' && <XCircle className="h-4 w-4 shrink-0" />}
          {toast.type === 'loading' && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
          {toast.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Advanced Order Filter</h1>

        {/* Wrapping badge */}
        {wrappingOrders.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            {wrappingOrders.length} Wrapping order{wrappingOrders.length > 1 ? 's' : ''} ready
          </span>
        )}
      </div>

      <FilterBar
        filters={[
          { type: 'text', label: 'Order Code', value: filters.orderCode, onChange: (v) => setFilters((f) => ({ ...f, orderCode: v })) },
          { type: 'text', label: 'Customer Code', value: filters.customerCode, onChange: (v) => setFilters((f) => ({ ...f, customerCode: v })) },
          { type: 'date', label: 'From', value: filters.from, onChange: (v) => setFilters((f) => ({ ...f, from: v })) },
          { type: 'date', label: 'To', value: filters.to, onChange: (v) => setFilters((f) => ({ ...f, to: v })) },
          {
            type: 'select',
            label: 'Payment Type',
            options: paymentTypes,
            value: filters.paymentType,
            onChange: (v) => setFilters((f) => ({ ...f, paymentType: v })),
          },
          {
            type: 'select',
            label: 'Status',
            options: statusTypes,
            value: filters.status,
            onChange: (v) => setFilters((f) => ({ ...f, status: v })),
          },
          {
            type: 'select',
            label: 'Order Type',
            options: orderTypes,
            value: filters.orderType,
            onChange: (v) => setFilters((f) => ({ ...f, orderType: v })),
          },
        ]}
        totalCount={filteredOrders.length}
      />

      <div className="flex-1 overflow-auto mb-16">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <svg className="mr-3 h-5 w-5 animate-spin text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading orders...
          </div>
        ) : (
          <DataTable columns={columns} data={filteredOrders} />
        )}
      </div>

      {/* Print Wrapping button */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={handlePrintWrapping}
          disabled={printing || wrappingOrders.length === 0}
          className="flex items-center rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {printing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <PrinterIcon className="mr-2 h-5 w-5" />
          )}
          {printing ? 'Processing...' : `Print Wrapping${wrappingOrders.length > 0 ? ` (${wrappingOrders.length})` : ''}`}
        </button>
      </div>
    </div>
  );
}