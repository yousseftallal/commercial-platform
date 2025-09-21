const express = require('express');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Region = require('../models/Region');
const { optionalAuth, authenticateToken, requireCustomer } = require('../middleware/auth');
const { validatePagination, validateSearch, validateMongoId } = require('../middleware/validation');
const router = express.Router();

// جلب المتاجر في منطقة العميل
router.get('/stores', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, search, sortBy = 'rating', sortOrder = 'desc', regionId } = req.query;

    // تحديد المنطقة
    let targetRegionId = regionId;
    if (req.user && req.user.region && !regionId) {
      targetRegionId = req.user.region;
    }

    if (!targetRegionId) {
      return res.status(400).json({
        error: 'يجب تحديد المنطقة',
        code: 'REGION_REQUIRED'
      });
    }

    // بناء استعلام البحث
    const query = {
      region: targetRegionId,
      isActive: true,
      status: 'active'
    };

    if (category) {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // بناء ترتيب النتائج
    const sortOptions = {};
    const validSortFields = {
      'name': 'name',
      'rating': 'stats.averageRating',
      'orders': 'stats.totalOrders',
      'products': 'stats.totalProducts',
      'newest': 'createdAt'
    };

    const sortField = validSortFields[sortBy] || 'stats.averageRating';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [stores, totalCount, region] = await Promise.all([
      Store.find(query)
        .populate('merchant', 'firstName lastName businessName')
        .select('name description category subdomain logo stats contactInfo businessHours')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Store.countDocuments(query),
      Region.findById(targetRegionId).select('name nameEn deliveryFee deliveryTime')
    ]);

    if (!region) {
      return res.status(404).json({
        error: 'المنطقة غير موجودة',
        code: 'REGION_NOT_FOUND'
      });
    }

    res.json({
      stores: stores.map(store => ({
        ...store.toObject(),
        isOpen: store.isOpen // Virtual field
      })),
      region,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        category,
        search,
        sortBy,
        sortOrder
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

// جلب تفاصيل متجر واحد
router.get('/stores/:storeId', optionalAuth, validateMongoId('storeId'), async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findOne({
      _id: storeId,
      isActive: true,
      status: 'active'
    })
    .populate('merchant', 'firstName lastName businessName businessCategory')
    .populate('region', 'name nameEn deliveryFee deliveryTime');

    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود أو غير متاح',
        code: 'STORE_NOT_FOUND'
      });
    }

    // تحديث عدد المشاهدات
    await store.incrementViews();

    // جلب عدد المنتجات النشطة
    const activeProductsCount = await Product.countDocuments({
      store: store._id,
      status: 'approved',
      isActive: true
    });

    res.json({
      store: {
        ...store.toObject(),
        isOpen: store.isOpen,
        activeProductsCount
      }
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل المتجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_STORE_ERROR'
    });
  }
});

// جلب منتجات متجر معين
router.get('/stores/:storeId/products', optionalAuth, validateMongoId('storeId'), validatePagination, async (req, res) => {
  try {
    const { storeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, search, sortBy = 'newest', sortOrder = 'desc', minPrice, maxPrice } = req.query;

    // التحقق من وجود المتجر
    const store = await Store.findOne({
      _id: storeId,
      isActive: true,
      status: 'active'
    }).select('name subdomain region');

    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود أو غير متاح',
        code: 'STORE_NOT_FOUND'
      });
    }

    // بناء استعلام البحث
    const query = {
      store: storeId,
      status: 'approved',
      isActive: true
    };

    if (category) query.category = category;
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

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
      'newest': 'createdAt'
    };

    const sortField = validSortFields[sortBy] || 'createdAt';
    const sortDirection = (sortBy === 'price_high') ? -1 : (sortOrder === 'asc' ? 1 : -1);
    sortOptions[sortField] = sortDirection;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .select('name shortDescription price originalPrice discountPercentage images category stats inventory seo')
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
      store: {
        id: store._id,
        name: store.name,
        subdomain: store.subdomain
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      filters: {
        category,
        search,
        sortBy,
        sortOrder,
        minPrice,
        maxPrice
      }
    });

  } catch (error) {
    console.error('خطأ في جلب منتجات المتجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_STORE_PRODUCTS_ERROR'
    });
  }
});

