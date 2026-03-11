import React, { useState } from 'react';
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
  BuildingIcon,
  ChevronDownIcon } from
'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

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
      icon: PackageIcon,
      submenu: [
        { path: '/inventory/item-main-category', label: 'Main Category' },
        { path: '/inventory/item-sub-category', label: 'Sub Category' },
        { path: '/inventory/new-item', label: 'New Item' },
        { path: '/inventory/item-list', label: 'Item List' },
        { path: '/inventory/purchase-order', label: 'Purchase Order' },
        { path: '/inventory/purchase-order-list', label: 'PO List' },
        { path: '/inventory/grn', label: 'Good Receive Note' },
        { path: '/inventory/grn-list', label: 'GRN List' },
        { path: '/inventory/stock-management', label: 'Stock Management' },
        { path: '/inventory/supplier-management', label: 'Supplier' },
        { path: '/inventory/stock-location', label: 'Stock Location' },
        { path: '/inventory/stock-transfer', label: 'Stock Transfer' },
      ]
    },
    // {
    //   path: '/delivery-orders',
    //   label: 'Delivery Orders',
    //   icon: TruckIcon
    // },
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
    }
  ];

  return (
    <aside className="flex w-64 flex-col bg-teal-800 text-white shadow-xl h-full">
      <div className="flex h-16 items-center justify-center border-b border-teal-700 bg-teal-900 px-4">
        <img src='assets/logo.png' width={55}/>
        <h1 className="text-xl font-bold tracking-wider text-yellow-500 ml-3">
          Petal Pink
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-2">
          {navItems.map((item: any) => (
            <div key={item.path}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => setExpandedMenu(expandedMenu === item.path ? null : item.path)}
                    className={`group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      expandedMenu === item.path
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-teal-100 hover:bg-teal-700/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className="mr-3 h-5 w-5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      {item.label}
                    </div>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${
                        expandedMenu === item.path ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedMenu === item.path && (
                    <div className="space-y-1 py-2 pl-4">
                      {item.submenu.map((subitem: any) => (
                        <NavLink
                          key={subitem.path}
                          to={subitem.path}
                          className={({ isActive }) =>
                            `group flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'text-teal-100 hover:bg-teal-700/50 hover:text-white'
                            }`
                          }
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-300 mr-2" />
                          {subitem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-teal-100 hover:bg-teal-700/50 hover:text-white'
                    }`
                  }
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.label}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-teal-700 p-4">
        <button
          onClick={onLogout}
          className="group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-teal-100 transition-colors hover:bg-red-600 hover:text-white"
        >
          <LogOutIcon
            className="mr-3 h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          />
          Logout
        </button>
      </div>
    </aside>
  );
}
