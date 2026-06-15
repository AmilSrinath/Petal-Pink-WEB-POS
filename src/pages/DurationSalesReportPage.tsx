import React, { useState, useRef } from 'react';
import { Calendar, RefreshCw, Printer, Download } from 'lucide-react';
import { API_BASE_URL } from '../config'; 

interface DurationSalesReportData {
  allOrdersCount: number;
  activeOrdersCount: number;
  pendingOrdersCount: number;
  wrappingOrdersCount: number;
  despatchOrdersCount: number;
  deliveredOrdersCount: number;
  returnOrdersCount: number;
  cancelOrdersCount: number;
  returningOrdersCount: number;
  checkingOrdersCount: number;
  returnedOrdersCount: number;
  allOrdersPercent: number;
  activeOrdersPercent: number;
  pendingOrdersPercent: number;
  wrappingOrdersPercent: number;
  despatchOrdersPercent: number;
  deliveredOrdersPercent: number;
  returnOrdersPercent: number;
  cancelOrdersPercent: number;
  returningOrdersPercent: number;
  checkingOrdersPercent: number;
  returnedOrdersPercent: number;
  totalReportCash: number;
  totalReportCard: number;
  returnOrdersTotal: number;
  cancelOrdersTotal: number;
  totalDeliveryCharge: number;
  grandTotal: number;
}

