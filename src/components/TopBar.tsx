import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../config';

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
  mainItemCategoryId?: number;
  mainItemCategoryName?: string;
  subItemCategoryId?: number;
  subItemCategoryName?: string;
}

interface MainCategory {
  mainItemCategoryId: number;
  mainItemCategoryName: string;
  imagePath: string | null;
  status: number;
  userId: number;
  visible: number;
  editedBy: number;
}

interface SubCategory {
  subItemCategoryId: number;
  mainItemCategoryId: number;
  mainItemCategoryName: string;
  subItemCategoryName: string;
  imagePath: string | null;
  status: number;
  userId: number;
  visible: number;
}

interface ItemDetail {
  itemId: number;
  itemName: string;
  mainItemCategoryId: number;
  mainItemCategoryName: string;
  subItemCategoryId: number;
  subItemCategoryName: string;
}

interface GroupedNotification {
  mainCategoryId: number;
  mainCategoryName: string;
  subCategories: {
    subCategoryId: number;
    subCategoryName: string;
    items: {
      stockId: number;
      itemId: number;
      itemName: string;
      qty: number;
      lowStockAlert: number;
      read: boolean;
    }[];
  }[];
}

interface TopBarProps {
  title: string;
  userName: string;
}

const CATEGORIES_API_URL = `${API_BASE_URL}/api/categories`;
const SUB_CATEGORIES_API_URL = `${API_BASE_URL}/api/sub-categories`;
const ITEMS_API_URL = `${API_BASE_URL}/api/items`;
const STOCK_API_URL = `${API_BASE_URL}/api/stocks`;
const POLL_INTERVAL_MS = 60_000;

