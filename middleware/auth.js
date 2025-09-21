const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware لفحص الـ JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'رمز المصادقة مطلوب',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // البحث عن المستخدم وفحص حالة الحساب
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: 'رمز المصادقة غير صالح',
        code: 'INVALID_TOKEN'
      });
    }

    // فحص حالة الحساب
    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'تم تعليق حسابك، يرجى التواصل مع الإدارة',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        error: 'تم رفض طلب انضمامك، يرجى التواصل مع الإدارة',
        code: 'ACCOUNT_REJECTED'
      });
    }

    // فحص قفل الحساب
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      return res.status(423).json({
        error: `تم قفل حسابك مؤقتاً لمدة ${lockTimeRemaining} دقيقة بسبب محاولات دخول خاطئة متكررة`,
        code: 'ACCOUNT_LOCKED',
        lockTimeRemaining
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'رمز المصادقة غير صالح',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'انتهت صلاحية رمز المصادقة، يرجى تسجيل الدخول مرة أخرى',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('خطأ في مصادقة المستخدم:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Middleware للتحقق من صلاحيات المستخدم
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'يجب تسجيل الدخول أولاً',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'ليس لديك صلاحية للوصول إلى هذا المحتوى',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware للتحقق من صلاحية الإدارة
const requireAdmin = requireRole('admin');

// Middleware للتحقق من صلاحية التاجر
const requireMerchant = requireRole('merchant');

// Middleware للتحقق من صلاحية العميل
const requireCustomer = requireRole('customer');

// Middleware للتحقق من صلاحية التاجر أو الإداري
const requireMerchantOrAdmin = requireRole('merchant', 'admin');

// Middleware للتحقق من حالة الحساب النشط
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'يجب تسجيل الدخول أولاً',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }

  if (req.user.status !== 'active') {
    let message = 'حسابك غير نشط';
    let code = 'ACCOUNT_INACTIVE';

    switch (req.user.status) {
      case 'pending':
        message = 'حسابك قيد المراجعة، ستتم مراسلتك عند الموافقة';
        code = 'ACCOUNT_PENDING';
        break;
      case 'suspended':
        message = 'تم تعليق حسابك، يرجى التواصل مع الإدارة';
        code = 'ACCOUNT_SUSPENDED';
        break;
      case 'rejected':
        message = 'تم رفض طلب انضمامك، يرجى التواصل مع الإدارة';
        code = 'ACCOUNT_REJECTED';
        break;
    }

    return res.status(403).json({
      error: message,
      code: code,
      status: req.user.status
    });
  }

  next();
};

// Middleware للتحقق من ملكية المورد
const requireResourceOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          error: 'معرف المورد مطلوب',
          code: 'RESOURCE_ID_REQUIRED'
        });
      }

      const Model = require(`../models/${resourceModel}`);
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          error: 'المورد غير موجود',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // التحقق من الملكية حسب نوع المورد
      let isOwner = false;
      
      if (resourceModel === 'Store') {
        isOwner = resource.merchant.toString() === req.user._id.toString();
      } else if (resourceModel === 'Product') {
        const Store = require('../models/Store');
        const store = await Store.findById(resource.store);
        isOwner = store && store.merchant.toString() === req.user._id.toString();
      }

      // الإداري يمكنه الوصول لكل شيء
      if (req.user.role === 'admin') {
        isOwner = true;
      }

      if (!isOwner) {
        return res.status(403).json({
          error: 'ليس لديك صلاحية للوصول إلى هذا المورد',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('خطأ في فحص ملكية المورد:', error);
      res.status(500).json({
        error: 'خطأ في الخادم',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
};

// Middleware اختياري للمصادقة (لا يرفض الطلب في حالة عدم وجود token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active' && !user.isLocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // في حالة المصادقة الاختيارية، نتجاهل الأخطاء ونتابع
    next();
  }
};

// تحديث وقت آخر دخول
const updateLastLogin = async (req, res, next) => {
  if (req.user) {
    try {
      await User.findByIdAndUpdate(req.user._id, {
        lastLogin: new Date()
      });
    } catch (error) {
      console.error('خطأ في تحديث وقت آخر دخول:', error);
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireMerchant,
  requireCustomer,
  requireMerchantOrAdmin,
  requireActiveAccount,
  requireResourceOwnership,
  optionalAuth,
  updateLastLogin
};
