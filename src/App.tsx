import React, { useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate } from
'react-router-dom';
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
export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Super Admin');
  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
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
            <Route
              path="/"
              element={<TopBar title="Dashboard" userName={userName} />} />

            <Route
              path="/sales"
              element={
              <TopBar title="Sales Order Management" userName={userName} />
              } />

            <Route
              path="/delivery-orders"
              element={<TopBar title="Delivery Orders" userName={userName} />} />

            <Route
              path="/filter-order"
              element={<TopBar title="Filter Orders" userName={userName} />} />

            <Route
              path="/payment"
              element={<TopBar title="Payment Tracking" userName={userName} />} />

            <Route
              path="/inquiry"
              element={
              <TopBar title="Inquiry Management" userName={userName} />
              } />

            <Route
              path="*"
              element={
              <TopBar title="Petal Pink POS System" userName={userName} />
              } />

          </Routes>

          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/delivery-orders" element={<DeliveryOrdersPage />} />
              <Route path="/filter-order" element={<FilterOrderPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/inquiry" element={<InquiryPage />} />

              {/* Placeholder Routes for out-of-scope pages */}
              <Route
                path="/inventory"
                element={<PlaceholderPage title="Inventory Management" />} />

              <Route path="/pms" element={<PlaceholderPage title="PMS" />} />
              <Route
                path="/employee"
                element={<PlaceholderPage title="Employee Management" />} />

              <Route
                path="/property-management"
                element={<PlaceholderPage title="Property Management" />} />

              <Route
                path="/reports"
                element={<PlaceholderPage title="Reports" />} />

              <Route
                path="/configurations"
                element={<PlaceholderPage title="Configurations" />} />

              <Route
                path="/customers"
                element={<PlaceholderPage title="Customer Management" />} />

              <Route
                path="/user-management"
                element={<PlaceholderPage title="User Management" />} />


              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>);

}