// جلب تفاصيل منتج واحد
router.get('/products/:productId', optionalAuth, validateMongoId('productId'), async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      status: 'approved',
      isActive: true
    }).populate({
      path: 'store',
      select: 'name subdomain region merchant contactInfo businessHours delivery',
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
    await product.incrementViews();

    // جلب منتجات مشابهة
    const relatedProducts = await Product.find({
      category: product.category,
      store: { $ne: product.store._id },
      status: 'approved',
      isActive: true,
      _id: { $ne: product._id }
    })
    .select('name price originalPrice discountPercentage images stats')
    .limit(6)
    .sort({ 'stats.sales': -1 });

    res.json({
      product: {
        ...product.toObject(),
        primaryImage: product.primaryImage,
        discountedPrice: product.discountedPrice,
        isInStock: product.isInStock,
        isLowStock: product.isLowStock
      },
      relatedProducts: relatedProducts.map(p => ({
        ...p.toObject(),
        primaryImage: p.primaryImage,
        discountedPrice: p.discountedPrice
      })),
      store: {
        ...product.store.toObject(),
        isOpen: product.store.isOpen
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

// البحث العام في المنتجات
router.get('/search/products', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { q: search, category, minPrice, maxPrice, regionId, sortBy = 'relevance', sortOrder = 'desc' } = req.query;

    if (!search || search.length < 2) {
      return res.status(400).json({
        error: 'كلمة البحث يجب أن تكون حرفين على الأقل',
        code: 'SEARCH_QUERY_TOO_SHORT'
      });
    }

    // بناء استعلام البحث
    const searchQuery = {
      status: 'approved',
      isActive: true
    };

    // إضافة البحث النصي
    const searchRegex = new RegExp(search, 'i');
    searchQuery.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { shortDescription: searchRegex },
      { tags: { $in: [searchRegex] } },
      { searchKeywords: { $in: [searchRegex] } }
    ];

    // فلترة حسب الفئة
    if (category) {
      searchQuery.category = category;
    }

    // فلترة حسب السعر
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    // فلترة حسب المنطقة
    if (regionId) {
      const storesInRegion = await Store.find({
        region: regionId,
        isActive: true,
        status: 'active'
      }).select('_id');
      
      searchQuery.store = { $in: storesInRegion.map(s => s._id) };
    } else if (req.user && req.user.region) {
      // إذا كان المستخدم مسجل، ابحث في منطقته افتراضياً
      const storesInUserRegion = await Store.find({
        region: req.user.region,
        isActive: true,
        status: 'active'
      }).select('_id');
      
      searchQuery.store = { $in: storesInUserRegion.map(s => s._id) };
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
      query: search,
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
        search,
        category,
        minPrice,
        maxPrice,
        regionId,
        sortBy,
        sortOrder
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

// جلب الفئات المتاحة في منطقة معينة
router.get('/categories', optionalAuth, async (req, res) => {
  try {
    const { regionId } = req.query;
    
    let targetRegionId = regionId;
    if (req.user && req.user.region && !regionId) {
      targetRegionId = req.user.region;
    }

    const matchQuery = {
      isActive: true,
      status: 'active'
    };

    if (targetRegionId) {
      matchQuery.region = targetRegionId;
    }

    const categories = await Store.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({ categories });

  } catch (error) {
    console.error('خطأ في جلب الفئات:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_CATEGORIES_ERROR'
    });
  }
});

// إضافة منتج إلى قائمة الأمنيات (للعملاء المسجلين فقط)
router.post('/wishlist/:productId', authenticateToken, requireCustomer, validateMongoId('productId'), async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      status: 'approved',
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        error: 'المنتج غير موجود',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // هنا يمكن إضافة منطق حفظ قائمة الأمنيات في قاعدة البيانات
    // لبساطة المثال، سنرد برسالة نجاح
    
    await product.incrementWishlist();

    res.json({
      message: 'تم إضافة المنتج إلى قائمة الأمنيات',
      productId
    });

  } catch (error) {
    console.error('خطأ في إضافة المنتج إلى قائمة الأمنيات:', error);
    res.status(500).json({
      error: 'حدث خطأ في معالجة الطلب',
      code: 'ADD_TO_WISHLIST_ERROR'
    });
  }
});

module.exports = router;
