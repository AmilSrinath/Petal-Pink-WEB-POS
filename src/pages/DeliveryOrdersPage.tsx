import React from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { EyeIcon, CheckCircleIcon } from 'lucide-react';
export function DeliveryOrdersPage() {
  const deliveryOrders = [
  {
    orderCode: 'ORD-2026-001',
    customerName: 'John Doe',
    phone: '0771234567',
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
    phone: '0719876543',
    address: '45 Park Ave, Kandy',
    cod: 0,
    totalAmount: 4500,
    orderType: 'Website',
    date: '2026-01-23',
    status: 'Dispatched'
  },
  {
    orderCode: 'ORD-2026-003',
    customerName: 'AmilGrainCo',
    phone: '0754443332',
    address: '78 Lake Rd, Galle',
    cod: 890,
    totalAmount: 890,
    orderType: 'WhatsApp',
    date: '2026-01-22',
    status: 'Delivered'
  }];

  const columns: Column<(typeof deliveryOrders)[0]>[] = [
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
    header: 'Phone',
    accessor: 'phone'
  },
  {
    header: 'Address',
    accessor: 'address',
    className: 'max-w-[200px] truncate'
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
    header: 'Status',
    accessor: (row) => {
      const colors = {
        Pending: 'bg-yellow-100 text-yellow-800',
        Dispatched: 'bg-blue-100 text-blue-800',
        Delivered: 'bg-green-100 text-green-800'
      };
      return (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colors[row.status as keyof typeof colors]}`}>

            {row.status}
          </span>);

    }
  },
  {
    header: 'Actions',
    accessor: () =>
    <div className="flex space-x-2">
          <button
        className="text-teal-600 hover:text-teal-900"
        title="View Details">

            <EyeIcon className="h-4 w-4" />
          </button>
          <button
        className="text-green-600 hover:text-green-900"
        title="Mark Delivered">

            <CheckCircleIcon className="h-4 w-4" />
          </button>
        </div>

  }];

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Orders</h1>
      </div>

      <FilterBar
        filters={[
        {
          type: 'text',
          label: 'Order Code',
          placeholder: 'Search code...'
        },
        {
          type: 'date',
          label: 'From Date'
        },
        {
          type: 'date',
          label: 'To Date'
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
            label: 'Dispatched',
            value: 'dispatched'
          },
          {
            label: 'Delivered',
            value: 'delivered'
          }]

        }]
        }
        totalCount={deliveryOrders.length}
        totalLabel="Total Deliveries" />


      <div className="flex-1 overflow-hidden">
        <DataTable columns={columns} data={deliveryOrders} />
      </div>
    </div>);

}