export function DurationSalesReportPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [reportData, setReportData] = useState<DurationSalesReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchReport = async () => {
    if (!dateFrom || !dateTo) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      setError('Start date must be before end date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reports/duration-sales?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }

      const data = await response.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportRef.current.innerHTML);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  const handlePdfExport = async () => {
    if (!reportRef.current) return;

    try {
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;

      const element = reportRef.current;

      // Temporarily set a pixel-based width so html2canvas captures the full content
      // without cropping. 794px ≈ A4 width at 96 dpi.
      const originalStyle = element.getAttribute('style') || '';
      element.style.width = '794px';
      element.style.minHeight = 'auto';

      const options = {
        margin: [10, 10, 10, 10], // top, right, bottom, left in mm
        filename: `Duration_Sales_Report_${dateFrom}_to_${dateTo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: 794,        // match the element width above
          windowWidth: 794,  // prevents html2canvas from using the browser viewport width
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      };

      await html2pdf().set(options).from(element).save();

      // Restore original inline styles
      element.setAttribute('style', originalStyle);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Duration Sales Report</h1>

          {/* Date Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                End Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {reportData && (
            <div className="flex gap-2">
              {/* <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button> */}
              <button
                onClick={handlePdfExport}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export to PDF
              </button>
            </div>
          )}
        </div>

        {/* A4 Report Section */}
        {reportData && (
          <div
            ref={reportRef}
            className="bg-white rounded-lg shadow-md p-0 overflow-visible"
            style={{
              width: '210mm',
              minHeight: '297mm',
              margin: '0 auto',
              pageBreakAfter: 'always',
              boxSizing: 'border-box',
            }}
          >
            {/* A4 Report Content */}
            <div className="p-8" style={{ fontSize: '10pt', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
              {/* Header */}
              <div className="text-center mb-5 border-gray-800">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Duration Sales Report</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Period: {new Date(dateFrom).toLocaleDateString()} to{' '}
                  {new Date(dateTo).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">Generated on {new Date().toLocaleString()}</p>
              </div>

              {/* Summary Stats */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-teal-600 pb-2">
                  Order Summary
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="border border-gray-300 p-3 rounded">
                    <p className="text-xm text-gray-600 font-semibold">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.allOrdersCount}</p>
                    <p className="text-xs text-gray-500 mt-1">{reportData.allOrdersPercent.toFixed(2)}%</p>
                  </div>

                  <div className="border border-gray-300 p-3 rounded">
                    <p className="text-xm text-gray-600 font-semibold">Delivered</p>
                    <p className="text-2xl font-bold text-green-700">{reportData.deliveredOrdersCount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportData.deliveredOrdersPercent.toFixed(2)}%
                    </p>
                  </div>

                  <div className="border border-gray-300 p-3 rounded">
                    <p className="text-xm text-gray-600 font-semibold">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{reportData.pendingOrdersCount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportData.pendingOrdersPercent.toFixed(2)}%
                    </p>
                  </div>

                  <div className="border border-gray-300 p-3 rounded">
                    <p className="text-xm text-gray-600 font-semibold">Cancelled</p>
                    <p className="text-2xl font-bold text-red-600">{reportData.cancelOrdersCount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportData.cancelOrdersPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-teal-600 pb-2">
                  Order Status Breakdown
                </h3>
                <table className="w-full text-xm border-collapse" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="text-left px-3 py-2 font-bold text-gray-800">Status</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-800">Count</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-800">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 text-gray-700">Active</td>
                      <td className="text-right px-3 py-2 font-semibold">{reportData.activeOrdersCount}</td>
                      <td className="text-right px-3 py-2 text-gray-600">
                        {reportData.activeOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 text-gray-700">Wrapping</td>
                      <td className="text-right px-3 py-2 font-semibold">{reportData.wrappingOrdersCount}</td>
                      <td className="text-right px-3 py-2 text-gray-600">
                        {reportData.wrappingOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 text-gray-700">Despatch</td>
                      <td className="text-right px-3 py-2 font-semibold">{reportData.despatchOrdersCount}</td>
                      <td className="text-right px-3 py-2 text-gray-600">
                        {reportData.despatchOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 text-gray-700">Returning</td>
                      <td className="text-right px-3 py-2 font-semibold">{reportData.returningOrdersCount}</td>
                      <td className="text-right px-3 py-2 text-gray-600">
                        {reportData.returningOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 text-gray-700">Checking</td>
                      <td className="text-right px-3 py-2 font-semibold">{reportData.checkingOrdersCount}</td>
                      <td className="text-right px-3 py-2 text-gray-600">
                        {reportData.checkingOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-green-50">
                      <td className="px-3 py-2 text-gray-700 font-semibold">Delivered</td>
                      <td className="text-right px-3 py-2 font-bold text-green-700">
                        {reportData.deliveredOrdersCount}
                      </td>
                      <td className="text-right px-3 py-2 font-bold text-green-700">
                        {reportData.deliveredOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 text-gray-700">Return</td>
                      <td className="text-right px-3 py-2 font-semibold">{reportData.returnOrdersCount}</td>
                      <td className="text-right px-3 py-2 text-gray-600">
                        {reportData.returnOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 text-gray-700">Returned</td>
                      <td className="text-right px-3 py-2 font-semibold">{reportData.returnedOrdersCount}</td>
                      <td className="text-right px-3 py-2 text-gray-600">
                        {reportData.returnedOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-red-50">
                      <td className="px-3 py-2 text-gray-700 font-semibold">Cancelled</td>
                      <td className="text-right px-3 py-2 font-bold text-red-700">
                        {reportData.cancelOrdersCount}
                      </td>
                      <td className="text-right px-3 py-2 font-bold text-red-700">
                        {reportData.cancelOrdersPercent.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-teal-600 pb-2">
                  Financial Summary
                </h3>
                <table className="w-full text-xm border-collapse" style={{ tableLayout: 'fixed' }}>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-semibold text-gray-700">Cash Payments</td>
                      <td className="text-right px-3 py-2 font-bold text-gray-900">
                        Rs {reportData.totalReportCash.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-semibold text-gray-700">Card Payments</td>
                      <td className="text-right px-3 py-2 font-bold text-gray-900">
                        Rs {reportData.totalReportCard.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-semibold text-gray-700">Delivery Charges</td>
                      <td className="text-right px-3 py-2 font-bold text-gray-900">
                        Rs {reportData.totalDeliveryCharge.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-3 py-2 font-semibold text-gray-700">Return Orders Total</td>
                      <td className="text-right px-3 py-2 font-bold text-orange-600">
                        Rs {reportData.returnOrdersTotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-red-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">Cancelled Orders Total</td>
                      <td className="text-right px-3 py-2 font-bold text-red-700">
                        Rs {reportData.cancelOrdersTotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="bg-teal-50 border-t-2 border-gray-800">
                      <td className="px-3 py-3 font-bold text-gray-900">GRAND TOTAL</td>
                      <td className="text-right px-3 py-3 font-bold text-lg text-teal-700">
                        Rs {reportData.grandTotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }

          .bg-white {
            box-shadow: none !important;
          }

          button {
            display: none !important;
          }

          .max-w-7xl {
            max-width: 100%;
          }

          div[style*="210mm"] {
            width: 210mm !important;
            height: 297mm !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always !important;
          }

          .p-12 {
            padding: 1cm !important;
          }

          table {
            border-collapse: collapse !important;
          }

          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}