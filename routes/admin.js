const express = require('express');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Region = require('../models/Region');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateMongoId, validateRegionCreation, validatePagination } = require('../middleware/validation');
const router = express.Router();

// تطبيق المصادقة والتحقق من صلاحية الإدارة على جميع المسارات
router.use(authenticateToken, requireAdmin);

// لوحة التحكم الرئيسية - الإحصائيات العامة
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalMerchants,
      totalCustomers,
      pendingMerchants,
      activeMerchants,
      totalStores,
      activeStores,
      totalProducts,
      approvedProducts,
      pendingProducts,
      totalRegions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'merchant' }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'merchant', status: 'pending' }),
      User.countDocuments({ role: 'merchant', status: 'active' }),
      Store.countDocuments(),
      Store.countDocuments({ isActive: true, status: 'active' }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'pending' }),
      Region.countDocuments({ isActive: true })
    ]);

    // إحصائيات شهرية (آخر 30 يوم)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      newMerchantsThisMonth,
      newCustomersThisMonth,
      newStoresThisMonth,
      newProductsThisMonth
    ] = await Promise.all([
      User.countDocuments({ role: 'merchant', createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: thirtyDaysAgo } }),
      Store.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Product.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    res.json({
      statistics: {
        users: {
          total: totalUsers,
          merchants: totalMerchants,
          customers: totalCustomers,
          pendingMerchants,
          activeMerchants
        },
        stores: {
          total: totalStores,
          active: activeStores
        },
        products: {
          total: totalProducts,
          approved: approvedProducts,
          pending: pendingProducts
        },
        regions: {
          total: totalRegions
        },
        monthly: {
          newMerchants: newMerchantsThisMonth,
          newCustomers: newCustomersThisMonth,
          newStores: newStoresThisMonth,
          newProducts: newProductsThisMonth
        }
      }
    });

  } catch (error) {
    console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب الإحصائيات',
      code: 'DASHBOARD_STATS_ERROR'
    });
  }
});

// إدارة طلبات التجار المعلقة
router.get('/merchants/pending', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [merchants, totalCount] = await Promise.all([
      User.find({ role: 'merchant', status: 'pending' })
        .populate('region', 'name nameEn')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: 'merchant', status: 'pending' })
    ]);

    res.json({
      merchants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('خطأ في جلب طلبات التجار المعلقة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب الطلبات',
      code: 'PENDING_MERCHANTS_ERROR'
    });
  }
});

// الموافقة على طلب تاجر
router.put('/merchants/:merchantId/approve', validateMongoId('merchantId'), async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { notes } = req.body;

    const merchant = await User.findOne({ _id: merchantId, role: 'merchant', status: 'pending' });
    
    if (!merchant) {
      return res.status(404).json({
        error: 'التاجر غير موجود أو تمت معالجة طلبه بالفعل',
        code: 'MERCHANT_NOT_FOUND'
      });
    }

    // تحديث حالة التاجر
    merchant.status = 'active';
    merchant.approvedBy = req.user._id;
    merchant.approvedAt = new Date();
    
    await merchant.save();

    // إنشاء متجر للتاجر
    const store = new Store({
      merchant: merchant._id,
      region: merchant.region,
      name: merchant.businessName,
      description: merchant.businessDescription,
      category: merchant.businessCategory,
      subdomain: merchant.storeSubdomain,
      contactInfo: {
        phone: merchant.phone,
        whatsapp: merchant.whatsapp,
        email: merchant.email
      },
      status: 'active',
      isActive: true,
      isVerified: true,
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    });

    await store.save();

    // تحديث إحصائيات المنطقة
    const region = await Region.findById(merchant.region);
    if (region) {
      await region.updateStats();
    }

    // هنا يمكن إضافة إرسال إشعار للتاجر عبر البريد الإلكتروني أو الواتساب

    res.json({
      message: 'تم الموافقة على طلب التاجر وإنشاء متجره بنجاح',
      merchant: {
        id: merchant._id,
        name: merchant.fullName,
        businessName: merchant.businessName,
        email: merchant.email,
        status: merchant.status
      },
      store: {
        id: store._id,
        name: store.name,
        subdomain: store.subdomain,
        storeUrl: store.storeUrl
      },
      notes
    });

  } catch (error) {
    console.error('خطأ في الموافقة على التاجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في معالجة الطلب',
      code: 'APPROVE_MERCHANT_ERROR'
    });
  }
});

