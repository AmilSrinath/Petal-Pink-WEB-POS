import React from 'react';
import {
  ShoppingCartIcon,
  DollarSignIcon,
  TruckIcon,
  HelpCircleIcon,
  ArrowUpRightIcon } from
'lucide-react';
export function DashboardPage() {
  const stats = [
  {
    name: "Today's Orders",
    value: '142',
    icon: ShoppingCartIcon,
    change: '+12%',
    changeType: 'positive'
  },
  {
    name: 'Total Revenue',
    value: '$12,450',
    icon: DollarSignIcon,
    change: '+8.2%',
    changeType: 'positive'
  },
  {
    name: 'Pending Deliveries',
    value: '28',
    icon: TruckIcon,
    change: '-4%',
    changeType: 'negative'
  },
  {
    name: 'Active Inquiries',
    value: '12',
    icon: HelpCircleIcon,
    change: '+2',
    changeType: 'neutral'
  }];

  const recentOrders = [
  {
    id: 'ORD-2026-001',
    customer: 'John Doe',
    amount: '$120.00',
    status: 'Completed',
    date: '2026-01-23'
  },
  {
    id: 'ORD-2026-002',
    customer: 'Jane Smith',
    amount: '$450.50',
    status: 'Pending',
    date: '2026-01-23'
  },
  {
    id: 'ORD-2026-003',
    customer: 'AmilGrainCo',
    amount: '$890.00',
    status: 'Processing',
    date: '2026-01-23'
  },
  {
    id: 'ORD-2026-004',
    customer: 'Sarah Johnson',
    amount: '$65.00',
    status: 'Completed',
    date: '2026-01-22'
  },
  {
    id: 'ORD-2026-005',
    customer: 'Michael Brown',
    amount: '$210.25',
    status: 'Delivered',
    date: '2026-01-22'
  }];

  return (
    <div className="space-y-6 p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) =>
        <div
          key={stat.name}
          className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <stat.icon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span
              className={`font-medium ${stat.changeType === 'positive' ? 'text-green-600' : stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>

                {stat.change}
              </span>
              <span className="ml-2 text-gray-500">from yesterday</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <button className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center">
              View all <ArrowUpRightIcon className="ml-1 h-4 w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentOrders.map((order) =>
                <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-teal-600">
                      {order.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {order.customer}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {order.amount}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${order.status === 'Completed' || order.status === 'Delivered' ? 'bg-green-100 text-green-800' : order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>

                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {order.date}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <button className="w-full flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 p-4 text-left transition-colors hover:bg-teal-100">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white">
                  <ShoppingCartIcon className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-teal-900">New Order</p>
                  <p className="text-xs text-teal-700">
                    Create a new sales order
                  </p>
                </div>
              </div>
              <ArrowUpRightIcon className="h-5 w-5 text-teal-600" />
            </button>

            <button className="w-full flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left transition-colors hover:bg-yellow-100">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-white">
                  <DollarSignIcon className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-900">
                    View Payments
                  </p>
                  <p className="text-xs text-yellow-700">
                    Check recent transactions
                  </p>
                </div>
              </div>
              <ArrowUpRightIcon className="h-5 w-5 text-yellow-600" />
            </button>

            <button className="w-full flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 text-left transition-colors hover:bg-blue-100">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                  <TruckIcon className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-900">
                    Check Deliveries
                  </p>
                  <p className="text-xs text-blue-700">
                    Track pending shipments
                  </p>
                </div>
              </div>
              <ArrowUpRightIcon className="h-5 w-5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>);

}