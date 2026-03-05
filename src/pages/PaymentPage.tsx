import React from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
export function PaymentPage() {
  const payments = [
  {
    orderCode: 'ORD-2026-001',
    customerCode: 'CUST-001',
    cod: 1500,
    totalAmount: 1500,
    paymentType: 'Cash',
    deliveryCharge: 400,
    paymentStatus: 'Pending',
    date: '2026-01-23'
  },
  {
    orderCode: 'ORD-2026-002',
    customerCode: 'CUST-002',
    cod: 0,
    totalAmount: 4500,
    paymentType: 'Card',
    deliveryCharge: 0,
    paymentStatus: 'Paid',
    date: '2026-01-23'
  },
  {
    orderCode: 'ORD-2026-003',
    customerCode: 'CUST-003',
    cod: 890,
    totalAmount: 890,
    paymentType: 'Bank Transfer',
    deliveryCharge: 400,
    paymentStatus: 'Verified',
    date: '2026-01-22'
  }];

  const columns: Column<(typeof payments)[0]>[] = [
  {
    header: 'Order Code',
    accessor: 'orderCode',
    className: 'font-medium text-teal-600'
  },
  {
    header: 'Customer Code',
    accessor: 'customerCode'
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
    header: 'Payment Type',
    accessor: 'paymentType'
  },
  {
    header: 'Delivery Charge',
    accessor: (row) => `Rs. ${row.deliveryCharge.toFixed(2)}`
  },
  {
    header: 'Payment Status',
    accessor: (row) => {
      const colors = {
        Pending: 'bg-yellow-100 text-yellow-800',
        Paid: 'bg-blue-100 text-blue-800',
        Verified: 'bg-green-100 text-green-800'
      };
      return (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colors[row.paymentStatus as keyof typeof colors]}`}>

            {row.paymentStatus}
          </span>);

    }
  },
  {
    header: 'Date',
    accessor: 'date'
  }];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payment Tracking</h1>
      </div>

      <FilterBar
        filters={[
        {
          type: 'text',
          label: 'Order Code'
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
          },
          {
            label: 'Bank Transfer',
            value: 'bank'
          }]

        },
        {
          type: 'select',
          label: 'Payment Status',
          options: [
          {
            label: 'Pending',
            value: 'pending'
          },
          {
            label: 'Paid',
            value: 'paid'
          },
          {
            label: 'Verified',
            value: 'verified'
          }]

        }]
        }
        totalCount={payments.length} />


      <div className="flex-1 overflow-hidden">
        <DataTable columns={columns} data={payments} />
      </div>
    </div>);

}