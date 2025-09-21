import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// API Base Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

          localStorage.setItem('auth_token', accessToken);
          localStorage.setItem('refresh_token', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout user
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Helper function for handling API responses
const handleResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

// Helper function for handling API errors
const handleError = (error: any): never => {
  if (error.response) {
    // Server responded with error status
    throw error;
  } else if (error.request) {
    // Request was made but no response received
    toast.error('لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
    throw new Error('Network error');
  } else {
    // Something happened in setting up the request
    toast.error('حدث خطأ غير متوقع');
    throw error;
  }
};

// Auth API
export const authAPI = {
  // Login
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Register Customer
  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Register Merchant
  registerMerchant: async (merchantData: any) => {
    try {
      const response = await api.post('/auth/register/merchant', merchantData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get current user
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Change password
  changePassword: async (passwordData: any) => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Check email availability
  checkEmail: async (email: string) => {
    try {
      const response = await api.get(`/auth/check-email/${email}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Admin API
export const adminAPI = {
  // Dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Pending merchants
  getPendingMerchants: async (params?: any) => {
    try {
      const response = await api.get('/admin/merchants/pending', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Approve merchant
  approveMerchant: async (merchantId: string, notes?: string) => {
    try {
      const response = await api.put(`/admin/merchants/${merchantId}/approve`, { notes });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Reject merchant
  rejectMerchant: async (merchantId: string, rejectionReason: string) => {
    try {
      const response = await api.put(`/admin/merchants/${merchantId}/reject`, { rejectionReason });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get all users
  getUsers: async (params?: any) => {
    try {
      const response = await api.get('/admin/users', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Toggle user suspension
  toggleUserSuspension: async (userId: string, reason?: string) => {
    try {
      const response = await api.put(`/admin/users/${userId}/toggle-suspension`, { reason });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Regions management
  getRegions: async (params?: any) => {
    try {
      const response = await api.get('/admin/regions', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  createRegion: async (regionData: any) => {
    try {
      const response = await api.post('/admin/regions', regionData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  updateRegion: async (regionId: string, regionData: any) => {
    try {
      const response = await api.put(`/admin/regions/${regionId}`, regionData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteRegion: async (regionId: string) => {
    try {
      const response = await api.delete(`/admin/regions/${regionId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Stores management
  getStores: async (params?: any) => {
    try {
      const response = await api.get('/admin/stores', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  toggleStoreStatus: async (storeId: string, reason?: string) => {
    try {
      const response = await api.put(`/admin/stores/${storeId}/toggle-status`, { reason });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Merchant API
export const merchantAPI = {
  // Dashboard
  getDashboard: async () => {
    try {
      const response = await api.get('/merchant/dashboard');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Store management
  getStore: async () => {
    try {
      const response = await api.get('/merchant/store');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  updateStore: async (storeData: any) => {
    try {
      const response = await api.put('/merchant/store', storeData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Products management
  getProducts: async (params?: any) => {
    try {
      const response = await api.get('/merchant/products', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  createProduct: async (productData: any) => {
    try {
      const response = await api.post('/merchant/products', productData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  updateProduct: async (productId: string, productData: any) => {
    try {
      const response = await api.put(`/merchant/products/${productId}`, productData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      const response = await api.delete(`/merchant/products/${productId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  toggleProductStatus: async (productId: string) => {
    try {
      const response = await api.put(`/merchant/products/${productId}/toggle-status`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getProduct: async (productId: string) => {
    try {
      const response = await api.get(`/merchant/products/${productId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getRejectedProducts: async () => {
    try {
      const response = await api.get('/merchant/products/rejected/reasons');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Profile management
  updateProfile: async (profileData: any) => {
    try {
      const response = await api.put('/merchant/profile', profileData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Public API (no auth required)
export const publicAPI = {
  // Regions
  getRegions: async (params?: any) => {
    try {
      const response = await api.get('/regions', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getFeaturedRegions: async () => {
    try {
      const response = await api.get('/regions/featured');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getRegion: async (regionId: string) => {
    try {
      const response = await api.get(`/regions/${regionId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getRegionStores: async (regionId: string, params?: any) => {
    try {
      const response = await api.get(`/regions/${regionId}/stores`, { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Stores
  getStores: async (params?: any) => {
    try {
      const response = await api.get('/stores', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getFeaturedStores: async (params?: any) => {
    try {
      const response = await api.get('/stores/featured', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getStore: async (storeId: string) => {
    try {
      const response = await api.get(`/stores/${storeId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getStoreBySubdomain: async (subdomain: string) => {
    try {
      const response = await api.get(`/stores/by-subdomain/${subdomain}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getStoreProducts: async (storeId: string, params?: any) => {
    try {
      const response = await api.get(`/stores/${storeId}/products`, { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  searchStores: async (query: string, params?: any) => {
    try {
      const response = await api.get(`/stores/search/${query}`, { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Products
  getProducts: async (params?: any) => {
    try {
      const response = await api.get('/products', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getFeaturedProducts: async (params?: any) => {
    try {
      const response = await api.get('/products/featured', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getOnSaleProducts: async (params?: any) => {
    try {
      const response = await api.get('/products/on-sale', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getProduct: async (productId: string) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  searchProducts: async (query: string, params?: any) => {
    try {
      const response = await api.get(`/products/search/${query}`, { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getCategories: async (params?: any) => {
    try {
      const response = await api.get('/products/categories/list', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Customer API
export const customerAPI = {
  getStores: async (params?: any) => {
    try {
      const response = await api.get('/customer/stores', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getStore: async (storeId: string) => {
    try {
      const response = await api.get(`/customer/stores/${storeId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getStoreProducts: async (storeId: string, params?: any) => {
    try {
      const response = await api.get(`/customer/stores/${storeId}/products`, { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getProduct: async (productId: string) => {
    try {
      const response = await api.get(`/customer/products/${productId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  searchProducts: async (params?: any) => {
    try {
      const response = await api.get('/customer/search/products', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getCategories: async (params?: any) => {
    try {
      const response = await api.get('/customer/categories', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  addToWishlist: async (productId: string) => {
    try {
      const response = await api.post(`/customer/wishlist/${productId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

export default api;
