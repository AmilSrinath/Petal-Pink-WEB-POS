// ─── POSModel ───────────────────────────────────────────────────────────────
// Shared data shapes for the POS module. Kept separate from view/controller
// code so the models can be swapped for real API types later without
// touching any component markup.

export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  mainCategory: string;
  subCategory: string;
  color: string; // fallback swatch color shown in place of a product photo
}

export interface SubCategory {
  id: string;
  label: string;
}

export interface MainCategory {
  id: string;
  label: string;
  subCategories: SubCategory[];
}

export interface CartItem {
  product: Product;
  qty: number;
}

export type QtyToggleValue = 1 | 2 | 3 | 4 | 'custom';

export interface Customer {
  mobile: string;
  name: string;
  loyaltyPoints: number;
}
