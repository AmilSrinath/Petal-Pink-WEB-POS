import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  TruckIcon,
  FilterIcon,
  CreditCardIcon,
  HelpCircleIcon,
  UsersIcon,
  UserIcon,
  ShieldIcon,
  LogOutIcon,
  PackageIcon,
  BarChartIcon,
  SettingsIcon,
  BuildingIcon } from
'lucide-react';
interface SidebarProps {
  onLogout: () => void;
}
export function Sidebar({ onLogout }: SidebarProps) {
  const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    path: '/sales',
    label: 'Sales',
    icon: ShoppingCartIcon
  },
  {
    path: '/inventory',
    label: 'Inventory',
    icon: PackageIcon
  },
  {
    path: '/delivery-orders',
    label: 'Delivery Orders',
    icon: TruckIcon
  },
  {
    path: '/filter-order',
    label: 'Filter Order',
    icon: FilterIcon
  },
  {
    path: '/payment',
    label: 'Payment',
    icon: CreditCardIcon
  },
  {
    path: '/inquiry',
    label: 'Inquiry',
    icon: HelpCircleIcon
  },
  {
    path: '/pms',
    label: 'PMS',
    icon: BuildingIcon
  },
  {
    path: '/employee',
    label: 'Employee',
    icon: UserIcon
  },
  {
    path: '/property-management',
    label: 'Property Management',
    icon: BuildingIcon
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: BarChartIcon
  },
  {
    path: '/configurations',
    label: 'Configurations',
    icon: SettingsIcon
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: UsersIcon
  },
  {
    path: '/user-management',
    label: 'User Management',
    icon: ShieldIcon
  }];

  return (
    <aside className="flex w-64 flex-col bg-teal-800 text-white shadow-xl h-full">
      <div className="flex h-16 items-center justify-center border-b border-teal-700 bg-teal-900 px-4">
        <h1 className="text-xl font-bold tracking-wider text-yellow-500">
          Petal Pink
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-2">
          {navItems.map((item) =>
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
            `group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-teal-700 text-white shadow-sm' : 'text-teal-100 hover:bg-teal-700/50 hover:text-white'}`
            }>

              <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0"
              aria-hidden="true" />

              {item.label}
            </NavLink>
          )}
        </nav>
      </div>

      <div className="border-t border-teal-700 p-4">
        <button
          onClick={onLogout}
          className="group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-teal-100 transition-colors hover:bg-red-600 hover:text-white">

          <LogOutIcon
            className="mr-3 h-5 w-5 flex-shrink-0"
            aria-hidden="true" />

          Logout
        </button>
      </div>
    </aside>);

}