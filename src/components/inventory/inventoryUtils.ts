// Status color mappings
export const statusColorMap: Record<string, string> = {
  'Active': 'bg-green-100 text-green-800',
  'Inactive': 'bg-gray-100 text-gray-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Confirmed': 'bg-blue-100 text-blue-800',
  'Delivered': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800',
  'Verified': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-green-100 text-green-800',
  'Optimal': 'bg-green-100 text-green-800',
  'Low': 'bg-yellow-100 text-yellow-800',
  'Critical': 'bg-red-100 text-red-800',
  'Overstock': 'bg-purple-100 text-purple-800',
  'Available': 'bg-green-100 text-green-800',
  'Full': 'bg-red-100 text-red-800',
  'Reserved': 'bg-yellow-100 text-yellow-800',
  'Occupied': 'bg-red-100 text-red-800',
};

// Get status color
export const getStatusColor = (status: string): string => {
  return statusColorMap[status] || 'bg-gray-100 text-gray-800';
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

// Format date
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN');
};

// Generate ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Stock level indicator
export const getStockLevel = (current: number, reorderLevel: number): 'Critical' | 'Low' | 'Optimal' => {
  const percentage = (current / reorderLevel) * 100;
  if (percentage <= 25) return 'Critical';
  if (percentage <= 50) return 'Low';
  return 'Optimal';
};

// Calculate total
export const calculateTotal = (quantity: number, price: number): number => {
  return quantity * price;
};

// Validate form data
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};
