import React from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { EditIcon } from 'lucide-react';
export function InquiryPage() {
  const inquiries = [
  {
    wayBill: 'WB-1001',
    customerCode: 'CUST-001',
    customerName: 'John Doe',
    phone1: '0771234567',
    phone2: '',
    company: 'Individual',
    branch: 'Main',
    branchContact: '0112345678',
    createdDate: '2026-01-23',
    reason: 'Late Delivery',
    remark: 'Customer called to check status',
    status: 'Open'
  },
  {
    wayBill: 'WB-1002',
    customerCode: 'CUST-002',
    customerName: 'Jane Smith',
    phone1: '0719876543',
    phone2: '0112345678',
    company: 'TechCorp',
    branch: 'Kandy',
    branchContact: '0812345678',
    createdDate: '2026-01-22',
    reason: 'Damaged Item',
    remark: 'Requested replacement',
    status: 'Resolved'
  }];

  const columns: Column<(typeof inquiries)[0]>[] = [
  {
    header: 'Way Bill',
    accessor: 'wayBill',
    className: 'font-medium text-teal-600 whitespace-nowrap'
  },
  {
    header: 'Customer Code',
    accessor: 'customerCode',
    className: 'whitespace-nowrap'
  },
  {
    header: 'Customer Name',
    accessor: 'customerName',
    className: 'whitespace-nowrap'
  },
  {
    header: 'Customer Phone 1',
    accessor: 'phone1',
    className: 'whitespace-nowrap'
  },
  {
    header: 'Customer Phone 2',
    accessor: 'phone2',
    className: 'whitespace-nowrap'
  },
  {
    header: 'Company',
    accessor: 'company',
    className: 'whitespace-nowrap'
  },
  {
    header: 'Branch',
    accessor: 'branch',
    className: 'whitespace-nowrap'
  },
  {
    header: 'Branch Contact',
    accessor: 'branchContact',
    className: 'whitespace-nowrap'
  },
  {
    header: 'Created Date',
    accessor: 'createdDate',
    className: 'whitespace-nowrap'
  },
  {
    header: 'Reason',
    accessor: 'reason',
    className: 'max-w-[150px] truncate'
  },
  {
    header: 'Remark',
    accessor: 'remark',
    className: 'max-w-[200px] truncate'
  },
  {
    header: 'Status',
    accessor: (row) => {
      const colors = {
        Open: 'bg-red-100 text-red-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        Resolved: 'bg-green-100 text-green-800'
      };
      return (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colors[row.status as keyof typeof colors]}`}>

            {row.status}
          </span>);

    }
  }];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">View Inquiry</h1>
      </div>

      <FilterBar
        filters={[
        {
          type: 'text',
          label: 'Way Bill'
        },
        {
          type: 'date',
          label: 'From'
        },
        {
          type: 'date',
          label: 'To'
        },
        {
          type: 'select',
          label: 'Status',
          options: [
          {
            label: 'Open',
            value: 'open'
          },
          {
            label: 'In Progress',
            value: 'progress'
          },
          {
            label: 'Resolved',
            value: 'resolved'
          }]

        }]
        }
        totalCount={inquiries.length}
        totalLabel="Total Inquiry" />


      <div className="flex-1 overflow-hidden mb-16">
        <DataTable columns={columns} data={inquiries} />
      </div>

      <div className="absolute bottom-6 right-6">
        <button className="flex items-center rounded-lg bg-yellow-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2">
          <EditIcon className="mr-2 h-5 w-5" />
          Edit
        </button>
      </div>
    </div>);

}