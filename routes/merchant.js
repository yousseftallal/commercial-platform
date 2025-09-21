const express = require('express');
const Store = require('../models/Store');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticateToken, requireMerchant, requireActiveAccount, requireResourceOwnership } = require('../middleware/auth');
const { validateStoreCreation, validateProductCreation, validateMongoId, validatePagination } = require('../middleware/validation');
const router = express.Router();

// تطبيق المصادقة وفحص صلاحية التاجر على جميع المسارات
router.use(authenticateToken, requireMerchant);

// لوحة تحكم التاجر - الإحصائيات
router.get('/dashboard', requireActiveAccount, async (req, res) => {
  try {
    const merchantId = req.user._id;

    // جلب متجر التاجر
    const store = await Store.findOne({ merchant: merchantId }).populate('region', 'name deliveryFee');
    
    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود، يرجى التواصل مع الإدارة',
        code: 'STORE_NOT_FOUND'
      });
    }

    // جلب إحصائيات المنتجات
    const [
      totalProducts,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      activeProducts,
      lowStockProducts
    ] = await Promise.all([
      Product.countDocuments({ store: store._id }),
      Product.countDocuments({ store: store._id, status: 'approved' }),
      Product.countDocuments({ store: store._id, status: 'pending' }),
      Product.countDocuments({ store: store._id, status: 'rejected' }),
      Product.countDocuments({ store: store._id, status: 'approved', isActive: true }),
      Product.countDocuments({
        store: store._id,
        status: 'approved',
        isActive: true,
        'inventory.trackQuantity': true,
        $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] }
      })
    ]);

    // تحديث إحصائيات المتجر
    await store.updateStats();

    res.json({
      store: {
        id: store._id,
        name: store.name,
        subdomain: store.subdomain,
        storeUrl: store.storeUrl,
        status: store.status,
        isActive: store.isActive,
        isVerified: store.isVerified,
        region: store.region,
        stats: store.stats
      },
      products: {
        total: totalProducts,
        approved: approvedProducts,
        pending: pendingProducts,
        rejected: rejectedProducts,
        active: activeProducts,
        lowStock: lowStockProducts
      },
      alerts: {
        hasLowStock: lowStockProducts > 0,
        isStoreInactive: !store.isActive,
        isPendingApproval: store.status === 'pending'
      }
    });

  } catch (error) {
    console.error('خطأ في جلب إحصائيات التاجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب الإحصائيات',
      code: 'MERCHANT_DASHBOARD_ERROR'
    });
  }
});

// إدارة بيانات المتجر
router.get('/store', requireActiveAccount, async (req, res) => {
  try {
    const store = await Store.findOne({ merchant: req.user._id })
      .populate('region', 'name nameEn deliveryFee deliveryTime')
      .populate('merchant', 'firstName lastName email phone businessName businessCategory');

    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود',
        code: 'STORE_NOT_FOUND'
      });
    }

    res.json({ store });

  } catch (error) {
    console.error('خطأ في جلب بيانات المتجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_STORE_ERROR'
    });
  }
});

// تحديث بيانات المتجر
router.put('/store', requireActiveAccount, validateStoreCreation, async (req, res) => {
  try {
    const updateData = req.body;
    
    // منع تحديث بعض الحقول الحساسة
    delete updateData.merchant;
    delete updateData.region;
    delete updateData.subdomain;
    delete updateData.status;
    delete updateData.isVerified;
    delete updateData.stats;

    const store = await Store.findOneAndUpdate(
      { merchant: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('region', 'name nameEn');

    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود',
        code: 'STORE_NOT_FOUND'
      });
    }

    res.json({
      message: 'تم تحديث بيانات المتجر بنجاح',
      store
    });

  } catch (error) {
    console.error('خطأ في تحديث المتجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في تحديث البيانات',
      code: 'UPDATE_STORE_ERROR'
    });
  }
});

// إدارة المنتجات
router.get('/products', requireActiveAccount, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { status, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // جلب متجر التاجر
    const store = await Store.findOne({ merchant: req.user._id });
    
    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود',
        code: 'STORE_NOT_FOUND'
      });
    }

    // بناء استعلام البحث
    const query = { store: store._id };
    
    if (status) query.status = status;
    if (category) query.category = category;
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // بناء ترتيب النتائج
    const sortOptions = {};
    const validSortFields = {
      'name': 'name',
      'price': 'price',
      'quantity': 'inventory.quantity',
      'sales': 'stats.sales',
      'views': 'stats.views',
      'createdAt': 'createdAt'
    };

    const sortField = validSortFields[sortBy] || 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        status,
        category,
        search,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('خطأ في جلب منتجات التاجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب المنتجات',
      code: 'FETCH_PRODUCTS_ERROR'
    });
  }
});

