import React, { useState, useRef } from 'react';
import { Calendar, RefreshCw, Download } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface EmployeeAttendanceRow {
  employeeId: number;
  employeeName: string;
  designationName: string;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  leaveCount: number;
  totalDays: number;
  presentPercent: number;
  absentPercent: number;
  halfDayPercent: number;
  leavePercent: number;
  totalWorkedHours: number;
}

interface EmployeeAttendanceReportData {
  totalEmployees: number;
  totalPresentCount: number;
  totalAbsentCount: number;
  totalHalfDayCount: number;
  totalLeaveCount: number;
  totalRecords: number;
  overallPresentPercent: number;
  overallAbsentPercent: number;
  overallHalfDayPercent: number;
  overallLeavePercent: number;
  rows: EmployeeAttendanceRow[];
}

export function EmployeeAttendanceReportPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [reportData, setReportData] = useState<EmployeeAttendanceReportData | null>(null);
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
        `${API_BASE_URL}/api/reports/employee-attendance?dateFrom=${dateFrom}&dateTo=${dateTo}`
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

  const handlePdfExport = async () => {
    if (!reportRef.current) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const element = reportRef.current;

      const originalStyle = element.getAttribute('style') || '';
      element.style.width = '794px';
      element.style.minHeight = 'auto';

      const options = {
        margin: [10, 10, 10, 10],
        filename: `Employee_Attendance_Report_${dateFrom}_to_${dateTo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: 794,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      };

      await html2pdf().set(options).from(element).save();

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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Employee Attendance Report</h1>

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
            <div className="p-8" style={{ fontSize: '10pt', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}>
              {/* Header */}
              <div className="text-center mb-5 border-gray-800">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Attendance Report</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Period: {new Date(dateFrom).toLocaleDateString()} to{' '}
                  {new Date(dateTo).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">Generated on {new Date().toLocaleString()}</p>
              </div>

              {/* Summary Stats */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-teal-600 pb-2">
                  Attendance Summary
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="border border-gray-300 p-3 rounded">
                    <p className="text-xm text-gray-600 font-semibold">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalEmployees}</p>
                  </div>

                  <div className="border border-gray-300 p-3 rounded">
                    <p className="text-xm text-gray-600 font-semibold">Present</p>
                    <p className="text-2xl font-bold text-green-700">{reportData.totalPresentCount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportData.overallPresentPercent.toFixed(2)}%
                    </p>
                  </div>

                  <div className="border border-gray-300 p-3 rounded">
                    <p className="text-xm text-gray-600 font-semibold">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{reportData.totalAbsentCount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportData.overallAbsentPercent.toFixed(2)}%
                    </p>
                  </div>

                  <div className="border border-gray-300 p-3 rounded">
                    <p className="text-xm text-gray-600 font-semibold">Leave</p>
                    <p className="text-2xl font-bold text-blue-600">{reportData.totalLeaveCount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reportData.overallLeavePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-Employee Breakdown */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-teal-600 pb-2">
                  Employee Breakdown
                </h3>
                <table className="w-full text-xm border-collapse" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="text-left px-3 py-2 font-bold text-gray-800">Employee</th>
                      <th className="text-left px-3 py-2 font-bold text-gray-800">Designation</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-800">Present</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-800">Absent</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-800">Half Day</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-800">Leave</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-800">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((row) => (
                      <tr key={row.employeeId} className="border-b border-gray-200">
                        <td className="px-3 py-2 text-gray-700">{row.employeeName}</td>
                        <td className="px-3 py-2 text-gray-500">{row.designationName || '-'}</td>
                        <td className="text-right px-3 py-2 font-semibold text-green-700">{row.presentCount}</td>
                        <td className="text-right px-3 py-2 font-semibold text-red-600">{row.absentCount}</td>
                        <td className="text-right px-3 py-2 font-semibold text-yellow-600">{row.halfDayCount}</td>
                        <td className="text-right px-3 py-2 font-semibold text-blue-600">{row.leaveCount}</td>
                        <td className="text-right px-3 py-2 text-gray-600">{row.presentPercent.toFixed(2)}%</td>
                      </tr>
                    ))}
                    {reportData.rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                          No attendance records found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Overall Totals */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-teal-600 pb-2">
                  Overall Totals
                </h3>
                <table className="w-full text-xm border-collapse" style={{ tableLayout: 'fixed' }}>
                  <tbody>
                    <tr className="border-b border-gray-200 bg-green-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">Total Present Days</td>
                      <td className="text-right px-3 py-2 font-bold text-green-700">
                        {reportData.totalPresentCount}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-red-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">Total Absent Days</td>
                      <td className="text-right px-3 py-2 font-bold text-red-700">
                        {reportData.totalAbsentCount}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-yellow-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">Total Half Days</td>
                      <td className="text-right px-3 py-2 font-bold text-yellow-700">
                        {reportData.totalHalfDayCount}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-blue-50">
                      <td className="px-3 py-2 font-semibold text-gray-700">Total Leave Days</td>
                      <td className="text-right px-3 py-2 font-bold text-blue-700">
                        {reportData.totalLeaveCount}
                      </td>
                    </tr>
                    <tr className="bg-teal-50 border-t-2 border-gray-800">
                      <td className="px-3 py-3 font-bold text-gray-900">TOTAL ATTENDANCE RECORDS</td>
                      <td className="text-right px-3 py-3 font-bold text-lg text-teal-700">
                        {reportData.totalRecords}
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
