import React, { useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SalesPage } from './pages/SalesPage';
import { DeliveryOrdersPage } from './pages/DeliveryOrdersPage';
import { FilterOrderPage } from './pages/FilterOrderPage';
import { PaymentPage } from './pages/PaymentPage';
import { InquiryPage } from './pages/InquiryPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { InventoryPage } from './pages/InventoryPage';
import { ItemMainCategoryPage } from './pages/inventory/ItemMainCategoryPage';
import { ItemSubCategoryPage } from './pages/inventory/ItemSubCategoryPage';
import { NewItemPage } from './pages/inventory/NewItemPage';
import { ItemListPage } from './pages/inventory/ItemListPage';
import { PurchaseOrderPage } from './pages/inventory/PurchaseOrderPage';
import { PurchaseOrderListPage } from './pages/inventory/PurchaseOrderListPage';
import { GoodReceiveNotePage } from './pages/inventory/GoodReceiveNotePage';
import { GRNListPage } from './pages/inventory/GRNListPage';
import { StockManagementPage } from './pages/inventory/StockManagementPage';
import { SupplierManagementPage } from './pages/inventory/SupplierManagementPage';
import { StockLocationPage } from './pages/inventory/StockLocationPage';
import { StockTransferPage } from './pages/inventory/StockTransferPage';
import { UnitTypePage } from './pages/inventory/UnitTypePage';
import { PaymentTypePage } from './pages/inventory/PaymentTypePage';
import { PrinterTypePage } from './pages/inventory/PrinterTypePage';
import { ConfigTablesPage } from './pages/inventory/ConfigTablesPage';
import { MainTableLocationPage } from './pages/inventory/MainTableLocationPage';
import { SubTableLocationPage } from './pages/inventory/SubTableLocationPage';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const handleLogin = (username: string) => {  // ← accepts username now
    setUserName(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50 font-sans">
        <Sidebar onLogout={handleLogout} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<TopBar title="Dashboard" userName={userName} />} />
            <Route path="/sales" element={<TopBar title="Sales Order Management" userName={userName} />} />
            <Route path="/delivery-orders" element={<TopBar title="Delivery Orders" userName={userName} />} />
            <Route path="/filter-order" element={<TopBar title="Filter Orders" userName={userName} />} />
            <Route path="/payment" element={<TopBar title="Payment Tracking" userName={userName} />} />
            <Route path="/inquiry" element={<TopBar title="Inquiry Management" userName={userName} />} />
            <Route path="/inventory" element={<TopBar title="Inventory Management" userName={userName} />} />
            <Route path="/inventory/item-main-category" element={<TopBar title="Main Categories" userName={userName} />} />
            <Route path="/inventory/item-sub-category" element={<TopBar title="Sub Categories" userName={userName} />} />
            <Route path="/inventory/new-item" element={<TopBar title="Add New Item" userName={userName} />} />
            <Route path="/inventory/item-list" element={<TopBar title="Item List" userName={userName} />} />
            <Route path="/inventory/purchase-order" element={<TopBar title="Create Purchase Order" userName={userName} />} />
            <Route path="/inventory/purchase-order-list" element={<TopBar title="Purchase Orders" userName={userName} />} />
            <Route path="/inventory/grn" element={<TopBar title="Good Receive Note" userName={userName} />} />
            <Route path="/inventory/grn-list" element={<TopBar title="GRN List" userName={userName} />} />
            <Route path="/inventory/stock-management" element={<TopBar title="Stock Management" userName={userName} />} />
            <Route path="/inventory/supplier-management" element={<TopBar title="Supplier Management" userName={userName} />} />
            <Route path="/inventory/stock-location" element={<TopBar title="Stock Locations" userName={userName} />} />
            <Route path="/inventory/stock-transfer" element={<TopBar title="Stock Transfer" userName={userName} />} />
            <Route path="/inventory/unit-type" element={<TopBar title="Unit Types" userName={userName} />} />
            <Route path="/inventory/payment-type" element={<TopBar title="Payment Types" userName={userName} />} />
            <Route path="/inventory/printer-type" element={<TopBar title="Printer Configuration" userName={userName} />} />
            <Route path="/inventory/config-tables" element={<TopBar title="Configuration Tables" userName={userName} />} />
            <Route path="/inventory/main-table-location" element={<TopBar title="Main Table Locations" userName={userName} />} />
            <Route path="/inventory/sub-table-location" element={<TopBar title="Sub-Table Locations" userName={userName} />} />
            <Route path="*" element={<TopBar title="Petal Pink POS System" userName={userName} />} />
          </Routes>

          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/delivery-orders" element={<DeliveryOrdersPage />} />
              <Route path="/filter-order" element={<FilterOrderPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/inquiry" element={<InquiryPage />} />

              {/* Inventory Routes */}
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/item-main-category" element={<ItemMainCategoryPage />} />
              <Route path="/inventory/item-sub-category" element={<ItemSubCategoryPage />} />
              <Route path="/inventory/new-item" element={<NewItemPage />} />
              <Route path="/inventory/item-list" element={<ItemListPage />} />
              <Route path="/inventory/purchase-order" element={<PurchaseOrderPage />} />
              <Route path="/inventory/purchase-order-list" element={<PurchaseOrderListPage />} />
              <Route path="/inventory/grn" element={<GoodReceiveNotePage />} />
              <Route path="/inventory/grn-list" element={<GRNListPage />} />
              <Route path="/inventory/stock-management" element={<StockManagementPage />} />
              <Route path="/inventory/supplier-management" element={<SupplierManagementPage />} />
              <Route path="/inventory/stock-location" element={<StockLocationPage />} />
              <Route path="/inventory/stock-transfer" element={<StockTransferPage />} />
              <Route path="/inventory/unit-type" element={<UnitTypePage />} />
              <Route path="/inventory/payment-type" element={<PaymentTypePage />} />
              <Route path="/inventory/printer-type" element={<PrinterTypePage />} />
              <Route path="/inventory/config-tables" element={<ConfigTablesPage />} />
              <Route path="/inventory/main-table-location" element={<MainTableLocationPage />} />
              <Route path="/inventory/sub-table-location" element={<SubTableLocationPage />} />

              {/* Placeholder Routes */}
              <Route path="/pms" element={<PlaceholderPage title="PMS" />} />
              <Route path="/employee" element={<PlaceholderPage title="Employee Management" />} />
              <Route path="/property-management" element={<PlaceholderPage title="Property Management" />} />
              <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
              <Route path="/configurations" element={<PlaceholderPage title="Configurations" />} />
              <Route path="/customers" element={<PlaceholderPage title="Customer Management" />} />
              <Route path="/user-management" element={<PlaceholderPage title="User Management" />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}