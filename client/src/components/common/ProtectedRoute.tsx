import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'merchant' | 'customer';
  requireActiveAccount?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requireActiveAccount = false
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions
  if (requiredRole && user.role !== requiredRole) {
    // Redirect based on user role
    const redirectPaths = {
      admin: '/admin/dashboard',
      merchant: '/merchant/dashboard',
      customer: '/'
    };
    
    return <Navigate to={redirectPaths[user.role]} replace />;
  }

  // Check account status for merchants
  if (requireActiveAccount && user.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
          {user.status === 'pending' && (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">حسابك قيد المراجعة</h2>
              <p className="text-gray-600 mb-6">
                تم استلام طلب التسجيل وهو قيد المراجعة من قبل فريق الإدارة. 
                ستتم مراسلتك عبر البريد الإلكتروني أو الواتساب عند الموافقة على طلبك.
              </p>
              <div className="text-sm text-gray-500">
                <p>وقت التقديم: {new Date(user.createdAt).toLocaleDateString('ar-SA')}</p>
              </div>
            </>
          )}

          {user.status === 'rejected' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">تم رفض طلب التسجيل</h2>
              <p className="text-gray-600 mb-6">
                نأسف لإبلاغك أنه تم رفض طلب التسجيل. 
                يرجى التواصل مع فريق الدعم للحصول على مزيد من التفاصيل.
              </p>
            </>
          )}

          {user.status === 'suspended' && (
            <>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">تم تعليق الحساب</h2>
              <p className="text-gray-600 mb-6">
                تم تعليق حسابك مؤقتاً. يرجى التواصل مع فريق الدعم لمعرفة سبب التعليق وخطوات إعادة التفعيل.
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              العودة للرئيسية
            </button>
            <a
              href="mailto:support@platform.com"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors"
            >
              التواصل مع الدعم
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
