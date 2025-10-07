// API Configuration
export const API_CONFIG = {
  // API base URL (with /api path)
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',

  // Base URL for static files (without /api path)
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
};

// Helper function to get full URL for uploaded files
export const getFileUrl = (path) => {
  if (!path) return '';

  // If path is already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Otherwise, prepend the base URL
  return `${API_CONFIG.BASE_URL}${path}`;
};
