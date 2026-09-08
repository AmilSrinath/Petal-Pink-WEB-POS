import { MainCategory, Product } from './posTypes';

// ─── Mock data ──────────────────────────────────────────────────────────────
// Stand-in for the real Inventory / Category API. Replace fetchProducts()
// and MAIN_CATEGORIES with live service calls when the POS module is wired
// up to the backend — the rest of the module only depends on these shapes.

export const MAIN_CATEGORIES: MainCategory[] = [
  {
    id: 'grocery',
    label: 'Grocery',
    subCategories: [
      { id: 'rice', label: 'Rice' },
      { id: 'flour', label: 'Flour' },
      { id: 'sugar', label: 'Sugar' },
      { id: 'salt', label: 'Salt' },
      { id: 'oil', label: 'Oil' },
    ],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    subCategories: [
      { id: 'soft-drinks', label: 'Soft Drinks' },
      { id: 'juice', label: 'Juice' },
      { id: 'tea', label: 'Tea' },
      { id: 'coffee', label: 'Coffee' },
      { id: 'water', label: 'Water' },
    ],
  },
  {
    id: 'dairy',
    label: 'Dairy',
    subCategories: [
      { id: 'milk', label: 'Milk' },
      { id: 'yogurt', label: 'Yogurt' },
      { id: 'cheese', label: 'Cheese' },
      { id: 'butter', label: 'Butter' },
    ],
  },
  {
    id: 'bakery',
    label: 'Bakery',
    subCategories: [
      { id: 'bread', label: 'Bread' },
      { id: 'cakes', label: 'Cakes' },
      { id: 'buns', label: 'Buns' },
    ],
  },
  {
    id: 'vegetables',
    label: 'Vegetables',
    subCategories: [
      { id: 'leafy', label: 'Leafy Greens' },
      { id: 'root', label: 'Root Veg' },
      { id: 'gourds', label: 'Gourds' },
    ],
  },
  {
    id: 'fruits',
    label: 'Fruits',
    subCategories: [
      { id: 'local', label: 'Local Fruits' },
      { id: 'imported', label: 'Imported Fruits' },
    ],
  },
  {
    id: 'household',
    label: 'Household',
    subCategories: [
      { id: 'cleaning', label: 'Cleaning' },
      { id: 'laundry', label: 'Laundry' },
      { id: 'kitchen', label: 'Kitchenware' },
    ],
  },
  {
    id: 'frozen',
    label: 'Frozen Foods',
    subCategories: [
      { id: 'frozen-meat', label: 'Frozen Meat' },
      { id: 'frozen-veg', label: 'Frozen Veg' },
      { id: 'ice-cream', label: 'Ice Cream' },
    ],
  },
  {
    id: 'personal-care',
    label: 'Personal Care',
    subCategories: [
      { id: 'skin-care', label: 'Skin Care' },
      { id: 'hair-care', label: 'Hair Care' },
      { id: 'oral-care', label: 'Oral Care' },
    ],
  },
  {
    id: 'snacks',
    label: 'Snacks',
    subCategories: [
      { id: 'biscuits', label: 'Biscuits' },
      { id: 'chips', label: 'Chips' },
      { id: 'chocolates', label: 'Chocolates' },
    ],
  },
];

const SWATCHES = ['#22c55e', '#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function swatch(seed: number) {
  return SWATCHES[seed % SWATCHES.length];
}

