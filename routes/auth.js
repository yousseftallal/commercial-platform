const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Region = require('../models/Region');
const { validateUserRegistration, validateMerchantRegistration, validateLogin, validatePasswordChange } = require('../middleware/validation');
const { authenticateToken, updateLastLogin } = require('../middleware/auth');
const router = express.Router();

// دالة إنشاء JWT token
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// تسجيل مستخدم جديد (عميل)
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, region } = req.body;

    // التحقق من وجود المنطقة
    const selectedRegion = await Region.findById(region);
    if (!selectedRegion || !selectedRegion.isActive) {
      return res.status(400).json({
        error: 'المنطقة المحددة غير متاحة',
        code: 'INVALID_REGION'
      });
    }

    // إنشاء المستخدم الجديد
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      region,
      role: 'customer',
      status: 'active'
    });

    await user.save();

    // تحديث إحصائيات المنطقة
    await selectedRegion.updateStats();

    // إنشاء tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // إرجاع بيانات المستخدم بدون كلمة المرور
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'تم التسجيل بنجاح',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('خطأ في تسجيل المستخدم:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'البريد الإلكتروني مستخدم بالفعل',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }
    
    res.status(500).json({
      error: 'حدث خطأ في التسجيل',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// تسجيل تاجر جديد
router.post('/register/merchant', validateMerchantRegistration, async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      region,
      businessName,
      businessDescription,
      businessCategory,
      whatsapp
    } = req.body;

    // التحقق من وجود المنطقة
    const selectedRegion = await Region.findById(region);
    if (!selectedRegion || !selectedRegion.isActive) {
      return res.status(400).json({
        error: 'المنطقة المحددة غير متاحة',
        code: 'INVALID_REGION'
      });
    }

    // إنشاء التاجر الجديد
    const merchant = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      region,
      role: 'merchant',
      status: 'pending', // يحتاج موافقة من الإدارة
      businessName,
      businessDescription,
      businessCategory,
      whatsapp
    });

    await merchant.save();

    // إرجاع بيانات التاجر بدون كلمة المرور
    const merchantResponse = merchant.toObject();
    delete merchantResponse.password;

    res.status(201).json({
      message: 'تم إرسال طلب التسجيل بنجاح، ستتم مراجعته من قبل الإدارة وسيتم التواصل معك قريباً',
      merchant: merchantResponse,
      note: 'حسابك قيد المراجعة ولا يمكن استخدامه حتى تتم الموافقة عليه'
    });

  } catch (error) {
    console.error('خطأ في تسجيل التاجر:', error);
    
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        return res.status(400).json({
          error: 'البريد الإلكتروني مستخدم بالفعل',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }
      if (error.keyPattern.storeSubdomain) {
        return res.status(400).json({
          error: 'اسم المتجر مستخدم بالفعل، يرجى اختيار اسم آخر',
          code: 'STORE_NAME_EXISTS'
        });
      }
    }
    
    res.status(500).json({
      error: 'حدث خطأ في التسجيل',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// تسجيل الدخول
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // البحث عن المستخدم
    const user = await User.findByEmail(email).populate('region');
    
    if (!user) {
      return res.status(401).json({
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        code: 'INVALID_CREDENTIALS'
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

    // فحص كلمة المرور
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        code: 'INVALID_CREDENTIALS'
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
        error: 'تم رفض طلب انضمامك، يرجى التواصل مع الإدارة للمزيد من التفاصيل',
        code: 'ACCOUNT_REJECTED'
      });
    }

    // إعادة تعيين محاولات الدخول الخاطئة
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // تحديث وقت آخر دخول
    user.lastLogin = new Date();
    await user.save();

    // إنشاء tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // إرجاع بيانات المستخدم بدون كلمة المرور
    const userResponse = user.toObject();
    delete userResponse.password;

    let message = 'تم تسجيل الدخول بنجاح';
    if (user.role === 'merchant' && user.status === 'pending') {
      message = 'تم تسجيل الدخول بنجاح. حسابك قيد المراجعة من قبل الإدارة';
    }

    res.json({
      message,
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      error: 'حدث خطأ في تسجيل الدخول',
      code: 'LOGIN_ERROR'
    });
  }
});

// تجديد الـ token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'رمز التجديد مطلوب',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // التحقق من وجود المستخدم
    const user = await User.findById(decoded.userId);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: 'رمز التجديد غير صالح',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // إنشاء tokens جديدة
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    res.json({
      message: 'تم تجديد الرمز بنجاح',
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('خطأ في تجديد الرمز:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'رمز التجديد غير صالح أو منتهي الصلاحية',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    res.status(500).json({
      error: 'حدث خطأ في تجديد الرمز',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

// تسجيل الخروج
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // في تطبيق حقيقي، يجب إضافة الـ token إلى قائمة سوداء
    // هنا نكتفي بإرجاع رسالة نجاح
    
    res.json({
      message: 'تم تسجيل الخروج بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    res.status(500).json({
      error: 'حدث خطأ في تسجيل الخروج',
      code: 'LOGOUT_ERROR'
    });
  }
});

// الحصول على بيانات المستخدم الحالي
router.get('/me', authenticateToken, updateLastLogin, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('region')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_USER_ERROR'
    });
  }
});

// تغيير كلمة المرور
router.put('/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // التحقق من كلمة المرور الحالية
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'كلمة المرور الحالية غير صحيحة',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // تحديث كلمة المرور
    req.user.password = newPassword;
    await req.user.save();

    res.json({
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({
      error: 'حدث خطأ في تغيير كلمة المرور',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// إعادة تعيين كلمة المرور (طلب)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    
    if (!user) {
      // لأسباب أمنية، نرجع نفس الرسالة حتى لو لم يكن المستخدم موجود
      return res.json({
        message: 'إذا كان البريد الإلكتروني موجود في نظامنا، ستتلقى رسالة لإعادة تعيين كلمة المرور'
      });
    }

    // هنا يجب إضافة منطق إرسال البريد الإلكتروني
    // وحفظ رمز إعادة التعيين في قاعدة البيانات
    
    res.json({
      message: 'إذا كان البريد الإلكتروني موجود في نظامنا، ستتلقى رسالة لإعادة تعيين كلمة المرور'
    });

  } catch (error) {
    console.error('خطأ في طلب إعادة تعيين كلمة المرور:', error);
    res.status(500).json({
      error: 'حدث خطأ في معالجة الطلب',
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

// فحص صحة البريد الإلكتروني
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findByEmail(email);
    
    res.json({
      exists: !!user,
      available: !user
    });

  } catch (error) {
    console.error('خطأ في فحص البريد الإلكتروني:', error);
    res.status(500).json({
      error: 'حدث خطأ في فحص البريد الإلكتروني',
      code: 'EMAIL_CHECK_ERROR'
    });
  }
});

module.exports = router;
