import React, { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, ImageIcon, EyeIcon, EyeOffIcon } from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  link?: string;
  position: 'hero' | 'promo' | 'sidebar';
  status: 'active' | 'inactive';
  sortOrder: number;
}

const MOCK_BANNERS: Banner[] = [
  { id: 1, title: 'Summer Collection 2025', subtitle: 'New fashion arrivals', link: '/collections/summer', position: 'hero', status: 'active', sortOrder: 1 },
  { id: 2, title: 'Cosmetics Sale 20% Off', subtitle: 'Limited time offer', link: '/sale/cosmetics', position: 'promo', status: 'active', sortOrder: 2 },
  { id: 3, title: 'Fashion Week Special', link: '/fashion', position: 'hero', status: 'inactive', sortOrder: 3 },
];

const POSITION_COLORS: Record<Banner['position'], string> = {
  hero: 'bg-blue-100 text-blue-700',
  promo: 'bg-yellow-100 text-yellow-700',
  sidebar: 'bg-gray-100 text-gray-600',
};

export function ManageWebBannersPage() {
  const [banners] = useState<Banner[]>(MOCK_BANNERS);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage and promotional banners on petalpink.lk</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition-colors">
          <PlusIcon className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      <div className="grid gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Placeholder image */}
            <div className="h-16 w-28 flex-shrink-0 rounded-lg bg-gradient-to-br from-teal-100 to-pink-100 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-teal-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${POSITION_COLORS[banner.position]}`}>
                  {banner.position}
                </span>
              </div>
              {banner.subtitle && <p className="text-sm text-gray-500 mt-0.5 truncate">{banner.subtitle}</p>}
              {banner.link && <p className="text-xs text-teal-600 mt-0.5 truncate">{banner.link}</p>}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                banner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {banner.status}
              </span>
              <div className="flex gap-1">
                <button className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 transition-colors" title="Toggle visibility">
                  {banner.status === 'active' ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
                </button>
                <button className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50 transition-colors" title="Edit">
                  <EditIcon className="h-4 w-4" />
                </button>
                <button className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}