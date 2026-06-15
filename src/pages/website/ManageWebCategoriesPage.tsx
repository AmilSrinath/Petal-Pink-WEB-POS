import React, { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, ChevronRightIcon } from 'lucide-react';

type CatType = 'cosmetics' | 'fashion';

interface WebCategory {
  id: number;
  name: string;
  type: CatType;
  slug: string;
  productCount: number;
  status: 'active' | 'inactive';
  sortOrder: number;
}

const MOCK_CATEGORIES: WebCategory[] = [
  { id: 1, name: 'Lips', type: 'cosmetics', slug: 'lips', productCount: 24, status: 'active', sortOrder: 1 },
  { id: 2, name: 'Face', type: 'cosmetics', slug: 'face', productCount: 18, status: 'active', sortOrder: 2 },
  { id: 3, name: 'Eyes', type: 'cosmetics', slug: 'eyes', productCount: 31, status: 'active', sortOrder: 3 },
  { id: 4, name: 'Skincare', type: 'cosmetics', slug: 'skincare', productCount: 15, status: 'active', sortOrder: 4 },
  { id: 5, name: 'Shirts', type: 'fashion', slug: 'shirts', productCount: 8, status: 'active', sortOrder: 1 },
  { id: 6, name: 'Bottoms', type: 'fashion', slug: 'bottoms', productCount: 5, status: 'active', sortOrder: 2 },
  { id: 7, name: 'Dresses', type: 'fashion', slug: 'dresses', productCount: 3, status: 'inactive', sortOrder: 3 },
  { id: 8, name: 'Accessories', type: 'fashion', slug: 'accessories', productCount: 0, status: 'inactive', sortOrder: 4 },
];

export function ManageWebCategoriesPage() {
  const [activeTab, setActiveTab] = useState<CatType>('cosmetics');
  const [categories] = useState<WebCategory[]>(MOCK_CATEGORIES);

  const filtered = categories.filter((c) => c.type === activeTab);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories shown on petalpink.lk</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition-colors">
          <PlusIcon className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {(['cosmetics', 'fashion'] as CatType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
              activeTab === tab ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {categories.filter(c => c.type === tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                cat.type === 'cosmetics' ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'
              }`}>
                {cat.name[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-400">/{cat.slug} · {cat.productCount} products</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                cat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {cat.status}
              </span>
              <button className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50 transition-colors">
                <EditIcon className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Add new placeholder */}
        <button className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-colors">
          <PlusIcon className="h-5 w-5" />
          <span className="text-sm font-medium">New {activeTab} category</span>
        </button>
      </div>
    </div>
  );
}