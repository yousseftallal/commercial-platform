const express = require('express');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');
const { validatePagination, validateSearch, validateMongoId } = require('../middleware/validation');
const router = express.Router();

// جلب جميع المنتجات النشطة
router.get('/', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { 
      category, 
      region, 
      store, 
      search, 
      sortBy = 'newest', 
      sortOrder = 'desc', 
      minPrice, 
      maxPrice,
      featured,
      onSale
    } = req.query;

    // بناء استعلام البحث
    const query = {
      status: 'approved',
      isActive: true
    };

    // فلترة حسب الفئة
    if (category) query.category = category;

    // فلترة حسب المتجر
    if (store) query.store = store;

    // فلترة حسب المنطقة
    if (region) {
      const storesInRegion = await Store.find({
        region: region,
        isActive: true,
        status: 'active'
      }).select('_id');
      
      query.store = { $in: storesInRegion.map(s => s._id) };
    }

    // فلترة حسب المنتجات المميزة
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // فلترة حسب المنتجات المخفضة
    if (onSale === 'true') {
      query['promotion.isOnSale'] = true;
    }

    // البحث النصي
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { tags: { $in: [searchRegex] } },
        { searchKeywords: { $in: [searchRegex] } }
      ];
    }

    // فلترة حسب السعر
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // بناء ترتيب النتائج
    const sortOptions = {};
    const validSortFields = {
      'name': 'name',
      'price_low': 'price',
      'price_high': 'price',
      'rating': 'stats.averageRating',
      'sales': 'stats.sales',
      'views': 'stats.views',
      'newest': 'createdAt',
      'featured': 'isFeatured'
    };

    const sortField = validSortFields[sortBy] || 'createdAt';
    const sortDirection = (sortBy === 'price_high') ? -1 : (sortOrder === 'asc' ? 1 : -1);
    sortOptions[sortField] = sortDirection;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('store', 'name subdomain region merchant')
        .populate({
          path: 'store',
          populate: {
            path: 'region',
            select: 'name deliveryFee'
          }
        })
        .select('name shortDescription price originalPrice discountPercentage images category stats inventory isFeatured promotion')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    res.json({
      products: products.map(product => ({
        ...product.toObject(),
        primaryImage: product.primaryImage,
        discountedPrice: product.discountedPrice,
        isInStock: product.isInStock
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        category,
        region,
        store,
        search,
        sortBy,
        sortOrder,
        minPrice,
        maxPrice,
        featured,
        onSale
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المنتجات:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_PRODUCTS_ERROR'
    });
  }
});

// جلب المنتجات المميزة
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const { category, region } = req.query;

    const query = {
      status: 'approved',
      isActive: true,
      isFeatured: true
    };

    if (category) query.category = category;

    if (region) {
      const storesInRegion = await Store.find({
        region: region,
        isActive: true,
        status: 'active'
      }).select('_id');
      
      query.store = { $in: storesInRegion.map(s => s._id) };
    }

    const products = await Product.find(query)
      .populate('store', 'name subdomain')
      .select('name shortDescription price originalPrice discountPercentage images category stats')
      .sort({ 'stats.sales': -1, 'stats.averageRating': -1 })
      .limit(limit);

    res.json({
      products: products.map(product => ({
        ...product.toObject(),
        primaryImage: product.primaryImage,
        discountedPrice: product.discountedPrice,
        isInStock: product.isInStock
      }))
    });

  } catch (error) {
    console.error('خطأ في جلب المنتجات المميزة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_FEATURED_PRODUCTS_ERROR'
    });
  }
});

