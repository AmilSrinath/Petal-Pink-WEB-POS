import React, { useState, useEffect, useRef } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { api } from './Integratedpages';
import { API_BASE_URL } from '../../config';
import { PurchaseOrderPrintView, PurchaseOrderPrintData, exportPoToPdf } from '../../components/PurchaseOrderPrintView';
import { Download, Printer, X, FileText } from 'lucide-react';

export function PurchaseOrderListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // PDF / View modal state
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderPrintData | null>(null);
  const [, setLoadingDetails] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const listPrintRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([
      api.getPurchaseOrders(),
      api.getSuppliers().catch(() => []),
    ])
      .then(([ordersData, suppliersData]) => {
        setOrders(ordersData || []);
        setSuppliers(suppliersData || []);
      })
      .catch(() => setError('Failed to load purchase orders'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: number) => {
    const colors: Record<number, string> = {
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-green-100 text-green-800',
      0: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: number) => {
    const labels: Record<number, string> = { 0: 'Cancelled', 1: 'Pending', 2: 'Confirmed', 3: 'Delivered' };
    return labels[status] || 'Unknown';
  };

  const handleOpenPdfModal = async (row: any) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/purchase-order-details/by-po/${row.poId}`);
      const details = await res.json();

      const supplier = suppliers.find((s) => s.supplierId === row.supplierId);
      const poNum = row.poCodePrefix ? `${row.poCodePrefix}-${row.poCode}` : `PO-${row.poId}`;

      const printData: PurchaseOrderPrintData = {
        poNumber: poNum,
        poDate: row.poDate || '',
        expectedDate: row.expectedDate || '',
        supplierName: row.supplierName || supplier?.companyName || 'Supplier',
        supplierPhone: supplier?.contactNumber || supplier?.telephoneNumber || supplier?.mobileNumber,
        supplierEmail: supplier?.email,
        supplierAddress: supplier?.address,
        salesmanName: supplier?.salesmanName,
        paymentType: row.paymentType === 1 ? 'Cash' : row.paymentType === 2 ? 'Credit' : 'Other',
        statusLabel: getStatusLabel(row.status),
        totalPrice: row.totalPrice || 0,
        items: Array.isArray(details)
          ? details.map((d: any) => ({
              itemName: d.itemName || 'Item',
              unitType: d.unitType || 'Unit',
              qty: d.qty || 0,
              expectedPrice: d.expectedPrice || 0,
              lastGrnPrice: d.lastGrnPrice || 0,
              totalPrice: d.totalPrice || 0,
            }))
          : [],
      };

      setSelectedPo(printData);
    } catch (err) {
      console.error('Failed to load PO details for PDF:', err);
      alert('Failed to load purchase order details. Please try again.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!listPrintRef.current || !selectedPo) return;
    setIsExportingPdf(true);
    try {
      await exportPoToPdf(listPrintRef.current, `Purchase_Order_${selectedPo.poNumber}`);
    } catch (err) {
      console.error('Failed to export PO PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const columns: Column<any>[] = [
    { header: 'PO Code', accessor: (row) => row.poCodePrefix ? `${row.poCodePrefix}-${row.poCode}` : `PO-${row.poId}` },
    { header: 'Supplier', accessor: 'supplierName' },
    { header: 'Order Date', accessor: 'poDate' },
    { header: 'Expected Delivery', accessor: 'expectedDate' },
    { header: 'Total', accessor: (row) => `Rs. ${row.totalPrice?.toFixed(2) ?? '0.00'}` },
    { header: 'Payment Type', accessor: (row) => row.paymentType === 1 ? 'Cash' : row.paymentType === 2 ? 'Credit' : '-' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(row.status)}`}>
        {getStatusLabel(row.status)}
      </span>
    )},
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          type="button"
          onClick={() => handleOpenPdfModal(row)}
          className="inline-flex items-center gap-1 rounded bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          View / PDF
        </button>
      ),
    },
  ];

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500">Loading purchase orders...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
        <DataTable columns={columns} data={orders} />
      </div>

      {/* PDF View Modal */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl flex flex-col max-h-[95vh] w-full max-w-4xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="bg-teal-100 text-teal-800 p-2 rounded-lg">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Purchase Order: {selectedPo.poNumber}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Supplier: {selectedPo.supplierName} | Date: {selectedPo.poDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isExportingPdf ? 'Exporting...' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPo(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Printable Preview */}
            <div className="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center">
              <PurchaseOrderPrintView ref={listPrintRef} order={selectedPo} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}