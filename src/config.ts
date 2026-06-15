// Central API configuration
// Set VITE_APP_API_URL in your .env file to override the default
export const API_BASE_URL = import.meta.env.VITE_APP_API_URL
  ? `${import.meta.env.VITE_APP_API_URL}`
  : 'https://pos.petalpink.lk';
