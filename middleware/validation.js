const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

// Middleware للتعامل مع نتائج التحقق من البيانات
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      error: 'بيانات غير صالحة',
      code: 'VALIDATION_ERROR',
      details: errorMessages
    });
  }
  
  next();
};

// قواعد التحقق من تسجيل المستخدم الجديد
const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('يرجى إدخال بريد إلكتروني صالح')
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('تأكيد كلمة المرور غير متطابق');
      }
      return true;
    }),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('الاسم الأول يجب أن يكون بين 2 و 50 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\s]+$/)
    .withMessage('الاسم الأول يجب أن يحتوي على أحرف فقط'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('الاسم الأخير يجب أن يكون بين 2 و 50 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFA-Za-z\s]+$/)
    .withMessage('الاسم الأخير يجب أن يحتوي على أحرف فقط'),
  
  body('phone')
    .isMobilePhone(['ar-EG', 'ar-SA', 'ar'])
    .withMessage('يرجى إدخال رقم هاتف صالح'),
  
  body('role')
    .isIn(['merchant', 'customer'])
    .withMessage('نوع الحساب يجب أن يكون تاجر أو عميل'),
  
  handleValidationErrors
];

// قواعد التحقق من تسجيل التاجر
const validateMerchantRegistration = [
  ...validateUserRegistration.slice(0, -1), // استبعاد handleValidationErrors
  
  body('businessName')
    .if(body('role').equals('merchant'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم المتجر يجب أن يكون بين 2 و 100 حرف'),
  
  body('businessDescription')
    .if(body('role').equals('merchant'))
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('وصف المتجر لا يجب أن يتجاوز 500 حرف'),
  
  body('businessCategory')
    .if(body('role').equals('merchant'))
    .isIn(['ملابس', 'إلكترونيات', 'طعام وشراب', 'صحة وجمال', 'رياضة', 'كتب', 'منزل وحديقة', 'أخرى'])
    .withMessage('فئة المتجر غير صالحة'),
  
  body('region')
    .isMongoId()
    .withMessage('المنطقة غير صالحة'),
  
  body('whatsapp')
    .optional()
    .isMobilePhone(['ar-EG', 'ar-SA', 'ar'])
    .withMessage('رقم الواتساب غير صالح'),
  
  handleValidationErrors
];

// قواعد التحقق من تسجيل الدخول
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('يرجى إدخال بريد إلكتروني صالح')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة'),
  
  handleValidationErrors
];

// قواعد التحقق من تغيير كلمة المرور
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('كلمة المرور الحالية مطلوبة'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('كلمة المرور الجديدة يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص'),
  
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('تأكيد كلمة المرور الجديدة غير متطابق');
      }
      return true;
    }),
  
  handleValidationErrors
];

// قواعد التحقق من إنشاء المتجر
const validateStoreCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم المتجر يجب أن يكون بين 2 و 100 حرف'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('وصف المتجر لا يجب أن يتجاوز 1000 حرف'),
  
  body('category')
    .isIn(['ملابس', 'إلكترونيات', 'طعام وشراب', 'صحة وجمال', 'رياضة', 'كتب', 'منزل وحديقة', 'أخرى'])
    .withMessage('فئة المتجر غير صالحة'),
  
  body('contactInfo.phone')
    .isMobilePhone(['ar-EG', 'ar-SA', 'ar'])
    .withMessage('رقم الهاتف غير صالح'),
  
  body('contactInfo.whatsapp')
    .optional()
    .isMobilePhone(['ar-EG', 'ar-SA', 'ar'])
    .withMessage('رقم الواتساب غير صالح'),
  
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح'),
  
  handleValidationErrors
];

// قواعد التحقق من إنشاء المنتج
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('اسم المنتج يجب أن يكون بين 2 و 200 حرف'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('وصف المنتج يجب أن يكون بين 10 و 2000 حرف'),
  
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('الوصف المختصر لا يجب أن يتجاوز 300 حرف'),
  
  body('category')
    .isIn(['ملابس', 'إلكترونيات', 'طعام وشراب', 'صحة وجمال', 'رياضة', 'كتب', 'منزل وحديقة', 'أخرى'])
    .withMessage('فئة المنتج غير صالحة'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('سعر المنتج يجب أن يكون رقم موجب'),
  
  body('inventory.quantity')
    .isInt({ min: 0 })
    .withMessage('كمية المنتج يجب أن تكون رقم صحيح موجب'),
  
  handleValidationErrors
];

// قواعد التحقق من إنشاء المنطقة (للإداري فقط)
const validateRegionCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('اسم المنطقة يجب أن يكون بين 2 و 100 حرف'),
  
  body('nameEn')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم الإنجليزي للمنطقة يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('الاسم الإنجليزي يجب أن يحتوي على أحرف إنجليزية فقط'),
  
  body('code')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('كود المنطقة يجب أن يكون بين 2 و 10 أحرف')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('كود المنطقة يجب أن يحتوي على أحرف إنجليزية كبيرة وأرقام فقط'),
  
  body('coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('خط العرض غير صالح'),
  
  body('coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('خط الطول غير صالح'),
  
  body('deliveryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('رسوم التوصيل يجب أن تكون رقم موجب'),
  
  handleValidationErrors
];

// قواعد التحقق من معرفات MongoDB
const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`معرف ${paramName} غير صالح`),
  
  handleValidationErrors
];

// قواعد التحقق من صفحات البحث
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقم صحيح موجب')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد النتائج في الصفحة يجب أن يكون بين 1 و 100')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'createdAt', 'rating', 'sales'])
    .withMessage('طريقة الترتيب غير صالحة'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc'),
  
  handleValidationErrors
];

// قواعد التحقق من البحث
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('كلمة البحث يجب أن تكون بين 1 و 100 حرف'),
  
  query('category')
    .optional()
    .isIn(['ملابس', 'إلكترونيات', 'طعام وشراب', 'صحة وجمال', 'رياضة', 'كتب', 'منزل وحديقة', 'أخرى'])
    .withMessage('فئة البحث غير صالحة'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('الحد الأدنى للسعر يجب أن يكون رقم موجب')
    .toFloat(),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('الحد الأقصى للسعر يجب أن يكون رقم موجب')
    .toFloat(),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateMerchantRegistration,
  validateLogin,
  validatePasswordChange,
  validateStoreCreation,
  validateProductCreation,
  validateRegionCreation,
  validateMongoId,
  validatePagination,
  validateSearch
};
