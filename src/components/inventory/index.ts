// Export all inventory components
export { FormField } from './InventoryFormField';
export { FormSelect } from './FormSelect';
export { StatusBadge } from './StatusBadge';
export { InventoryCard } from './InventoryCard';
export { FormButtons } from './FormButtons';

// Export utilities
export {
  statusColorMap,
  getStatusColor,
  formatCurrency,
  formatDate,
  generateId,
  getStockLevel,
  calculateTotal,
  validateEmail,
  validatePhone,
} from './inventoryUtils';
