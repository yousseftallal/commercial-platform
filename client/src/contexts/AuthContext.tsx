import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// Types
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  role: 'admin' | 'merchant' | 'customer';
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  region?: {
    _id: string;
    name: string;
    nameEn: string;
    deliveryFee: number;
  };
  businessName?: string;
  businessCategory?: string;
  storeSubdomain?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  registerMerchant: (merchantData: MerchantRegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
}

interface MerchantRegisterData extends RegisterData {
  businessName: string;
  businessDescription?: string;
  businessCategory: string;
  whatsapp?: string;
}

// Action Types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
const setStoredTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};
const clearStoredTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auto-login on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getStoredToken();
      
      if (token) {
        try {
          const userData = await authAPI.getMe();
          dispatch({ type: 'AUTH_SUCCESS', payload: userData.user });
        } catch (error) {
          // Token might be expired, try to refresh
          const refreshToken = getStoredRefreshToken();
          if (refreshToken) {
            try {
              const refreshData = await authAPI.refreshToken(refreshToken);
              setStoredTokens(refreshData.tokens.accessToken, refreshData.tokens.refreshToken);
              
              const userData = await authAPI.getMe();
              dispatch({ type: 'AUTH_SUCCESS', payload: userData.user });
            } catch (refreshError) {
              clearStoredTokens();
              dispatch({ type: 'LOGOUT' });
            }
          } else {
            clearStoredTokens();
            dispatch({ type: 'LOGOUT' });
          }
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.login(email, password);
      
      // Store tokens
      setStoredTokens(response.tokens.accessToken, response.tokens.refreshToken);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      
      // Show success message
      toast.success(response.message || 'تم تسجيل الدخول بنجاح');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'حدث خطأ في تسجيل الدخول';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.register(userData);
      
      // Store tokens for auto-login
      setStoredTokens(response.tokens.accessToken, response.tokens.refreshToken);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      
      toast.success(response.message || 'تم التسجيل بنجاح');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'حدث خطأ في التسجيل';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Register merchant function
  const registerMerchant = async (merchantData: MerchantRegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.registerMerchant(merchantData);
      
      // Don't auto-login for merchants as they need approval
      dispatch({ type: 'SET_LOADING', payload: false });
      
      toast.success(response.message || 'تم إرسال طلب التسجيل بنجاح');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'حدث خطأ في التسجيل';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearStoredTokens();
      dispatch({ type: 'LOGOUT' });
      toast.success('تم تسجيل الخروج بنجاح');
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await authAPI.getMe();
      dispatch({ type: 'AUTH_SUCCESS', payload: userData.user });
    } catch (error: any) {
      console.error('Error refreshing user data:', error);
      // Don't show error toast for background refresh
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    registerMerchant,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
