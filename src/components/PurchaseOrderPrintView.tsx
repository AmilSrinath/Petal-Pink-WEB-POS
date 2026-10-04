import React, { forwardRef } from 'react';

export interface PurchaseOrderItemPrint {
  itemName: string;
  unitType?: string;
  qty: number;
  expectedPrice: number;
  lastGrnPrice?: number;
  totalPrice: number;
}

export interface PurchaseOrderPrintData {
  poNumber: string;
  poDate: string;
  expectedDate?: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierAddress?: string;
  salesmanName?: string;
  paymentType?: string;
  statusLabel?: string;
  totalPrice: number;
  items: PurchaseOrderItemPrint[];
}

export const exportPoToPdf = async (element: HTMLElement, filename: string): Promise<void> => {
  const html2pdf = (await import('html2pdf.js')).default;
  const originalStyle = element.getAttribute('style') || '';
  element.style.width = '794px';
  element.style.minHeight = 'auto';

  const options = {
    margin: [10, 10, 10, 10], // top, right, bottom, left in mm
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width: 794,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
  };

  try {
    await html2pdf().set(options).from(element).save();
  } finally {
    element.setAttribute('style', originalStyle);
  }
};

export const PurchaseOrderPrintView = forwardRef<
  HTMLDivElement,
  { order: PurchaseOrderPrintData; className?: string }
>(({ order, className = '' }, ref) => {
  const totalQuantity = order.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  return (
    <div
      ref={ref}
      className={`bg-white p-8 border border-gray-200 rounded-lg shadow-sm text-gray-800 ${className}`}
      style={{ width: '794px', minWidth: '794px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-teal-700 pb-5 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wider text-teal-800 uppercase">
            PETAL PINK (PVT) LTD
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Premium Beauty Care & Cosmetics</p>
          <p className="text-xs text-gray-500">Procurement & Inventory Management Department</p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-semibold">Hotline:</span> +94 11 234 5678 / +94 77 123 4567 | <span className="font-semibold">Email:</span> purchase@petalpink.lk
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-teal-800 text-white px-3 py-1 rounded text-xs font-bold tracking-wider uppercase mb-2">
            PURCHASE ORDER
          </span>
          <p className="text-base font-bold text-gray-900 font-mono">{order.poNumber}</p>
          <p className="text-xs text-gray-600 mt-1">
            Order Date: <span className="font-semibold text-gray-900">{order.poDate}</span>
          </p>
          <p className="text-xs text-gray-600">
            Expected Date: <span className="font-semibold text-teal-700">{order.expectedDate || 'Immediate'}</span>
          </p>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-5 text-xs">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Vendor / Supplier Information
          </div>
          <p className="font-bold text-gray-900 text-sm">{order.supplierName}</p>
          {order.salesmanName && (
            <p className="text-gray-600 mt-0.5"><span className="font-medium text-gray-700">Contact Person:</span> {order.salesmanName}</p>
          )}
          {order.supplierPhone && (
            <p className="text-gray-600"><span className="font-medium text-gray-700">Phone:</span> {order.supplierPhone}</p>
          )}
          {order.supplierEmail && (
            <p className="text-gray-600"><span className="font-medium text-gray-700">Email:</span> {order.supplierEmail}</p>
          )}
          {order.supplierAddress && (
            <p className="text-gray-600"><span className="font-medium text-gray-700">Address:</span> {order.supplierAddress}</p>
          )}
        </div>

        <div className="text-right space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Order Summary Details
          </div>
          <p className="text-gray-600">
            Payment Terms: <span className="font-bold text-gray-900">{order.paymentType || 'Cash'}</span>
          </p>
          {order.statusLabel && (
            <p className="text-gray-600">
              Status: <span className="font-bold text-amber-600">{order.statusLabel}</span>
            </p>
          )}
          <p className="text-gray-600">
            Currency: <span className="font-bold text-gray-900">Sri Lankan Rupee (LKR)</span>
          </p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-xs text-left border-collapse mb-5">
        <thead>
          <tr className="bg-teal-700 text-white font-semibold">
            <th className="py-2.5 px-3 border border-teal-700 text-center w-10">#</th>
            <th className="py-2.5 px-3 border border-teal-700">Item Description</th>
            <th className="py-2.5 px-3 border border-teal-700 text-center w-20">Unit</th>
            <th className="py-2.5 px-3 border border-teal-700 text-right w-20">Qty</th>
            <th className="py-2.5 px-3 border border-teal-700 text-right w-28">Unit Price (Rs.)</th>
            <th className="py-2.5 px-3 border border-teal-700 text-right w-32">Total Amount (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-2 px-3 border border-gray-200 text-center font-medium">{idx + 1}</td>
              <td className="py-2 px-3 border border-gray-200 font-medium text-gray-900">
                {item.itemName}
              </td>
              <td className="py-2 px-3 border border-gray-200 text-center text-gray-600 font-medium">
                {item.unitType || 'Unit'}
              </td>
              <td className="py-2 px-3 border border-gray-200 text-right font-semibold text-gray-900">
                {item.qty}
              </td>
              <td className="py-2 px-3 border border-gray-200 text-right font-mono">
                {Number(item.expectedPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-3 border border-gray-200 text-right font-bold text-gray-900 font-mono">
                {Number(item.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Instructions & Summary */}
      <div className="flex justify-between items-start mb-6">
        <div className="text-[11px] text-gray-500 max-w-sm space-y-1">
          <p className="font-bold text-gray-700 uppercase tracking-wider">Terms & Instructions:</p>
          <p>1. Please deliver items on or before the specified expected delivery date.</p>
          <p>2. A copy of this Purchase Order must accompany the delivery invoice.</p>
          <p>3. Goods received in expired, damaged, or unapproved quality will be rejected.</p>
          <p>4. All invoices must clearly mention the Purchase Order Number above.</p>
        </div>

        <div className="w-64 bg-gray-50 p-3 rounded border border-gray-200 text-xs space-y-1.5">
          <div className="flex justify-between text-gray-600">
            <span>Total Line Items:</span>
            <span className="font-bold text-gray-900">{order.items.length}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total Units / Quantity:</span>
            <span className="font-bold text-gray-900">{totalQuantity}</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-teal-700 text-sm font-bold">
            <span className="text-teal-900">Grand Total:</span>
            <span className="text-teal-900 font-mono">
              Rs. {Number(order.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 text-center text-xs">
        <div>
          <div className="border-t border-gray-400 w-36 mx-auto mb-1"></div>
          <p className="font-semibold text-gray-800">Prepared By</p>
          <p className="text-[10px] text-gray-400">Purchasing Officer</p>
        </div>
        <div>
          <div className="border-t border-gray-400 w-36 mx-auto mb-1"></div>
          <p className="font-semibold text-gray-800">Authorized By</p>
          <p className="text-[10px] text-gray-400">Operations Manager</p>
        </div>
        <div>
          <div className="border-t border-gray-400 w-36 mx-auto mb-1"></div>
          <p className="font-semibold text-gray-800">Vendor Acceptance</p>
          <p className="text-[10px] text-gray-400">Signature & Company Seal</p>
        </div>
      </div>
    </div>
  );
});

PurchaseOrderPrintView.displayName = 'PurchaseOrderPrintView';
