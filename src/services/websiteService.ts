import { API_BASE_URL } from '../config';

const BASE = `${API_BASE_URL}/api/website`;

// ─── helpers ────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function putForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── types ───────────────────────────────────────────────────────────────────

export interface WsBanner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  createdDate: string;
  userId: number;
}

export interface WsProduct {
  productId: number;
  productName: string;
  unitType: string;
  productPrice: number;
  quantity: number;
  discount: number;
  status: number;
  imageUrl: string;
  imageUrl2: string;
  imageUrl3: string;
  businessName: string;
  description: string;
  keyPoints: string;
  faq: string;
  howToUse: string;
  weight: number;
}

export interface WsOrder {
  orderId: string;
  createdDate: string;
  payment: string;
  total: number;
  delivery: number;
  subTotal: number;
  orderStatus: string;
  trackingNumber: string;
}

export interface WsOrderDetails extends WsOrder {
  cusId: number;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  email: string;
  phone1: string;
  phone2: string;
  province: string;
  country: string;
}

export interface WsOrderItem {
  productName: string;
  quantity: number;
  price: number;
  subTotal: number;
  imageUrl: string;
}

export interface WsCustomer {
  cusId: number;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  phone1: string;
  email: string;
  createdDate: string;
}

export interface WsComment {
  commentId: number;
  content: string;
  clientImg: string;
  clientName: string;
  userId: number;
}

export interface WsConfig {
  configId: number;
  configName: string;
  configValue: string;
  createdDate: string;
  status: number;
  userId: number;
}

export interface WsUser {
  userId: string;
  employeeId: string;
  email: string;
  name: string;
  nic: string;
  role: string;
  status: number;
  visible: number;
  imageUrl: string;
}

export interface WsDashboard {
  totalOrders: number;
  totalCustomers: number;
  todaySales: number;
  pendingOrders: number;
  monthlySales: number[];
}

// ─── BANNERS ─────────────────────────────────────────────────────────────────
export const bannerApi = {
  getAll: () => get<{ banners: WsBanner[] }>('/banner/all').then(r => r.banners),
  save: (form: FormData) => postForm<{ banner_id: number }>('/banner/save', form),
  update: (id: number, form: FormData) => putForm<{ message: string }>(`/banner/${id}`, form),
  delete: (id: number) => del<{ message: string }>(`/banner/${id}`),
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: () => get<WsProduct[]>('/product/all'),
  getById: (id: number) => get<WsProduct>(`/product/${id}`),
  save: (form: FormData) => postForm<{ message: string }>('/product/save', form),
  update: (form: FormData) => putForm<{ message: string }>('/product/update', form),
  delete: (id: number) => del<{ message: string }>(`/product/${id}`),
};

// ─── ORDERS ──────────────────────────────────────────────────────────────────
export const orderApi = {
  getAll: () => get<WsOrder[]>('/order/all'),
  getDetails: (orderId: string) =>
    get<{ order: WsOrderDetails; items: WsOrderItem[] }>(`/order/details/${orderId}`),
  updateStatus: (orderId: string, order_status: string) =>
    put<{ message: string }>(`/order/status/${orderId}`, { order_status }),
  updateTracking: (orderId: string, tracking_number: string) =>
    put<{ message: string }>(`/order/tracking/${orderId}`, { orderId, tracking_number }),
  getTodaySales: () => get<{ todaySales: number }>('/order/today-sales'),
  getYearSales: () => get<{ monthlySales: number[] }>('/order/year-sales'),
};

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
export const customerApi = {
  getAll: () => get<WsCustomer[]>('/customer/all'),
  getCount: () => get<{ totalCustomers: number }>('/customer/count'),
};

// ─── COMMENTS ────────────────────────────────────────────────────────────────
export const commentApi = {
  getAll: () => get<{ comments: WsComment[] }>('/comment/all').then(r => r.comments),
  add: (form: FormData) => postForm<{ comment_id: number }>('/comment/add', form),
  update: (id: number, form: FormData) => putForm<{ message: string }>(`/comment/${id}`, form),
  delete: (id: number) => del<{ message: string }>(`/comment/${id}`),
};

// ─── CONFIGS ─────────────────────────────────────────────────────────────────
export const configApi = {
  getAll: () => post<{ configs: WsConfig[] }>('/config/all', {}).then(r => r.configs),
  save: (configName: string, configValue: string, userId: number) =>
    post<{ config_id: number }>('/config/save', { configName, configValue, userId }),
};

// ─── BUSINESS PROFILES ───────────────────────────────────────────────────────
export const businessProfileApi = {
  getAll: () => get<{ configs: any[] }>('/business-profile/all').then(r => r.configs),
  create: (businessName: string, description: string) =>
    post<{ business_id: number }>('/business-profile/create', { businessName, description }),
  update: (id: number, businessName: string, description: string) =>
    put<{ message: string }>(`/business-profile/${id}`, { businessName, description }),
  delete: (id: number) => del<{ message: string }>(`/business-profile/${id}`),
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export const wsUserApi = {
  getAll: () => get<WsUser[]>('/user/all'),
  getByEmail: (email: string) => get<WsUser>(`/user/${encodeURIComponent(email)}`),
  save: (form: FormData) => postForm<{ message: string }>('/user/save', form),
  update: (userId: string, data: Partial<WsUser>) =>
    put<{ message: string }>(`/user/${userId}`, data),
  delete: (userId: string) => del<{ message: string }>(`/user/${userId}`),
  forgotPassword: (email: string) =>
    post<{ message: string }>('/user/forgot-password', { email }),
  resetPassword: (email: string, password: string, code: string) =>
    put<{ message: string }>('/user/reset-password', { email, password, code }),
  updatePassword: (email: string, password: string) =>
    put<{ message: string }>(`/user/update-password/${encodeURIComponent(email)}`, { password }),
};

// ─── DASHBOARD aggregate ─────────────────────────────────────────────────────
export async function fetchWebsiteDashboard(): Promise<WsDashboard> {
  const [countRes, todayRes, yearRes, ordersRes] = await Promise.all([
    customerApi.getCount(),
    orderApi.getTodaySales(),
    orderApi.getYearSales(),
    orderApi.getAll(),
  ]);

  const orders = ordersRes as WsOrder[];
  const pendingOrders = orders.filter(o => o.orderStatus === 'Pending').length;

  return {
    totalOrders: orders.length,
    totalCustomers: countRes.totalCustomers,
    todaySales: todayRes.todaySales,
    pendingOrders,
    monthlySales: yearRes.monthlySales,
  };
}