import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { publicAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Business categories
const BUSINESS_CATEGORIES = [
  'ملابس',
  'إلكترونيات', 
  'طعام وشراب',
  'صحة وجمال',
  'رياضة',
  'كتب',
  'منزل وحديقة',
  'أخرى'
];

// Validation schema
const merchantRegisterSchema = yup.object({
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
  whatsapp: yup
    .string()
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'يرجى إدخال رقم واتساب صالح'),
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
  businessName: yup
    .string()
    .required('اسم المتجر مطلوب')
    .min(2, 'اسم المتجر يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم المتجر طويل جداً'),
  businessDescription: yup
    .string()
    .optional()
    .max(500, 'وصف المتجر طويل جداً'),
  businessCategory: yup
    .string()
    .required('يرجى اختيار فئة المتجر'),
});

interface MerchantRegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  password: string;
  confirmPassword: string;
  region: string;
  businessName: string;
  businessDescription?: string;
  businessCategory: string;
}

interface Region {
  _id: string;
  name: string;
  nameEn: string;
  deliveryFee: number;
}

const MerchantRegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [step, setStep] = useState(1);
  
  const { registerMerchant, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger
  } = useForm<MerchantRegisterFormData>({
    resolver: yupResolver(merchantRegisterSchema),
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

  const onSubmit = async (data: MerchantRegisterFormData) => {
    try {
      await registerMerchant(data);
      navigate('/login', { 
        state: { 
          message: 'تم إرسال طلب التسجيل بنجاح! ستتم مراجعته من قبل الإدارة وسيتم التواصل معك قريباً.' 
        }
      });
    } catch (error) {
      // Error is handled in the context
    }
  };

  const handleNextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ['firstName', 'lastName', 'email', 'phone', 'whatsapp']
      : ['password', 'confirmPassword'];
    
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 7h6m-6 4h6m-6 4h6" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          تسجيل تاجر جديد
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          أو{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            تسجيل الدخول لحساب موجود
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 
                      ${step >= stepNumber 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-500'
                      }`}
                  >
                    {step > stepNumber ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {stepNumber < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 
                        ${step > stepNumber ? 'bg-primary-600' : 'bg-gray-300'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>البيانات الشخصية</span>
              <span>كلمة المرور</span>
              <span>بيانات المتجر</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6 animate-slide-up">
                <h3 className="text-lg font-medium text-gray-900 text-center">البيانات الشخصية</h3>
                
                {/* Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      الاسم الأول <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                        focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                        ${errors.firstName ? 'border-red-300' : 'border-gray-300'}
                      `}
                      placeholder="أحمد"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      الاسم الأخير <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
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

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                      ${errors.email ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="ahmed@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone & WhatsApp */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                        focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                        ${errors.phone ? 'border-red-300' : 'border-gray-300'}
                      `}
                      placeholder="+201234567890"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                      رقم الواتساب
                    </label>
                    <input
                      {...register('whatsapp')}
                      type="tel"
                      className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                        focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                        ${errors.whatsapp ? 'border-red-300' : 'border-gray-300'}
                      `}
                      placeholder="+201234567890"
                    />
                    {errors.whatsapp && (
                      <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <div className="space-y-6 animate-slide-up">
                <h3 className="text-lg font-medium text-gray-900 text-center">إعداد كلمة المرور</h3>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`appearance-none block w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 
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
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    كلمة المرور يجب أن تحتوي على: حرف كبير، حرف صغير، رقم، ورمز خاص
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    تأكيد كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`appearance-none block w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 
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
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Business Information */}
            {step === 3 && (
              <div className="space-y-6 animate-slide-up">
                <h3 className="text-lg font-medium text-gray-900 text-center">بيانات المتجر</h3>

                {/* Business Name */}
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    اسم المتجر <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('businessName')}
                    type="text"
                    className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm
                      ${errors.businessName ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="متجر الأناقة للأزياء"
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                  )}
                </div>

                {/* Business Category */}
                <div>
                  <label htmlFor="businessCategory" className="block text-sm font-medium text-gray-700">
                    فئة المتجر <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('businessCategory')}
                    className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm form-select
                      ${errors.businessCategory ? 'border-red-300' : 'border-gray-300'}
                    `}
                  >
                    <option value="">اختر فئة المتجر</option>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.businessCategory && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessCategory.message}</p>
                  )}
                </div>

                {/* Region */}
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                    المنطقة <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('region')}
                    className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm 
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

                {/* Business Description */}
                <div>
                  <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">
                    وصف المتجر
                  </label>
                  <textarea
                    {...register('businessDescription')}
                    rows={3}
                    className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none
                      ${errors.businessDescription ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="اكتب وصفاً مختصراً عن متجرك ونوع المنتجات التي تبيعها..."
                  />
                  {errors.businessDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessDescription.message}</p>
                  )}
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
                      </a>{' '}
                      وأتعهد بصحة البيانات المقدمة
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || loadingRegions}
                    className={`px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white 
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
                        <span className="mr-2">جاري الإرسال...</span>
                      </div>
                    ) : (
                      'إرسال طلب التسجيل'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              سيتم مراجعة طلبك من قبل فريق الإدارة خلال 24-48 ساعة
              <br />
              وسيتم التواصل معك عبر البريد الإلكتروني أو الواتساب
            </p>
          </div>

          {/* Customer register link */}
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
                to="/register"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                التسجيل كعميل
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantRegisterPage;
