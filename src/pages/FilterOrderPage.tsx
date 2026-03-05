import React from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { PrinterIcon } from 'lucide-react';
export function FilterOrderPage() {
  const orders = [
  {
    orderCode: 'ORD-2026-001',
    customerName: 'John Doe',
    phoneOne: '0771234567',
    phoneTwo: '',
    address: '123 Main St, Colombo',
    cod: 1500,
    totalAmount: 1500,
    orderType: 'WhatsApp',
    date: '2026-01-23',
    status: 'Pending'
  },
  {
    orderCode: 'ORD-2026-002',
    customerName: 'Jane Smith',
    phoneOne: '0719876543',
    phoneTwo: '0112345678',
    address: '45 Park Ave, Kandy',
    cod: 0,
    totalAmount: 4500,
    orderType: 'Website',
    date: '2026-01-23',
    status: 'Processing'
  }];

  const columns: Column<(typeof orders)[0]>[] = [
  {
    header: 'Order Code',
    accessor: 'orderCode',
    className: 'font-medium text-teal-600'
  },
  {
    header: 'Customer Name',
    accessor: 'customerName'
  },
  {
    header: 'Phone One',
    accessor: 'phoneOne'
  },
  {
    header: 'Phone Two',
    accessor: 'phoneTwo'
  },
  {
    header: 'Address',
    accessor: 'address',
    className: 'max-w-[150px] truncate'
  },
  {
    header: 'COD',
    accessor: (row) => `Rs. ${row.cod.toFixed(2)}`
  },
  {
    header: 'Total Amount',
    accessor: (row) => `Rs. ${row.totalAmount.toFixed(2)}`,
    className: 'font-semibold'
  },
  {
    header: 'Order Type',
    accessor: 'orderType'
  },
  {
    header: 'Date',
    accessor: 'date'
  },
  {
    header: 'Status',
    accessor: 'status'
  }];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Advanced Order Filter
        </h1>
      </div>

      <FilterBar
        filters={[
        {
          type: 'text',
          label: 'Order Code'
        },
        {
          type: 'text',
          label: 'Customer Code'
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
          label: 'Payment Type',
          options: [
          {
            label: 'Cash',
            value: 'cash'
          },
          {
            label: 'Card',
            value: 'card'
          }]

        },
        {
          type: 'select',
          label: 'Status',
          options: [
          {
            label: 'Pending',
            value: 'pending'
          },
          {
            label: 'Completed',
            value: 'completed'
          }]

        },
        {
          type: 'select',
          label: 'Order Type',
          options: [
          {
            label: 'WhatsApp',
            value: 'whatsapp'
          },
          {
            label: 'Website',
            value: 'website'
          }]

        },
        {
          type: 'select',
          label: 'Profile',
          options: [
          {
            label: 'AmilGrainCo',
            value: 'amil'
          },
          {
            label: 'BeautyCare',
            value: 'beauty'
          }]

        }]
        }
        totalCount={orders.length} />


      <div className="flex-1 overflow-hidden mb-16">
        <DataTable columns={columns} data={orders} />
      </div>

      <div className="absolute bottom-6 right-6">
        <button className="flex items-center rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
          <PrinterIcon className="mr-2 h-5 w-5" />
          Print Wrapping
        </button>
      </div>
    </div>);

}