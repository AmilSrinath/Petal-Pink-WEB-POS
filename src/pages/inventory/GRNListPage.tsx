import React from 'react';
import { DataTable, Column } from '../../components/DataTable';

interface GRN {
  id: string;
  grnNumber: string;
  poNumber: string;
  warehouse: string;
  receiveDate: string;
  totalItems: number;
  status: 'Pending' | 'Verified' | 'Completed';
}

const mockGRNs: GRN[] = [
  { id: '1', grnNumber: 'GRN-001', poNumber: 'PO-001', warehouse: 'Warehouse A', receiveDate: '2024-01-15', totalItems: 5, status: 'Completed' },
  { id: '2', grnNumber: 'GRN-002', poNumber: 'PO-002', warehouse: 'Warehouse B', receiveDate: '2024-01-16', totalItems: 3, status: 'Verified' },
  { id: '3', grnNumber: 'GRN-003', poNumber: 'PO-003', warehouse: 'Warehouse A', receiveDate: '2024-01-17', totalItems: 8, status: 'Completed' },
  { id: '4', grnNumber: 'GRN-004', poNumber: 'PO-004', warehouse: 'Warehouse C', receiveDate: '2024-01-18', totalItems: 4, status: 'Pending' },
];

export function GRNListPage() {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Verified': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
    };
    return colors[status] || '';
  };

  const columns: Column<GRN>[] = [
    { header: 'GRN Number', accessor: 'grnNumber' },
    { header: 'PO Number', accessor: 'poNumber' },
    { header: 'Warehouse', accessor: 'warehouse' },
    { header: 'Receive Date', accessor: 'receiveDate' },
    { header: 'Total Items', accessor: 'totalItems' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(row.status)}`}>
        {row.status}
      </span>
    )},
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Good Receive Notes</h2>
        <DataTable columns={columns} data={mockGRNs} />
      </div>
    </div>
  );
}