// رفض طلب تاجر
router.put('/merchants/:merchantId/reject', validateMongoId('merchantId'), async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        error: 'سبب الرفض مطلوب',
        code: 'REJECTION_REASON_REQUIRED'
      });
    }

    const merchant = await User.findOne({ _id: merchantId, role: 'merchant', status: 'pending' });
    
    if (!merchant) {
      return res.status(404).json({
        error: 'التاجر غير موجود أو تمت معالجة طلبه بالفعل',
        code: 'MERCHANT_NOT_FOUND'
      });
    }

    // تحديث حالة التاجر
    merchant.status = 'rejected';
    merchant.rejectionReason = rejectionReason.trim();
    merchant.approvedBy = req.user._id;
    merchant.approvedAt = new Date();
    
    await merchant.save();

    // هنا يمكن إضافة إرسال إشعار للتاجر عبر البريد الإلكتروني أو الواتساب

    res.json({
      message: 'تم رفض طلب التاجر',
      merchant: {
        id: merchant._id,
        name: merchant.fullName,
        businessName: merchant.businessName,
        email: merchant.email,
        status: merchant.status,
        rejectionReason: merchant.rejectionReason
      }
    });

  } catch (error) {
    console.error('خطأ في رفض التاجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في معالجة الطلب',
      code: 'REJECT_MERCHANT_ERROR'
    });
  }
});

// جلب جميع المستخدمين مع إمكانية الفلترة والبحث
router.get('/users', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { role, status, region, search } = req.query;

    // بناء استعلام البحث
    const query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (region) query.region = region;
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { businessName: searchRegex },
        { phone: searchRegex }
      ];
    }

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .populate('region', 'name nameEn')
        .populate('approvedBy', 'firstName lastName')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        role,
        status,
        region,
        search
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_USERS_ERROR'
    });
  }
});

// تعليق/إلغاء تعليق مستخدم
router.put('/users/:userId/toggle-suspension', validateMongoId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'المستخدم غير موجود',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        error: 'لا يمكن تعليق حساب إداري',
        code: 'CANNOT_SUSPEND_ADMIN'
      });
    }

    // تغيير حالة التعليق
    if (user.status === 'suspended') {
      user.status = 'active';
      user.rejectionReason = null;
    } else {
      user.status = 'suspended';
      if (reason) {
        user.rejectionReason = reason.trim();
      }
    }

    await user.save();

    res.json({
      message: user.status === 'suspended' ? 'تم تعليق المستخدم' : 'تم إلغاء تعليق المستخدم',
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error('خطأ في تعليق/إلغاء تعليق المستخدم:', error);
    res.status(500).json({
      error: 'حدث خطأ في معالجة الطلب',
      code: 'TOGGLE_SUSPENSION_ERROR'
    });
  }
});

// إدارة المناطق
router.get('/regions', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { isActive, search } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { nameEn: searchRegex },
        { code: searchRegex }
      ];
    }

    const [regions, totalCount] = await Promise.all([
      Region.find(query)
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Region.countDocuments(query)
    ]);

    res.json({
      regions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المناطق:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_REGIONS_ERROR'
    });
  }
});

// إنشاء منطقة جديدة
router.post('/regions', validateRegionCreation, async (req, res) => {
  try {
    const regionData = req.body;
    
    // التحقق من عدم تكرار الكود
    const existingRegion = await Region.findOne({
      $or: [
        { code: regionData.code.toUpperCase() },
        { name: regionData.name },
        { nameEn: regionData.nameEn }
      ]
    });

    if (existingRegion) {
      return res.status(400).json({
        error: 'المنطقة موجودة بالفعل (الاسم أو الكود)',
        code: 'REGION_ALREADY_EXISTS'
      });
    }

    const region = new Region(regionData);
    await region.save();

    res.status(201).json({
      message: 'تم إنشاء المنطقة بنجاح',
      region
    });

  } catch (error) {
    console.error('خطأ في إنشاء المنطقة:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'المنطقة موجودة بالفعل',
        code: 'REGION_ALREADY_EXISTS'
      });
    }
    
    res.status(500).json({
      error: 'حدث خطأ في إنشاء المنطقة',
      code: 'CREATE_REGION_ERROR'
    });
  }
});