// إضافة منتج جديد
router.post('/products', requireActiveAccount, validateProductCreation, async (req, res) => {
  try {
    // جلب متجر التاجر
    const store = await Store.findOne({ merchant: req.user._id });
    
    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود',
        code: 'STORE_NOT_FOUND'
      });
    }

    if (!store.isActive || store.status !== 'active') {
      return res.status(403).json({
        error: 'المتجر غير نشط، لا يمكن إضافة منتجات',
        code: 'STORE_INACTIVE'
      });
    }

    const productData = {
      ...req.body,
      store: store._id,
      status: store.settings.autoApproveProducts ? 'approved' : 'pending'
    };

    const product = new Product(productData);
    await product.save();

    // تحديث إحصائيات المتجر
    await store.updateStats();

    res.status(201).json({
      message: product.status === 'approved' 
        ? 'تم إضافة المنتج بنجاح' 
        : 'تم إضافة المنتج وهو قيد المراجعة',
      product
    });

  } catch (error) {
    console.error('خطأ في إضافة المنتج:', error);
    res.status(500).json({
      error: 'حدث خطأ في إضافة المنتج',
      code: 'CREATE_PRODUCT_ERROR'
    });
  }
});

// تحديث منتج
router.put('/products/:productId', 
  requireActiveAccount, 
  validateMongoId('productId'),
  requireResourceOwnership('Product', 'productId'),
  async (req, res) => {
    try {
      const updateData = req.body;
      
      // منع تحديث بعض الحقول الحساسة
      delete updateData.store;
      delete updateData.status;
      delete updateData.stats;
      delete updateData.approvedBy;
      delete updateData.approvedAt;

      // إذا تم تحديث محتوى مهم، قد تحتاج الموافقة مرة أخرى
      const product = req.resource;
      if (product.status === 'approved' && 
          (updateData.name || updateData.description || updateData.price)) {
        
        const store = await Store.findById(product.store);
        if (!store.settings.autoApproveProducts) {
          updateData.status = 'pending';
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.productId,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        message: 'تم تحديث المنتج بنجاح',
        product: updatedProduct
      });

    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error);
      res.status(500).json({
        error: 'حدث خطأ في تحديث المنتج',
        code: 'UPDATE_PRODUCT_ERROR'
      });
    }
  }
);

// حذف منتج
router.delete('/products/:productId',
  requireActiveAccount,
  validateMongoId('productId'),
  requireResourceOwnership('Product', 'productId'),
  async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.productId);

      // تحديث إحصائيات المتجر
      const store = await Store.findOne({ merchant: req.user._id });
      if (store) {
        await store.updateStats();
      }

      res.json({
        message: 'تم حذف المنتج بنجاح'
      });

    } catch (error) {
      console.error('خطأ في حذف المنتج:', error);
      res.status(500).json({
        error: 'حدث خطأ في حذف المنتج',
        code: 'DELETE_PRODUCT_ERROR'
      });
    }
  }
);

// تفعيل/إلغاء تفعيل منتج
router.put('/products/:productId/toggle-status',
  requireActiveAccount,
  validateMongoId('productId'),
  requireResourceOwnership('Product', 'productId'),
  async (req, res) => {
    try {
      const product = req.resource;
      
      if (product.status !== 'approved') {
        return res.status(400).json({
          error: 'لا يمكن تفعيل منتج غير معتمد',
          code: 'PRODUCT_NOT_APPROVED'
        });
      }

      product.isActive = !product.isActive;
      await product.save();

      res.json({
        message: product.isActive ? 'تم تفعيل المنتج' : 'تم إلغاء تفعيل المنتج',
        product: {
          id: product._id,
          name: product.name,
          isActive: product.isActive
        }
      });

    } catch (error) {
      console.error('خطأ في تغيير حالة المنتج:', error);
      res.status(500).json({
        error: 'حدث خطأ في تغيير حالة المنتج',
        code: 'TOGGLE_PRODUCT_STATUS_ERROR'
      });
    }
  }
);

// جلب تفاصيل منتج واحد
router.get('/products/:productId',
  requireActiveAccount,
  validateMongoId('productId'),
  requireResourceOwnership('Product', 'productId'),
  async (req, res) => {
    try {
      const product = req.resource;
      
      res.json({ product });

    } catch (error) {
      console.error('خطأ في جلب تفاصيل المنتج:', error);
      res.status(500).json({
        error: 'حدث خطأ في جلب البيانات',
        code: 'FETCH_PRODUCT_ERROR'
      });
    }
  }
);

// جلب المنتجات المرفوضة مع أسباب الرفض
router.get('/products/rejected/reasons', requireActiveAccount, async (req, res) => {
  try {
    const store = await Store.findOne({ merchant: req.user._id });
    
    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود',
        code: 'STORE_NOT_FOUND'
      });
    }

    const rejectedProducts = await Product.find({
      store: store._id,
      status: 'rejected'
    }).select('name rejectionReason createdAt updatedAt');

    res.json({
      rejectedProducts
    });

  } catch (error) {
    console.error('خطأ في جلب المنتجات المرفوضة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_REJECTED_PRODUCTS_ERROR'
    });
  }
});

// تحديث بيانات التاجر الشخصية
router.put('/profile', requireActiveAccount, async (req, res) => {
  try {
    const updateData = req.body;
    
    // منع تحديث بعض الحقول الحساسة
    delete updateData.email;
    delete updateData.role;
    delete updateData.status;
    delete updateData.password;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'تم تحديث البيانات الشخصية بنجاح',
      user: updatedUser
    });

  } catch (error) {
    console.error('خطأ في تحديث البيانات الشخصية:', error);
    res.status(500).json({
      error: 'حدث خطأ في تحديث البيانات',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

module.exports = router;