// جلب المنتجات المخفضة
router.get('/on-sale', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, region } = req.query;

    const query = {
      status: 'approved',
      isActive: true,
      $or: [
        { 'promotion.isOnSale': true },
        { discountPercentage: { $gt: 0 } }
      ]
    };

    if (category) query.category = category;

    if (region) {
      const storesInRegion = await Store.find({
        region: region,
        isActive: true,
        status: 'active'
      }).select('_id');
      
      query.store = { $in: storesInRegion.map(s => s._id) };
    }

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('store', 'name subdomain')
        .select('name shortDescription price originalPrice discountPercentage images category stats promotion')
        .sort({ discountPercentage: -1, 'stats.sales': -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    res.json({
      products: products.map(product => ({
        ...product.toObject(),
        primaryImage: product.primaryImage,
        discountedPrice: product.discountedPrice,
        isInStock: product.isInStock,
        savings: product.originalPrice ? product.originalPrice - product.discountedPrice : 0
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المنتجات المخفضة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_SALE_PRODUCTS_ERROR'
    });
  }
});

// جلب تفاصيل منتج واحد
router.get('/:productId', optionalAuth, validateMongoId('productId'), async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      status: 'approved',
      isActive: true
    }).populate({
      path: 'store',
      select: 'name subdomain region merchant contactInfo businessHours delivery stats',
      populate: [
        { path: 'region', select: 'name deliveryFee deliveryTime' },
        { path: 'merchant', select: 'firstName lastName businessName' }
      ]
    });

    if (!product) {
      return res.status(404).json({
        error: 'المنتج غير موجود أو غير متاح',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // تحديث عدد المشاهدات
    if (!req.user || req.user.role !== 'admin') {
      await product.incrementViews();
    }

    // جلب منتجات مشابهة من نفس المتجر
    const relatedFromStore = await Product.find({
      store: product.store._id,
      status: 'approved',
      isActive: true,
      _id: { $ne: product._id }
    })
    .select('name price originalPrice discountPercentage images stats')
    .sort({ 'stats.sales': -1 })
    .limit(4);

    // جلب منتجات مشابهة من نفس الفئة
    const relatedFromCategory = await Product.find({
      category: product.category,
      status: 'approved',
      isActive: true,
      _id: { $ne: product._id },
      store: { $ne: product.store._id }
    })
    .populate('store', 'name subdomain')
    .select('name price originalPrice discountPercentage images stats')
    .sort({ 'stats.sales': -1, 'stats.averageRating': -1 })
    .limit(6);

    res.json({
      product: {
        ...product.toObject(),
        primaryImage: product.primaryImage,
        discountedPrice: product.discountedPrice,
        isInStock: product.isInStock,
        isLowStock: product.isLowStock
      },
      store: {
        ...product.store.toObject(),
        isOpen: product.store.isOpen
      },
      relatedProducts: {
        fromStore: relatedFromStore.map(p => ({
          ...p.toObject(),
          primaryImage: p.primaryImage,
          discountedPrice: p.discountedPrice
        })),
        fromCategory: relatedFromCategory.map(p => ({
          ...p.toObject(),
          primaryImage: p.primaryImage,
          discountedPrice: p.discountedPrice
        }))
      }
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل المنتج:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_PRODUCT_ERROR'
    });
  }
});

// البحث في المنتجات
router.get('/search/:query', optionalAuth, validatePagination, async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, region, minPrice, maxPrice, sortBy = 'relevance' } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'كلمة البحث يجب أن تكون حرفين على الأقل',
        code: 'SEARCH_QUERY_TOO_SHORT'
      });
    }

    // بناء استعلام البحث
    const searchRegex = new RegExp(query, 'i');
    const searchQuery = {
      status: 'approved',
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { tags: { $in: [searchRegex] } },
        { searchKeywords: { $in: [searchRegex] } }
      ]
    };

    // فلترة حسب الفئة
    if (category) {
      searchQuery.category = category;
    }

    // فلترة حسب المنطقة
    if (region) {
      const storesInRegion = await Store.find({
        region: region,
        isActive: true,
        status: 'active'
      }).select('_id');
      
      searchQuery.store = { $in: storesInRegion.map(s => s._id) };
    }

    // فلترة حسب السعر
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    // ترتيب النتائج
    const sortOptions = {};
    switch (sortBy) {
      case 'price_low':
        sortOptions.price = 1;
        break;
      case 'price_high':
        sortOptions.price = -1;
        break;
      case 'rating':
        sortOptions['stats.averageRating'] = -1;
        break;
      case 'sales':
        sortOptions['stats.sales'] = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      default: // relevance
        sortOptions['stats.sales'] = -1;
        sortOptions['stats.averageRating'] = -1;
    }

    const [products, totalCount] = await Promise.all([
      Product.find(searchQuery)
        .populate('store', 'name subdomain region')
        .select('name shortDescription price originalPrice discountPercentage images category stats inventory')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(searchQuery)
    ]);

    res.json({
      query,
      products: products.map(product => ({
        ...product.toObject(),
        primaryImage: product.primaryImage,
        discountedPrice: product.discountedPrice,
        isInStock: product.isInStock
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        query,
        category,
        region,
        minPrice,
        maxPrice,
        sortBy
      }
    });

  } catch (error) {
    console.error('خطأ في البحث عن المنتجات:', error);
    res.status(500).json({
      error: 'حدث خطأ في البحث',
      code: 'SEARCH_PRODUCTS_ERROR'
    });
  }
});

