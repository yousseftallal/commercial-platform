import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { publicAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Validation schema
const registerSchema = yup.object({
  firstName: yup
    .string()
    .required('الاسم الأول مطلوب')
    .min(2, 'الاسم الأول يجب أن يكون حرفين على الأقل')
    .max(50, 'الاسم الأول طويل جداً'),
  lastName: yup
    .string()
    .required('الاسم الأخير مطلوب')
    .min(2, 'الاسم الأخير يجب أن يكون حرفين على الأقل')
    .max(50, 'الاسم الأخير طويل جداً'),
  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .email('يرجى إدخال بريد إلكتروني صالح'),
  phone: yup
    .string()
    .required('رقم الهاتف مطلوب')
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'يرجى إدخال رقم هاتف صالح'),
  password: yup
    .string()
    .required('كلمة المرور مطلوبة')
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص'
    ),
  confirmPassword: yup
    .string()
    .required('تأكيد كلمة المرور مطلوب')
    .oneOf([yup.ref('password')], 'كلمات المرور غير متطابقة'),
  region: yup
    .string()
    .required('يرجى اختيار المنطقة'),
});

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  region: string;
}

interface Region {
  _id: string;
  name: string;
  nameEn: string;
  deliveryFee: number;
}

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur'
  });

  // Load regions
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const response = await publicAPI.getRegions();
        setRegions(response.regions);
      } catch (error) {
        console.error('Error loading regions:', error);
      } finally {
        setLoadingRegions(false);
      }
    };

    loadRegions();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      navigate('/');
    } catch (error) {
      // Error is handled in the context
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="mr-3 text-2xl font-bold text-gray-900">المنصة التجارية</h1>
            </div>
            <h2 className="mt-8 text-3xl font-bold text-gray-900">
              إنشاء حساب جديد
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              أو{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                تسجيل الدخول لحساب موجود
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    الاسم الأول
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('firstName')}
                      type="text"
                      className={`
                        appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                        focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                        ${errors.firstName ? 'border-red-300' : 'border-gray-300'}
                      `}
                      placeholder="أحمد"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    الاسم الأخير
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('lastName')}
                      type="text"
                      className={`
                        appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                        focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                        ${errors.lastName ? 'border-red-300' : 'border-gray-300'}
                      `}
                      placeholder="محمد"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  البريد الإلكتروني
                </label>
                <div className="mt-1">
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={`
                      appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                      ${errors.email ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="ahmed@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  رقم الهاتف
                </label>
                <div className="mt-1">
                  <input
                    {...register('phone')}
                    type="tel"
                    className={`
                      appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                      ${errors.phone ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="+201234567890"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Region */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                  المنطقة
                </label>
                <div className="mt-1">
                  <select
                    {...register('region')}
                    className={`
                      appearance-none block w-full px-3 py-2 border rounded-md shadow-sm 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm form-select
                      ${errors.region ? 'border-red-300' : 'border-gray-300'}
                    `}
                  >
                    <option value="">اختر المنطقة</option>
                    {loadingRegions ? (
                      <option disabled>جاري التحميل...</option>
                    ) : (
                      regions.map((region) => (
                        <option key={region._id} value={region._id}>
                          {region.name} - رسوم التوصيل: {region.deliveryFee} جنيه
                        </option>
                      ))
                    )}
                  </select>
                  {errors.region && (
                    <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  كلمة المرور
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`
                      appearance-none block w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                      ${errors.password ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="أدخل كلمة مرور قوية"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  تأكيد كلمة المرور
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`
                      appearance-none block w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                      ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="أعد إدخال كلمة المرور"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="mr-3 text-sm">
                  <label htmlFor="terms" className="text-gray-500">
                    أوافق على{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500">
                      الشروط والأحكام
                    </a>{' '}
                    و{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500">
                      سياسة الخصوصية
                    </a>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || loadingRegions}
                  className={`
                    group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors
                    ${isSubmitting || loadingRegions
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" color="white" />
                      <span className="mr-2">جاري إنشاء الحساب...</span>
                    </div>
                  ) : (
                    'إنشاء حساب'
                  )}
                </button>
              </div>
            </form>

            {/* Merchant register link */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">أو</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/register/merchant"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 7h6m-6 4h6m-6 4h6" />
                  </svg>
                  التسجيل كتاجر
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-600 to-secondary-800">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="text-center text-white">
              <h3 className="text-4xl font-bold mb-6">انضم إلى مجتمعنا</h3>
              <p className="text-xl mb-8 leading-relaxed">
                تسوق من آلاف المنتجات عبر مئات المتاجر
                <br />
                في منطقتك بأفضل الأسعار
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-lg">تسوق آمن ومضمون</span>
                </div>
                <div className="flex items-center justify-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-lg">توصيل سريع لمنطقتك</span>
                </div>
                <div className="flex items-center justify-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <span className="text-lg">دعم فني متواصل</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
