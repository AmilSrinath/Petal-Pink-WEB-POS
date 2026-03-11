import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState('item');

  const itemMenus = [
    { label: 'Main Category', path: '/inventory/item-main-category' },
    { label: 'Sub Category', path: '/inventory/item-sub-category' },
    { label: 'New Item', path: '/inventory/new-item' },
    { label: 'Item List', path: '/inventory/item-list' },
  ];

  const storeMenus = [
    { label: 'Purchase Order', path: '/inventory/purchase-order' },
    { label: 'Purchase Order List', path: '/inventory/purchase-order-list' },
    { label: 'Good Receive Note', path: '/inventory/grn' },
    { label: 'GRN List', path: '/inventory/grn-list' },
    { label: 'Stock Management', path: '/inventory/stock-management' },
    { label: 'Supplier Management', path: '/inventory/supplier-management' },
    { label: 'Stock Location', path: '/inventory/stock-location' },
    { label: 'Stock Transfer', path: '/inventory/stock-transfer' },
  ];

  const settingsMenus = [
    { label: 'Unit Type', path: '/inventory/unit-type' },
    { label: 'Payment Type', path: '/inventory/payment-type' },
    { label: 'Printer Type', path: '/inventory/printer-type' },
    { label: 'Config Tables', path: '/inventory/config-tables' },
    { label: 'Main Table Location', path: '/inventory/main-table-location' },
    { label: 'Sub Table Location', path: '/inventory/sub-table-location' },
  ];

  const renderMenuSection = (menus: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {menus.map((menu, idx) => (
        <Link
          key={idx}
          to={menu.path}
          className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-teal-400 hover:shadow-md"
        >
          <span className="text-sm font-medium text-gray-900 group-hover:text-teal-700">
            {menu.label}
          </span>
          <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-teal-600" />
        </Link>
      ))}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'item', label: 'Item' },
            { id: 'store', label: 'Store' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Item Section */}
        {activeTab === 'item' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Item Management</h2>
            {renderMenuSection(itemMenus)}
          </div>
        )}

        {/* Store Section */}
        {activeTab === 'store' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Store Management</h2>
            {renderMenuSection(storeMenus)}
          </div>
        )}

        {/* Settings Section */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            {renderMenuSection(settingsMenus)}
          </div>
        )}
      </div>
    </div>
  );
}