// جلب الفئات المتاحة
router.get('/categories/list', optionalAuth, async (req, res) => {
  try {
    const { region } = req.query;

    let matchQuery = {
      status: 'approved',
      isActive: true
    };

    // فلترة حسب المنطقة إذا تم تحديدها
    if (region) {
      const storesInRegion = await Store.find({
        region: region,
        isActive: true,
        status: 'active'
      }).select('_id');
      
      matchQuery.store = { $in: storesInRegion.map(s => s._id) };
    }

    const categories = await Product.aggregate([
      { $match: matchQuery },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        } 
      },
      { $sort: { count: -1 } },
      { 
        $project: { 
          category: '$_id', 
          count: 1, 
          avgPrice: { $round: ['$avgPrice', 2] },
          minPrice: 1,
          maxPrice: 1,
          _id: 0 
        } 
      }
    ]);

    res.json({ categories });

  } catch (error) {
    console.error('خطأ في جلب فئات المنتجات:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_CATEGORIES_ERROR'
    });
  }
});

// إدارة المنتجات (للإداري فقط)
router.get('/admin/pending', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      Product.find({ status: 'pending' })
        .populate('store', 'name subdomain merchant')
        .populate({
          path: 'store',
          populate: {
            path: 'merchant',
            select: 'firstName lastName businessName email'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ status: 'pending' })
    ]);

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('خطأ في جلب المنتجات المعلقة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_PENDING_PRODUCTS_ERROR'
    });
  }
});

// الموافقة على منتج (للإداري فقط)
router.put('/admin/:productId/approve', authenticateToken, requireAdmin, validateMongoId('productId'), async (req, res) => {
  try {
    const { productId } = req.params;
    const { notes } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: productId, status: 'pending' },
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('store', 'name merchant');

    if (!product) {
      return res.status(404).json({
        error: 'المنتج غير موجود أو تمت معالجته بالفعل',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // تحديث إحصائيات المتجر
    const store = await Store.findById(product.store._id);
    if (store) {
      await store.updateStats();
    }

    res.json({
      message: 'تم الموافقة على المنتج بنجاح',
      product: {
        id: product._id,
        name: product.name,
        status: product.status,
        storeName: product.store.name
      },
      notes
    });

  } catch (error) {
    console.error('خطأ في الموافقة على المنتج:', error);
    res.status(500).json({
      error: 'حدث خطأ في معالجة الطلب',
      code: 'APPROVE_PRODUCT_ERROR'
    });
  }
});

// رفض منتج (للإداري فقط)
router.put('/admin/:productId/reject', authenticateToken, requireAdmin, validateMongoId('productId'), async (req, res) => {
  try {
    const { productId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        error: 'سبب الرفض مطلوب',
        code: 'REJECTION_REASON_REQUIRED'
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, status: 'pending' },
      {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('store', 'name merchant');

    if (!product) {
      return res.status(404).json({
        error: 'المنتج غير موجود أو تمت معالجته بالفعل',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    res.json({
      message: 'تم رفض المنتج',
      product: {
        id: product._id,
        name: product.name,
        status: product.status,
        rejectionReason: product.rejectionReason,
        storeName: product.store.name
      }
    });

  } catch (error) {
    console.error('خطأ في رفض المنتج:', error);
    res.status(500).json({
      error: 'حدث خطأ في معالجة الطلب',
      code: 'REJECT_PRODUCT_ERROR'
    });
  }
});

module.exports = router;