export const PRODUCTS: Product[] = [
  { id: 'p1', barcode: '4791234560012', name: 'Basmati Rice 5kg', price: 1850, stock: 42, mainCategory: 'grocery', subCategory: 'rice', color: swatch(1) },
  { id: 'p2', barcode: '4791234560029', name: 'Wheat Flour 1kg', price: 320, stock: 60, mainCategory: 'grocery', subCategory: 'flour', color: swatch(2) },
  { id: 'p3', barcode: '4791234560036', name: 'White Sugar 1kg', price: 285, stock: 75, mainCategory: 'grocery', subCategory: 'sugar', color: swatch(3) },
  { id: 'p4', barcode: '4791234560043', name: 'Table Salt 400g', price: 95, stock: 90, mainCategory: 'grocery', subCategory: 'salt', color: swatch(4) },
  { id: 'p5', barcode: '4791234560050', name: 'Sunflower Oil 1L', price: 990, stock: 38, mainCategory: 'grocery', subCategory: 'oil', color: swatch(5) },
  { id: 'p6', barcode: '4791234560067', name: 'Coca-Cola 1L', price: 260, stock: 120, mainCategory: 'beverages', subCategory: 'soft-drinks', color: swatch(6) },
  { id: 'p7', barcode: '4791234560074', name: 'Sprite 1L', price: 260, stock: 110, mainCategory: 'beverages', subCategory: 'soft-drinks', color: swatch(7) },
  { id: 'p8', barcode: '4791234560081', name: 'Orange Juice 1L', price: 480, stock: 40, mainCategory: 'beverages', subCategory: 'juice', color: swatch(8) },
  { id: 'p9', barcode: '4791234560098', name: 'Ceylon Tea 200g', price: 410, stock: 55, mainCategory: 'beverages', subCategory: 'tea', color: swatch(0) },
  { id: 'p10', barcode: '4791234560104', name: 'Instant Coffee 100g', price: 690, stock: 33, mainCategory: 'beverages', subCategory: 'coffee', color: swatch(1) },
  { id: 'p11', barcode: '4791234560111', name: 'Bottled Water 1.5L', price: 120, stock: 200, mainCategory: 'beverages', subCategory: 'water', color: swatch(2) },
  { id: 'p12', barcode: '4791234560128', name: 'Anchor Milk 400g', price: 990, stock: 48, mainCategory: 'dairy', subCategory: 'milk', color: swatch(3) },
  { id: 'p13', barcode: '4791234560135', name: 'Set Yogurt Cup', price: 90, stock: 150, mainCategory: 'dairy', subCategory: 'yogurt', color: swatch(4) },
  { id: 'p14', barcode: '4791234560142', name: 'Cheddar Cheese 200g', price: 850, stock: 20, mainCategory: 'dairy', subCategory: 'cheese', color: swatch(5) },
  { id: 'p15', barcode: '4791234560159', name: 'Salted Butter 200g', price: 620, stock: 25, mainCategory: 'dairy', subCategory: 'butter', color: swatch(6) },
  { id: 'p16', barcode: '4791234560166', name: 'White Bread Loaf', price: 180, stock: 65, mainCategory: 'bakery', subCategory: 'bread', color: swatch(7) },
  { id: 'p17', barcode: '4791234560173', name: 'Chocolate Cake Slice', price: 350, stock: 15, mainCategory: 'bakery', subCategory: 'cakes', color: swatch(8) },
  { id: 'p18', barcode: '4791234560180', name: 'Butter Buns (4pk)', price: 240, stock: 44, mainCategory: 'bakery', subCategory: 'buns', color: swatch(0) },
  { id: 'p19', barcode: '4791234560197', name: 'Cabbage (1kg)', price: 160, stock: 30, mainCategory: 'vegetables', subCategory: 'leafy', color: swatch(1) },
  { id: 'p20', barcode: '4791234560203', name: 'Carrot (1kg)', price: 220, stock: 35, mainCategory: 'vegetables', subCategory: 'root', color: swatch(2) },
  { id: 'p21', barcode: '4791234560210', name: 'Pumpkin (1kg)', price: 140, stock: 28, mainCategory: 'vegetables', subCategory: 'gourds', color: swatch(3) },
  { id: 'p22', barcode: '4791234560227', name: 'Banana (1kg)', price: 210, stock: 50, mainCategory: 'fruits', subCategory: 'local', color: swatch(4) },
  { id: 'p23', barcode: '4791234560234', name: 'Apple - Imported (1kg)', price: 650, stock: 22, mainCategory: 'fruits', subCategory: 'imported', color: swatch(5) },
  { id: 'p24', barcode: '4791234560241', name: 'Dish Wash Liquid 500ml', price: 320, stock: 40, mainCategory: 'household', subCategory: 'cleaning', color: swatch(6) },
  { id: 'p25', barcode: '4791234560258', name: 'Laundry Powder 1kg', price: 480, stock: 36, mainCategory: 'household', subCategory: 'laundry', color: swatch(7) },
  { id: 'p26', barcode: '4791234560265', name: 'Frozen Chicken 1kg', price: 1250, stock: 18, mainCategory: 'frozen', subCategory: 'frozen-meat', color: swatch(8) },
  { id: 'p27', barcode: '4791234560272', name: 'Vanilla Ice Cream 1L', price: 780, stock: 20, mainCategory: 'frozen', subCategory: 'ice-cream', color: swatch(0) },
  { id: 'p28', barcode: '4791234560289', name: 'Shampoo 200ml', price: 540, stock: 30, mainCategory: 'personal-care', subCategory: 'hair-care', color: swatch(1) },
  { id: 'p29', barcode: '4791234560296', name: 'Toothpaste 120g', price: 310, stock: 55, mainCategory: 'personal-care', subCategory: 'oral-care', color: swatch(2) },
  { id: 'p30', barcode: '4791234560302', name: 'Cream Biscuits 200g', price: 210, stock: 70, mainCategory: 'snacks', subCategory: 'biscuits', color: swatch(3) },
  { id: 'p31', barcode: '4791234560319', name: 'Potato Chips 90g', price: 190, stock: 80, mainCategory: 'snacks', subCategory: 'chips', color: swatch(4) },
  { id: 'p32', barcode: '4791234560326', name: 'Milk Chocolate Bar', price: 260, stock: 65, mainCategory: 'snacks', subCategory: 'chocolates', color: swatch(5) },
];
