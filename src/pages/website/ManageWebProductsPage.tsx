import React, { useState } from 'react';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, TagIcon, ShirtIcon } from 'lucide-react';

type ProductCategory = 'cosmetics' | 'fashion';

interface WebProduct {
  id: number;
  name: string;
  category: ProductCategory;
  subCategory: string;
  price: number;
  salePrice?: number;
  stock: number;
  status: 'active' | 'inactive';
  image?: string;
}

const MOCK_PRODUCTS: WebProduct[] = [
  { id: 1, name: 'Matte Lipstick - Rose', category: 'cosmetics', subCategory: 'Lips', price: 1200, salePrice: 950, stock: 45, status: 'active' },
  { id: 2, name: 'Foundation SPF 30', category: 'cosmetics', subCategory: 'Face', price: 2400, stock: 20, status: 'active' },
  { id: 3, name: 'Floral Print Shirt - S', category: 'fashion', subCategory: 'Shirts', price: 3500, salePrice: 2800, stock: 12, status: 'active' },
  { id: 4, name: 'Slim Fit Jeans - M', category: 'fashion', subCategory: 'Bottoms', price: 4200, stock: 8, status: 'inactive' },
];

export function ManageWebProductsPage() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [products] = useState<WebProduct[]>(MOCK_PRODUCTS);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage products displayed on petalpink.lk</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition-colors">
          <PlusIcon className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'cosmetics', 'fashion'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                filterCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Products', value: products.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Cosmetics', value: products.filter(p => p.category === 'cosmetics').length, color: 'bg-pink-50 text-pink-700' },
          { label: 'Fashion', value: products.filter(p => p.category === 'fashion').length, color: 'bg-purple-50 text-purple-700' },
          { label: 'Active', value: products.filter(p => p.status === 'active').length, color: 'bg-green-50 text-green-700' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Sub Category</th>
              <th className="px-4 py-3 text-right">Price (LKR)</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    product.category === 'cosmetics'
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {product.category === 'fashion' ? <ShirtIcon className="h-3 w-3" /> : <TagIcon className="h-3 w-3" />}
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{product.subCategory}</td>
                <td className="px-4 py-3 text-right">
                  <div>
                    <span className={product.salePrice ? 'line-through text-gray-400 text-xs' : 'font-medium'}>
                      {product.price.toLocaleString()}
                    </span>
                    {product.salePrice && (
                      <span className="block font-medium text-teal-600">{product.salePrice.toLocaleString()}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={product.stock < 10 ? 'text-red-600 font-medium' : 'text-gray-700'}>{product.stock}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    product.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button className="rounded-md p-1.5 text-teal-600 hover:bg-teal-50 transition-colors" title="Edit">
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}