// تحديث منطقة
router.put('/regions/:regionId', validateMongoId('regionId'), async (req, res) => {
  try {
    const { regionId } = req.params;
    const updateData = req.body;

    const region = await Region.findByIdAndUpdate(
      regionId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!region) {
      return res.status(404).json({
        error: 'المنطقة غير موجودة',
        code: 'REGION_NOT_FOUND'
      });
    }

    res.json({
      message: 'تم تحديث المنطقة بنجاح',
      region
    });

  } catch (error) {
    console.error('خطأ في تحديث المنطقة:', error);
    res.status(500).json({
      error: 'حدث خطأ في تحديث المنطقة',
      code: 'UPDATE_REGION_ERROR'
    });
  }
});

// حذف منطقة
router.delete('/regions/:regionId', validateMongoId('regionId'), async (req, res) => {
  try {
    const { regionId } = req.params;

    // التحقق من عدم وجود مستخدمين أو متاجر في هذه المنطقة
    const [usersCount, storesCount] = await Promise.all([
      User.countDocuments({ region: regionId }),
      Store.countDocuments({ region: regionId })
    ]);

    if (usersCount > 0 || storesCount > 0) {
      return res.status(400).json({
        error: 'لا يمكن حذف المنطقة لوجود مستخدمين أو متاجر بها',
        code: 'REGION_HAS_DEPENDENCIES',
        details: {
          usersCount,
          storesCount
        }
      });
    }

    const region = await Region.findByIdAndDelete(regionId);

    if (!region) {
      return res.status(404).json({
        error: 'المنطقة غير موجودة',
        code: 'REGION_NOT_FOUND'
      });
    }

    res.json({
      message: 'تم حذف المنطقة بنجاح',
      deletedRegion: {
        id: region._id,
        name: region.name,
        code: region.code
      }
    });

  } catch (error) {
    console.error('خطأ في حذف المنطقة:', error);
    res.status(500).json({
      error: 'حدث خطأ في حذف المنطقة',
      code: 'DELETE_REGION_ERROR'
    });
  }
});

// إدارة المتاجر
router.get('/stores', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, region, category, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (region) query.region = region;
    if (category) query.category = category;
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { subdomain: searchRegex }
      ];
    }

    const [stores, totalCount] = await Promise.all([
      Store.find(query)
        .populate('merchant', 'firstName lastName email phone businessName')
        .populate('region', 'name nameEn')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Store.countDocuments(query)
    ]);

    res.json({
      stores,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المتاجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_STORES_ERROR'
    });
  }
});

// تعليق/إلغاء تعليق متجر
router.put('/stores/:storeId/toggle-status', validateMongoId('storeId'), async (req, res) => {
  try {
    const { storeId } = req.params;
    const { reason } = req.body;

    const store = await Store.findById(storeId).populate('merchant');
    
    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود',
        code: 'STORE_NOT_FOUND'
      });
    }

    // تغيير حالة المتجر
    if (store.status === 'suspended') {
      store.status = 'active';
      store.isActive = true;
    } else {
      store.status = 'suspended';
      store.isActive = false;
    }

    await store.save();

    res.json({
      message: store.status === 'suspended' ? 'تم تعليق المتجر' : 'تم إلغاء تعليق المتجر',
      store: {
        id: store._id,
        name: store.name,
        merchant: store.merchant.fullName,
        status: store.status
      }
    });

  } catch (error) {
    console.error('خطأ في تعليق/إلغاء تعليق المتجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في معالجة الطلب',
      code: 'TOGGLE_STORE_STATUS_ERROR'
    });
  }
});

module.exports = router;
