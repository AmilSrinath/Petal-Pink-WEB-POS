const BASE_URL = 'http://localhost:8080/api';
 
export const api = {
  // Suppliers
  getSuppliers: () => fetch(`${BASE_URL}/suppliers`).then(r => r.json()),
  createSupplier: (dto: any) => fetch(`${BASE_URL}/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateSupplier: (dto: any) => fetch(`${BASE_URL}/suppliers`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteSupplier: (id: number) => fetch(`${BASE_URL}/suppliers/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Stock Categories
  getStockCategories: () => fetch(`${BASE_URL}/stock-categories`).then(r => r.json()),
  createStockCategory: (dto: any) => fetch(`${BASE_URL}/stock-categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateStockCategory: (dto: any) => fetch(`${BASE_URL}/stock-categories`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteStockCategory: (id: number) => fetch(`${BASE_URL}/stock-categories/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Stocks
  getStocks: () => fetch(`${BASE_URL}/stocks`).then(r => r.json()),
  createStock: (dto: any) => fetch(`${BASE_URL}/stocks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateStock: (dto: any) => fetch(`${BASE_URL}/stocks`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteStock: (id: number) => fetch(`${BASE_URL}/stocks/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // GRN
  getGrns: () => fetch(`${BASE_URL}/grn`).then(r => r.json()),
  createGrn: (dto: any) => fetch(`${BASE_URL}/grn`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateGrn: (dto: any) => fetch(`${BASE_URL}/grn`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteGrn: (id: number) => fetch(`${BASE_URL}/grn/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Purchase Orders
  getPurchaseOrders: () => fetch(`${BASE_URL}/purchase-orders`).then(r => r.json()),
  createPurchaseOrder: (dto: any) => fetch(`${BASE_URL}/purchase-orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updatePurchaseOrder: (dto: any) => fetch(`${BASE_URL}/purchase-orders`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deletePurchaseOrder: (id: number) => fetch(`${BASE_URL}/purchase-orders/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Purchase Order Details
  getPurchaseOrderDetails: () => fetch(`${BASE_URL}/purchase-order-details`).then(r => r.json()),
  getPurchaseOrderDetailsByPoId: (poId: number) => fetch(`${BASE_URL}/purchase-order-details/by-po/${poId}`).then(r => r.json()),
  createPurchaseOrderDetails: (dto: any) => fetch(`${BASE_URL}/purchase-order-details`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updatePurchaseOrderDetails: (dto: any) => fetch(`${BASE_URL}/purchase-order-details`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deletePurchaseOrderDetails: (id: number) => fetch(`${BASE_URL}/purchase-order-details/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Item Store Templates
  getItemStoreTemplates: () => fetch(`${BASE_URL}/item-store-templates`).then(r => r.json()),
  createItemStoreTemplate: (dto: any) => fetch(`${BASE_URL}/item-store-templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateItemStoreTemplate: (dto: any) => fetch(`${BASE_URL}/item-store-templates`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteItemStoreTemplate: (id: number) => fetch(`${BASE_URL}/item-store-templates/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Main Table Locations
  getMainTableLocations: () => fetch(`${BASE_URL}/main-table-locations`).then(r => r.json()),
  createMainTableLocation: (dto: any) => fetch(`${BASE_URL}/main-table-locations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateMainTableLocation: (dto: any) => fetch(`${BASE_URL}/main-table-locations`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteMainTableLocation: (id: number) => fetch(`${BASE_URL}/main-table-locations/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Sub Table Locations
  getSubTableLocations: () => fetch(`${BASE_URL}/sub-table-locations`).then(r => r.json()),
  getSubTableLocationsByMainId: (mainId: number) => fetch(`${BASE_URL}/sub-table-locations/by-main/${mainId}`).then(r => r.json()),
  createSubTableLocation: (dto: any) => fetch(`${BASE_URL}/sub-table-locations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateSubTableLocation: (dto: any) => fetch(`${BASE_URL}/sub-table-locations`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteSubTableLocation: (id: number) => fetch(`${BASE_URL}/sub-table-locations/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Config Table Locations
  getConfigTableLocations: () => fetch(`${BASE_URL}/config-table-locations`).then(r => r.json()),
  createConfigTableLocation: (dto: any) => fetch(`${BASE_URL}/config-table-locations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateConfigTableLocation: (dto: any) => fetch(`${BASE_URL}/config-table-locations`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteConfigTableLocation: (id: number) => fetch(`${BASE_URL}/config-table-locations/${id}`, { method: 'DELETE' }).then(r => r.text()),
 
  // Config Table Details
  getConfigTableDetails: () => fetch(`${BASE_URL}/config-table-details`).then(r => r.json()),
  getConfigTableDetailsByConfigId: (configId: number) => fetch(`${BASE_URL}/config-table-details/by-config/${configId}`).then(r => r.json()),
  createConfigTableDetails: (dto: any) => fetch(`${BASE_URL}/config-table-details`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  updateConfigTableDetails: (dto: any) => fetch(`${BASE_URL}/config-table-details`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) }).then(r => r.text()),
  deleteConfigTableDetails: (id: number) => fetch(`${BASE_URL}/config-table-details/${id}`, { method: 'DELETE' }).then(r => r.text()),
};
