import React, { useEffect, useMemo, useRef, useState } from 'react';
import { XIcon, UserIcon, PhoneIcon, StarIcon } from 'lucide-react';
import { BarcodeSearch } from '../components/pos/BarcodeSearch';
import { QuantityTogglePanel } from '../components/pos/QuantityTogglePanel';
import { CategoryPanel } from '../components/pos/CategoryPanel';
import { ProductCard } from '../components/pos/ProductCard';
import { CartTable } from '../components/pos/CartTable';
import { MAIN_CATEGORIES, PRODUCTS } from '../components/pos/posData';
import { CartItem, Customer, Product, QtyToggleValue } from '../components/pos/posTypes';

const TAX_RATE = 0.0; // supermarket essentials are commonly zero-rated; adjust per business rules
const CASHIER_NAME = 'Cashier 01';

function generateInvoiceNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now
    .getDate()
    .toString()
    .padStart(2, '0')}`;
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `INV-${stamp}-${seq}`;
}

interface POSPageProps {
  cashierName?: string;
}

// ─── POSView + POSController ───────────────────────────────────────────────
// Single-file container for the POS screen. Owns all POS state (search,
// quantity toggle, category filters, cart, customer, discount) and composes
// the presentational pieces (BarcodeSearch, QuantityTogglePanel,
// CategoryPanel, ProductCard grid, CartTable). Kept as one controller so the
// data flow for "select qty -> tap product -> update cart" stays easy to
// follow; each piece of UI below it remains a plain, reusable component.
export function POSPage({ cashierName = CASHIER_NAME }: POSPageProps) {
  const [now, setNow] = useState(new Date());
  const [invoiceNumber] = useState(generateInvoiceNumber);

  const [searchTerm, setSearchTerm] = useState('');
  const [qtyToggle, setQtyToggle] = useState<QtyToggleValue>(1);
  const [customQty, setCustomQty] = useState(1);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [qtyModalInput, setQtyModalInput] = useState('1');

  const [activeMain, setActiveMain] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const [customer, setCustomer] = useState<Customer>({ mobile: '', name: '', loyaltyPoints: 0 });

  const qtyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showQtyModal) {
      setTimeout(() => qtyInputRef.current?.focus(), 0);
    }
  }, [showQtyModal]);

  const effectiveQty = qtyToggle === 'custom' ? customQty : qtyToggle;

  const handleSelectQtyToggle = (value: QtyToggleValue) => {
    if (value === 'custom') {
      setQtyModalInput(String(customQty || 1));
      setShowQtyModal(true);
      return;
    }
    setQtyToggle(value);
  };

  const confirmQtyModal = () => {
    const parsed = parseInt(qtyModalInput, 10);
    const safeQty = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    setCustomQty(safeQty);
    setQtyToggle('custom');
    setShowQtyModal(false);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + effectiveQty } : item
        );
      }
      return [...prev, { product, qty: effectiveQty }];
    });
  };

  const incrementItem = (productId: string) => {
    setCart((prev) => prev.map((item) => (item.product.id === productId ? { ...item, qty: item.qty + 1 } : item)));
  };

  const decrementItem = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleBarcodeSubmit = (term: string) => {
    const byBarcode = PRODUCTS.find((p) => p.barcode === term);
    if (byBarcode) {
      addToCart(byBarcode);
      setSearchTerm('');
      return;
    }
    const byName = PRODUCTS.find((p) => p.name.toLowerCase() === term.toLowerCase());
    if (byName) {
      addToCart(byName);
      setSearchTerm('');
    }
  };

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (activeMain && p.mainCategory !== activeMain) return false;
      if (activeSub && p.subCategory !== activeSub) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
      }
      return true;
    });
  }, [activeMain, activeSub, searchTerm]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const tax = subtotal * TAX_RATE;
  const grandTotal = Math.max(0, subtotal - discount + tax);

  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 font-sans">
      {/* ── POS top bar ── */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <h1 className="text-lg font-bold text-green-700">POS — Checkout</h1>
        <div className="flex items-center gap-6 text-xs font-medium text-gray-500">
          <span>{dateStr}</span>
          <span className="font-mono">{timeStr}</span>
          <span>
            Cashier: <span className="font-semibold text-gray-700">{cashierName}</span>
          </span>
          <span className="rounded-full bg-green-50 px-3 py-1 font-mono text-green-700">{invoiceNumber}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL (Product Area) — 75% ── */}
        <div className="flex w-[75%] flex-col gap-3 overflow-hidden p-4">
          <BarcodeSearch value={searchTerm} onChange={setSearchTerm} onSubmit={handleBarcodeSubmit} />

          {/* <QuantityTogglePanel selected={qtyToggle} customQty={customQty} onSelect={handleSelectQtyToggle} /> */}

          <CategoryPanel
            categories={MAIN_CATEGORIES}
            activeMain={activeMain}
            activeSub={activeSub}
            onSelectMain={(id) => setActiveMain(id || null)}
            onSelectSub={setActiveSub}
          />

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {filteredProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No products match your search
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 pb-4 xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
          <QuantityTogglePanel selected={qtyToggle} customQty={customQty} onSelect={handleSelectQtyToggle} />
        </div>

        {/* ── RIGHT PANEL (Cart) — 25% ── */}
        <div className="flex w-[25%] flex-col border-l border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-base font-bold text-gray-800">Shopping Cart</h2>

          <CartTable items={cart} onIncrement={incrementItem} onDecrement={decrementItem} onRemove={removeItem} />

          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-700">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-gray-500">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <span>Rs.</span>
                <input
                  type="number"
                  min={0}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-20 rounded-md border border-gray-200 px-2 py-1 text-right text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span className="font-medium text-gray-700">Rs. {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold text-gray-900">
              <span>Grand Total</span>
              <span className="text-green-700">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer (optional)</p>
            <div className="relative">
              <PhoneIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-300" />
              <input
                type="text"
                value={customer.mobile}
                onChange={(e) => setCustomer((c) => ({ ...c, mobile: e.target.value }))}
                placeholder="Mobile number"
                className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-300" />
              <input
                type="text"
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                placeholder="Customer name"
                className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            {customer.loyaltyPoints > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <StarIcon className="h-3.5 w-3.5" />
                {customer.loyaltyPoints} loyalty points
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <button
              disabled={cart.length === 0}
              className="w-full rounded-xl bg-green-600 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              PAY NOW
            </button>
            <button
              disabled={cart.length === 0}
              className="w-full rounded-xl bg-gray-200 py-3 text-base font-bold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              HOLD BILL
            </button>
          </div>
        </div>
      </div>

      {/* ── Enter Qty modal ── */}
      {showQtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Enter Quantity</h3>
              <button onClick={() => setShowQtyModal(false)} className="text-gray-400 hover:text-gray-600">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={qtyInputRef}
              type="number"
              min={1}
              value={qtyModalInput}
              onChange={(e) => setQtyModalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmQtyModal()}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-lg font-semibold focus:border-green-500 focus:outline-none"
            />
            <button
              onClick={confirmQtyModal}
              className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-bold text-white hover:bg-green-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
