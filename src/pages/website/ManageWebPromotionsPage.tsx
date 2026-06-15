import React, { useState } from 'react';
import { PlusIcon, TagIcon, EditIcon, TrashIcon, CopyIcon } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder?: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  status: 'active' | 'expired' | 'inactive';
  appliesTo: 'all' | 'cosmetics' | 'fashion';
}

const MOCK_COUPONS: Coupon[] = [
  { id: 1, code: 'FASHION20', type: 'percentage', value: 20, minOrder: 2000, usageLimit: 100, usedCount: 34, expiryDate: '2025-07-31', status: 'active', appliesTo: 'fashion' },
  { id: 2, code: 'BEAUTY500', type: 'fixed', value: 500, minOrder: 3000, usageLimit: 50, usedCount: 50, expiryDate: '2025-05-31', status: 'expired', appliesTo: 'cosmetics' },
  { id: 3, code: 'WELCOME10', type: 'percentage', value: 10, usageLimit: 200, usedCount: 88, expiryDate: '2025-12-31', status: 'active', appliesTo: 'all' },
];

const STATUS_STYLES: Record<Coupon['status'], string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-600',
  inactive: 'bg-gray-100 text-gray-500',
};

export function ManageWebPromotionsPage() {
  const [coupons] = useState<Coupon[]>(MOCK_COUPONS);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions & Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Manage discount codes for petalpink.lk</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition-colors">
          <PlusIcon className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <div key={coupon.id} className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
            coupon.status === 'expired' ? 'opacity-60' : ''
          }`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-teal-500" />
                <button
                  onClick={() => copyCode(coupon.code)}
                  className="group flex items-center gap-1 font-mono font-bold text-gray-900 hover:text-teal-600 transition-colors"
                  title="Copy code"
                >
                  {coupon.code}
                  <CopyIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[coupon.status]}`}>
                {coupon.status}
              </span>
            </div>

            {/* Value */}
            <div className="mb-3 rounded-lg bg-teal-50 p-3 text-center">
              <p className="text-2xl font-bold text-teal-700">
                {coupon.type === 'percentage' ? `${coupon.value}%` : `LKR ${coupon.value.toLocaleString()}`}
              </p>
              <p className="text-xs text-teal-500 mt-0.5">
                {coupon.type === 'percentage' ? 'Percentage discount' : 'Fixed discount'}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs text-gray-500 mb-4">
              {coupon.minOrder && <div className="flex justify-between"><span>Min. order</span><span className="font-medium text-gray-700">LKR {coupon.minOrder.toLocaleString()}</span></div>}
              <div className="flex justify-between"><span>Applies to</span><span className={`font-medium capitalize ${
                coupon.appliesTo === 'fashion' ? 'text-purple-600'
                : coupon.appliesTo === 'cosmetics' ? 'text-pink-600'
                : 'text-gray-700'
              }`}>{coupon.appliesTo}</span></div>
              <div className="flex justify-between"><span>Expires</span><span className="font-medium text-gray-700">{coupon.expiryDate}</span></div>
              <div className="flex justify-between"><span>Usage</span>
                <span className="font-medium text-gray-700">{coupon.usedCount} / {coupon.usageLimit}</span>
              </div>
            </div>

            {/* Usage bar */}
            <div className="mb-4 h-1.5 rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-teal-500 transition-all"
                style={{ width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%` }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-teal-200 py-1.5 text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center gap-1">
                <EditIcon className="h-3 w-3" /> Edit
              </button>
              <button className="flex-1 rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                <TrashIcon className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}