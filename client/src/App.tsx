import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MerchantRegisterPage from './pages/auth/MerchantRegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMerchants from './pages/admin/AdminMerchants';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStores from './pages/admin/AdminStores';
import AdminRegions from './pages/admin/AdminRegions';

// Merchant Pages
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import MerchantStore from './pages/merchant/MerchantStore';
import MerchantProducts from './pages/merchant/MerchantProducts';
import MerchantProfile from './pages/merchant/MerchantProfile';

// Customer Pages
import StoresPage from './pages/customer/StoresPage';
import StorePage from './pages/customer/StorePage';
import ProductPage from './pages/customer/ProductPage';
import SearchPage from './pages/customer/SearchPage';

// Store Pages (Public)
import PublicStorePage from './pages/store/PublicStorePage';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            {/* Toast Notifications */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  borderRadius: '0.5rem',
                  fontSize: '14px',
                  fontFamily: 'Cairo',
                  direction: 'rtl',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
              containerClassName="toast-container"
            />

            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/merchant" element={<MerchantRegisterPage />} />
              
              {/* Customer Routes */}
              <Route path="/stores" element={<StoresPage />} />
              <Route path="/stores/:storeId" element={<StorePage />} />
              <Route path="/products/:productId" element={<ProductPage />} />
              <Route path="/search" element={<SearchPage />} />
              
              {/* Public Store Routes */}
              <Route path="/store/:subdomain" element={<PublicStorePage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/merchants" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminMerchants />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/stores" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStores />
                </ProtectedRoute>
              } />
              <Route path="/admin/regions" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminRegions />
                </ProtectedRoute>
              } />

              {/* Merchant Routes */}
              <Route path="/merchant" element={
                <ProtectedRoute requiredRole="merchant">
                  <Navigate to="/merchant/dashboard" replace />
                </ProtectedRoute>
              } />
              <Route path="/merchant/dashboard" element={
                <ProtectedRoute requiredRole="merchant" requireActiveAccount>
                  <MerchantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/merchant/store" element={
                <ProtectedRoute requiredRole="merchant" requireActiveAccount>
                  <MerchantStore />
                </ProtectedRoute>
              } />
              <Route path="/merchant/products" element={
                <ProtectedRoute requiredRole="merchant" requireActiveAccount>
                  <MerchantProducts />
                </ProtectedRoute>
              } />
              <Route path="/merchant/profile" element={
                <ProtectedRoute requiredRole="merchant">
                  <MerchantProfile />
                </ProtectedRoute>
              } />

              {/* 404 Route */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">الصفحة التي تبحث عنها غير موجودة</p>
                    <a 
                      href="/" 
                      className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      العودة للرئيسية
                    </a>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