export function TopBar({ title, userName }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stockError, setStockError] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Profile form state
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsed state for categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());
  const [readItems, setReadItems] = useState<Set<string>>(new Set());

  // Load saved profile image on mount
  useEffect(() => {
    const savedImg = localStorage.getItem('profileImage');
    if (savedImg) setProfileImage(savedImg);
    const savedUsername = localStorage.getItem('username') || userName;
    setNewUsername(savedUsername);
  }, [userName]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileModal(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllData = async () => {
    try {
      const [stocksRes, itemsRes] = await Promise.all([
        fetch(STOCK_API_URL),
        fetch(ITEMS_API_URL),
      ]);

      if (!stocksRes.ok || !itemsRes.ok) throw new Error('Fetch failed');

      const stocks: StockItem[] = await stocksRes.json();
      const items: ItemDetail[] = await itemsRes.json();

      // Build item lookup map
      const itemMap = new Map<number, ItemDetail>();
      items.forEach((item) => itemMap.set(item.itemId, item));

      // Filter low-stock items
      const lowStockItems = stocks.filter(
        (s) =>
          s.isLowStockAlert === 1 &&
          s.lowStockAlert !== null &&
          s.lowStockAlert !== undefined &&
          s.qty <= s.lowStockAlert!
      );

      // Build grouped structure: mainCategory -> subCategory -> items
      const grouped = new Map<
        number,
        {
          mainCategoryId: number;
          mainCategoryName: string;
          subMap: Map<
            number,
            {
              subCategoryId: number;
              subCategoryName: string;
              items: {
                stockId: number;
                itemId: number;
                itemName: string;
                qty: number;
                lowStockAlert: number;
                read: boolean;
              }[];
            }
          >;
        }
      >();

      lowStockItems.forEach((s) => {
        const itemDetail = itemMap.get(s.itemId);
        const mainCatId = itemDetail?.mainItemCategoryId ?? 0;
        const mainCatName = itemDetail?.mainItemCategoryName ?? 'Uncategorized';
        const subCatId = itemDetail?.subItemCategoryId ?? 0;
        const subCatName = itemDetail?.subItemCategoryName ?? 'General';
        const key = `${s.stockId}`;

        if (!grouped.has(mainCatId)) {
          grouped.set(mainCatId, {
            mainCategoryId: mainCatId,
            mainCategoryName: mainCatName,
            subMap: new Map(),
          });
        }
        const mainEntry = grouped.get(mainCatId)!;

        if (!mainEntry.subMap.has(subCatId)) {
          mainEntry.subMap.set(subCatId, {
            subCategoryId: subCatId,
            subCategoryName: subCatName,
            items: [],
          });
        }

        mainEntry.subMap.get(subCatId)!.items.push({
          stockId: s.stockId,
          itemId: s.itemId,
          itemName: s.itemName,
          qty: s.qty,
          lowStockAlert: s.lowStockAlert!,
          read: readItems.has(key),
        });
      });

      // Convert to array
      const groupedArray: GroupedNotification[] = Array.from(grouped.values()).map((g) => ({
        mainCategoryId: g.mainCategoryId,
        mainCategoryName: g.mainCategoryName,
        subCategories: Array.from(g.subMap.values()),
      }));

      setGroupedNotifications(groupedArray);

      // Also update flat notifications for backward compat
      const flatNotifs: Notification[] = lowStockItems.map((s) => ({
        id: 10000 + s.stockId,
        title: '⚠ Low stock alert',
        message: `${s.itemName} — qty: ${s.qty} (threshold: ${s.lowStockAlert})`,
        time: 'Just now',
        read: readItems.has(`${s.stockId}`),
        type: 'low-stock' as const,
      }));
      setNotifications(flatNotifs);
      setStockError(false);
    } catch (err) {
      setStockError(true);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [readItems]);

  // Unread count across all grouped items
  const unreadCount = groupedNotifications.reduce((total, g) => {
    return (
      total +
      g.subCategories.reduce((subTotal, sub) => {
        return subTotal + sub.items.filter((item) => !readItems.has(`${item.stockId}`)).length;
      }, 0)
    );
  }, 0);

  const markItemRead = (stockId: number) => {
    setReadItems((prev) => new Set([...prev, `${stockId}`]));
  };

  const markAllRead = () => {
    const allIds = groupedNotifications.flatMap((g) =>
      g.subCategories.flatMap((sub) => sub.items.map((item) => `${item.stockId}`))
    );
    setReadItems(new Set(allIds));
  };

  const toggleCategory = (catId: number) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const formatTime = (date: Date) => date.toTimeString().split(' ')[0];

  // Profile handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image must be under 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileMsg(null);
    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword && !currentPassword) {
      setProfileMsg({ type: 'error', text: 'Enter your current password to set a new one.' });
      return;
    }
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      const storedUsername = localStorage.getItem('username') || userName;
      if (newPassword) {
        const checkRes = await fetch(`${API_BASE_URL}/api/users/check-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: storedUsername, password: currentPassword }),
        });
        if (!checkRes.ok) {
          setProfileMsg({ type: 'error', text: 'Current password is incorrect.' });
          setSaving(false);
          return;
        }
      }
      const updatePayload: any = {};
      if (newUsername && newUsername !== storedUsername) updatePayload.username = newUsername;
      if (newPassword) updatePayload.newPassword = newPassword;
      if (Object.keys(updatePayload).length > 0) {
        const updateRes = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
        if (!updateRes.ok) {
          const errText = await updateRes.text();
          setProfileMsg({ type: 'error', text: errText || 'Update failed.' });
          setSaving(false);
          return;
        }
        if (updatePayload.username) localStorage.setItem('username', updatePayload.username);
      }
      if (profileImage) localStorage.setItem('profileImage', profileImage);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const displayName = localStorage.getItem('username') || userName;

  const totalItems = groupedNotifications.reduce(
    (t, g) => t + g.subCategories.reduce((s, sub) => s + sub.items.length, 0),
    0
  );

  return (
    <>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-96 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-800">Low Stock Alerts</h3>
                    {totalItems > 0 && (
                      <span className="text-[11px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        {totalItems} item{totalItems !== 1 ? 's' : ''}
                      </span>
                    )}
                    {stockError && (
                      <span title="Could not fetch stock data" className="text-xs text-red-500 font-medium">⚠ offline</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Toggle grouped / flat */}
                    <button
                      onClick={() => setViewMode((v) => (v === 'grouped' ? 'flat' : 'grouped'))}
                      className="text-[11px] text-gray-400 hover:text-teal-600 font-medium transition-colors"
                      title={viewMode === 'grouped' ? 'Switch to list view' : 'Switch to grouped view'}
                    >
                      {viewMode === 'grouped' ? '☰ List' : '⊞ Group'}
                    </button>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors">
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {totalItems === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-sm text-gray-400 font-medium">All stock levels are healthy</p>
                    </div>
                  ) : viewMode === 'grouped' ? (
                    /* ── Grouped View ── */
                    <div className="divide-y divide-gray-100">
                      {groupedNotifications.map((mainCat) => {
                        const isCollapsed = collapsedCategories.has(mainCat.mainCategoryId);
                        const catUnread = mainCat.subCategories.reduce(
                          (t, sub) => t + sub.items.filter((i) => !readItems.has(`${i.stockId}`)).length,
                          0
                        );
                        const catTotal = mainCat.subCategories.reduce((t, sub) => t + sub.items.length, 0);

                        return (
                          <div key={mainCat.mainCategoryId}>
                            {/* Main Category Header */}
                            <button
                              onClick={() => toggleCategory(mainCat.mainCategoryId)}
                              className="w-full flex items-center justify-between px-4 py-2.5 bg-teal-50 hover:bg-teal-100/70 transition-colors text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                                  {mainCat.mainCategoryName}
                                </span>
                                <span className="text-[10px] bg-teal-200 text-teal-800 font-semibold px-1.5 py-0.5 rounded-full">
                                  {catTotal}
                                </span>
                                {catUnread > 0 && (
                                  <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                                    {catUnread} new
                                  </span>
                                )}
                              </div>
                              <svg
                                className={`h-3.5 w-3.5 text-teal-600 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Sub Categories */}
                            {!isCollapsed && (
                              <div className="divide-y divide-gray-50">
                                {mainCat.subCategories.map((sub) => {
                                  const subUnread = sub.items.filter((i) => !readItems.has(`${i.stockId}`)).length;
                                  return (
                                    <div key={sub.subCategoryId}>
                                      {/* Sub Category Label */}
                                      <div className="flex items-center gap-2 px-5 py-1.5 bg-gray-50/80">
                                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                          {sub.subCategoryName}
                                        </span>
                                        <span className="text-[10px] bg-gray-200 text-gray-600 font-medium px-1.5 py-0.5 rounded-full">
                                          {sub.items.length}
                                        </span>
                                        {subUnread > 0 && (
                                          <span className="text-[10px] bg-amber-100 text-amber-600 font-medium px-1.5 py-0.5 rounded-full">
                                            {subUnread} unread
                                          </span>
                                        )}
                                      </div>

                                      {/* Items in sub-category */}
                                      {sub.items.map((item) => {
                                        const isRead = readItems.has(`${item.stockId}`);
                                        return (
                                          <div
                                            key={item.stockId}
                                            onClick={() => markItemRead(item.stockId)}
                                            className={`flex items-start gap-3 px-5 py-2.5 cursor-pointer transition-colors ${
                                              isRead
                                                ? 'bg-white hover:bg-gray-50'
                                                : 'bg-amber-50 hover:bg-amber-100/60'
                                            }`}
                                          >
                                            <span
                                              className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                                                isRead ? 'bg-gray-300' : 'bg-amber-500'
                                              }`}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold text-gray-800 truncate">
                                                {item.itemName}
                                              </p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-gray-500">
                                                  Qty: <span className="font-semibold text-red-500">{item.qty}</span>
                                                </span>
                                                <span className="text-gray-300">·</span>
                                                <span className="text-[11px] text-gray-400">
                                                  Min: {item.lowStockAlert}
                                                </span>
                                              </div>
                                            </div>
                                            {/* Severity bar */}
                                            <div className="flex-shrink-0 flex flex-col items-end justify-center gap-0.5 mt-0.5">
                                              <div className="h-1.5 w-12 rounded-full bg-gray-200 overflow-hidden">
                                                <div
                                                  className="h-full rounded-full bg-amber-500"
                                                  style={{
                                                    width: `${Math.min(100, (item.qty / item.lowStockAlert) * 100)}%`,
                                                  }}
                                                />
                                              </div>
                                              <span className="text-[10px] text-gray-400">
                                                {Math.round((item.qty / item.lowStockAlert) * 100)}%
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── Flat / List View ── */
                    <ul className="divide-y divide-gray-50">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          onClick={() => {
                            const stockId = n.id - 10000;
                            markItemRead(stockId);
                          }}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            n.read ? 'bg-white hover:bg-gray-50' : 'bg-amber-50 hover:bg-amber-100/60'
                          }`}
                        >
                          <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${n.read ? 'bg-gray-300' : 'bg-amber-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </span>
                  <button className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors">
                    View all →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Pill */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileModal((prev) => !prev)}
              className="flex items-center space-x-2 rounded-full bg-teal-800/50 px-4 py-1.5 border border-teal-500/30 hover:bg-teal-800/70 transition-colors focus:outline-none"
            >
              <div className="h-7 w-7 rounded-full overflow-hidden bg-yellow-500 flex items-center justify-center text-teal-900 font-bold text-xs flex-shrink-0">
                {profileImage
                  ? <img src={profileImage} alt="profile" className="h-full w-full object-cover" />
                  : <span>{displayName.charAt(0).toUpperCase()}</span>
                }
              </div>
              <span className="text-white">{displayName}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileModal && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-5 py-4 flex items-center gap-3">
                  <div
                    className="h-14 w-14 rounded-full overflow-hidden bg-yellow-500 flex items-center justify-center text-teal-900 font-bold text-xl cursor-pointer border-2 border-white/40 hover:opacity-80 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to change photo"
                  >
                    {profileImage
                      ? <img src={profileImage} alt="profile" className="h-full w-full object-cover" />
                      : <span>{displayName.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{displayName}</p>
                    <p className="text-teal-200 text-xs mt-0.5 cursor-pointer hover:text-white" onClick={() => fileInputRef.current?.click()}>
                      📷 Change photo
                    </p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>

                <div className="px-5 py-4 space-y-3">
                  {profileMsg && (
                    <div className={`text-xs px-3 py-2 rounded-lg font-medium ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {profileMsg.text}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Required to change password"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}