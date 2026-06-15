import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useModuleAccess } from '../context/ModuleAccessContext';
import logo from '../assets/logo.png';
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  FilterIcon,
  CreditCardIcon,
  HelpCircleIcon,
  UserIcon,
  LogOutIcon,
  PackageIcon,
  BarChartIcon,
  SettingsIcon,
  BuildingIcon,
  GlobeIcon,
  ChevronDownIcon,
  MenuIcon,
  XIcon
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ onLogout, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { hasAccess, loading } = useModuleAccess();

  const allNavItems = [
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
        { path: '/inventory/new-item', label: 'Items' },
        // { path: '/inventory/item-list', label: 'Item List' },
        { path: '/inventory/purchase-order', label: 'Purchase Order' },
        { path: '/inventory/purchase-order-list', label: 'PO List' },
        // { path: '/inventory/grn', label: 'Good Receive Note' },
        { path: '/inventory/grn-list', label: 'Good Receive Notes(GRN)' },
        { path: '/inventory/stock-management', label: 'Stock Management' },
        { path: '/inventory/production', label: 'Production' },
        { path: '/inventory/supplier-management', label: 'Supplier' },
        // { path: '/inventory/stock-location', label: 'Stock Location' },
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
      path: '/website',
      label: 'Website',
      icon: GlobeIcon,
      submenu: [
        {
          path: '/website/web-dashboard',
          label: 'Website Dashboard'
        },
        {
          path: '/website/manage-web-banners',
          label: 'Manage Banners'
        },
        {
          path: '/website/manage-web-categories',
          label: 'Manage Categories'
        },
        {
          path: '/website/manage-web-orders',
          label: 'Manage Orders'
        },
        {
          path: '/website/manage-web-products',
          label: 'Manage Products'
        },
        {
          path: '/website/manage-web-promotions',
          label: 'Manage Promotions'
        }
      ]
    },
    {
      path: '/employee',
      label: 'Employee',
      icon: UserIcon,
      submenu: [
        { path: '/employee/employee-manage', label: 'Employee Manage' },
        { path: '/employee/user-account-manage', label: 'User Account Manage' },
        { path: '/employee/user-role-manage', label: 'User Role Manage' },
        { path: '/employee/employee-designation', label: 'Employee Designation' },
        { path: '/employee/employee-title', label: 'Employee Title' },
      ]
    },
    {
      path: '/property-management',
      label: 'Property Management',
      icon: BuildingIcon
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: BarChartIcon,
      submenu: [
        { path: '/reports/duration-sales', label: 'Duration Sales Report' }
      ]
    },
    {
      path: '/configurations',
      label: 'Configurations',
      icon: SettingsIcon,
      submenu: [
        { path: '/configurations/manage-reasons', label: 'Manage Reasons' },
        { path: '/configurations/manage-courier-company', label: 'Manage Courier Company' },
        { path: '/configurations/manage-courier-branches', label: 'Manage Courier Branches' },
        { path: '/configurations/manage-status', label: 'Manage Status' },
        { path: '/configurations/manage-status-type', label: 'Manage Status Type' },
        { path: '/configurations/manage-user-auth', label: 'Manage User Auth' },
        { path: '/configurations/manage-order-type', label: 'Manage Order Type' },
        { path: '/configurations/manage-business-profile', label: 'Manage Business Profile' },
        { path: '/configurations/stock-location', label: 'Stock Location' },
        { path: '/configurations/stock-adj', label: 'Stock Adjustment' },
      ]
    },
  ];

  // Filter nav items based on module access
  const navItems = useMemo(() => {
    return allNavItems.filter((item: any) => {
      // Map menu labels to module names from the API
      const moduleMap: Record<string, string> = {
        Dashboard: 'Dashboard',
        Sales: 'Delivery Orders',
        Inventory: 'Inventory',
        'Filter Order': 'Filter Order',
        Payment: 'Payment',
        Inquiry: 'Inquiry',
        PMS: 'PMS',
        Website: 'Website',
        Employee: 'Employee',
        'Property Management': 'Property Management',
        Reports: 'Report',
        Configurations: 'Configuration',
      };

      const moduleName = moduleMap[item.label];
      if (!moduleName) {
        // If module name not in map, show the item by default
        return true;
      }

      return hasAccess(moduleName);
    });
  }, [hasAccess]);

  if (loading) {
    return (
      <aside className={`flex flex-col bg-teal-800 text-white shadow-xl h-full transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className={`flex h-16 items-center justify-center border-b border-teal-700 bg-teal-900`}>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
        </div>
      </aside>
    );
  }

  return (
    <aside className={`flex flex-col bg-teal-800 text-white shadow-xl h-full transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className={`flex h-16 items-center justify-between border-b border-teal-700 bg-teal-900 px-4 ${
        isCollapsed ? 'justify-center' : ''
      }`}>
        {!isCollapsed && (
          <>
            <div className="flex items-center">
              <img src={logo} width={55}/>
              <h1 className="text-xl font-bold tracking-wider text-yellow-500 ml-3">
                Petal Pink
              </h1>
            </div>
          </>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-teal-700 transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <MenuIcon className="h-6 w-6" />
          ) : (
            <XIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-2">
          {navItems.map((item: any) => (
            <div key={item.path}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => setExpandedMenu(expandedMenu === item.path ? null : item.path)}
                    className={`group flex w-full items-center ${isCollapsed ? 'justify-center' : 'justify-between'} rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      expandedMenu === item.path
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-teal-100 hover:bg-teal-700/50 hover:text-white'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className="h-5 w-5 flex-shrink-0"
                        style={{ marginRight: isCollapsed ? '0' : '0.75rem' }}
                        aria-hidden="true"
                      />
                      {!isCollapsed && item.label}
                    </div>
                    {!isCollapsed && (
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform ${
                          expandedMenu === item.path ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                  {!isCollapsed && expandedMenu === item.path && (
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
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-teal-100 hover:bg-teal-700/50 hover:text-white'
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon
                    className="h-5 w-5 flex-shrink-0"
                    style={{ marginRight: isCollapsed ? '0' : '0.75rem' }}
                    aria-hidden="true"
                  />
                  {!isCollapsed && item.label}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-teal-700 p-4">
        <button
          onClick={onLogout}
          className={`group flex w-full items-center ${isCollapsed ? 'justify-center' : ''} rounded-md px-3 py-2.5 text-sm font-medium text-teal-100 transition-colors hover:bg-red-600 hover:text-white`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOutIcon
            className="h-5 w-5 flex-shrink-0"
            style={{ marginRight: isCollapsed ? '0' : '0.75rem' }}
            aria-hidden="true"
          />
          {!isCollapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
