import React, { useEffect, useState, useRef } from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'system' | 'low-stock';
}

interface StockItem {
  stockId: number;
  itemId: number;
  itemName: string;
  qty: number;
  unitType: number | null;
  status: number;
  isLowStockAlert: number | null;
  lowStockAlert: number | null;
}

interface TopBarProps {
  title: string;
  userName: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
];

const STOCK_API_URL = 'http://localhost:8080/api/stocks';
const POLL_INTERVAL_MS = 60_000; // re-check every 60 seconds

function buildLowStockNotifications(stocks: StockItem[]): Notification[] {
  return stocks
    .filter(
      (s) =>
        s.isLowStockAlert === 1 &&
        s.lowStockAlert !== null &&
        s.lowStockAlert !== undefined &&
        s.qty <= s.lowStockAlert
    )
    .map((s) => ({
      id: 10000 + s.stockId, // unique id range to avoid collision with mock ids
      title: '⚠ Low stock alert',
      message: `${s.itemName} — current qty: ${s.qty} (threshold: ${s.lowStockAlert})`,
      time: 'Just now',
      read: false,
      type: 'low-stock' as const,
    }));
}

export function TopBar({ title, userName }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);
  const [stockError, setStockError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch low-stock items and merge into notifications
  const fetchLowStockAlerts = async () => {
    try {
      const res = await fetch(STOCK_API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const stocks: StockItem[] = await res.json();
      const lowStockNotifs = buildLowStockNotifications(stocks);

      setNotifications((prev) => {
        // Keep non-low-stock notifications, then append fresh low-stock ones
        const systemNotifs = prev.filter((n) => n.type !== 'low-stock');

        // Preserve read state for alerts the user already dismissed
        const readIds = new Set(prev.filter((n) => n.read && n.type === 'low-stock').map((n) => n.id));
        const merged = lowStockNotifs.map((n) =>
          readIds.has(n.id) ? { ...n, read: true } : n
        );

        return [...systemNotifs, ...merged];
      });

      setStockError(false);
    } catch (err) {
      console.warn('Failed to fetch stock alerts:', err);
      setStockError(true);
    }
  };

  useEffect(() => {
    fetchLowStockAlerts();
    const interval = setInterval(fetchLowStockAlerts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const formatTime = (date: Date) => date.toTimeString().split(' ')[0];

  return (
    <header className="flex h-16 items-center justify-between bg-gradient-to-r from-teal-700 to-teal-600 px-6 shadow-md">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>

      <div className="flex items-center space-x-6 text-sm font-medium text-teal-50">
        <div className="flex items-center space-x-4">
          <span>Date: {formatDate(currentTime)}</span>
          <span>Time: {formatTime(currentTime)}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-teal-800/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-300/50"
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-teal-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                  {stockError && (
                    <span
                      title="Could not fetch stock data"
                      className="text-xs text-amber-500 font-medium"
                    >
                      ⚠ stock offline
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-gray-400">
                    No notifications
                  </li>
                ) : (
                  notifications.map((notification) => (
                    <li
                      key={notification.id}
                      onClick={() => markRead(notification.id)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                        notification.read
                          ? 'bg-white hover:bg-gray-50'
                          : notification.type === 'low-stock'
                          ? 'bg-amber-50 hover:bg-amber-100/60'
                          : 'bg-teal-50 hover:bg-teal-100/60'
                      }`}
                    >
                      {/* Dot indicator */}
                      <span
                        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                          notification.read
                            ? 'bg-gray-300'
                            : notification.type === 'low-stock'
                            ? 'bg-amber-500'
                            : 'bg-teal-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <button className="w-full text-xs text-center text-teal-600 hover:text-teal-800 font-medium transition-colors">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center space-x-2 rounded-full bg-teal-800/50 px-4 py-1.5 border border-teal-500/30">
          <div className="h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center text-teal-900 font-bold text-xs">
            {userName.charAt(0)}
          </div>
          <span className="text-white">{userName}</span>
        </div>
      </div>
    </header>
  );
}