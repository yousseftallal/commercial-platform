const express = require('express');
const Store = require('../models/Store');
const Product = require('../models/Product');
const { optionalAuth } = require('../middleware/auth');
const { validatePagination, validateSearch, validateMongoId } = require('../middleware/validation');
const router = express.Router();

// جلب جميع المتاجر النشطة
router.get('/', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, region, search, sortBy = 'rating', sortOrder = 'desc', featured } = req.query;

    // بناء استعلام البحث
    const query = {
      isActive: true,
      status: 'active'
    };

    if (category) query.category = category;
    if (region) query.region = region;
    if (featured === 'true') query.isFeatured = true;

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
      'newest': 'createdAt',
      'views': 'stats.views'
    };

    const sortField = validSortFields[sortBy] || 'stats.averageRating';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [stores, totalCount] = await Promise.all([
      Store.find(query)
        .populate('region', 'name nameEn deliveryFee')
        .populate('merchant', 'firstName lastName businessName')
        .select('name description category subdomain logo stats contactInfo businessHours')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Store.countDocuments(query)
    ]);

    res.json({
      stores: stores.map(store => ({
        ...store.toObject(),
        isOpen: store.isOpen,
        storeUrl: store.storeUrl
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
        search,
        sortBy,
        sortOrder,
        featured
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

// جلب المتاجر المميزة
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const stores = await Store.find({
      isActive: true,
      status: 'active',
      isFeatured: true
    })
    .populate('region', 'name nameEn')
    .populate('merchant', 'businessName')
    .select('name description category subdomain logo stats contactInfo')
    .sort({ 'stats.averageRating': -1, 'stats.totalOrders': -1 })
    .limit(limit);

    res.json({
      stores: stores.map(store => ({
        ...store.toObject(),
        isOpen: store.isOpen,
        storeUrl: store.storeUrl
      }))
    });

  } catch (error) {
    console.error('خطأ في جلب المتاجر المميزة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_FEATURED_STORES_ERROR'
    });
  }
});

// جلب تفاصيل متجر بالـ subdomain
router.get('/by-subdomain/:subdomain', optionalAuth, async (req, res) => {
  try {
    const { subdomain } = req.params;

    const store = await Store.findOne({
      subdomain: subdomain.toLowerCase(),
      isActive: true,
      status: 'active'
    })
    .populate('region', 'name nameEn deliveryFee deliveryTime')
    .populate('merchant', 'firstName lastName businessName businessCategory');

    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود أو غير متاح',
        code: 'STORE_NOT_FOUND'
      });
    }

    // تحديث عدد المشاهدات
    if (!req.user || req.user.role !== 'admin') {
      await store.incrementViews();
    }

    // جلب إحصائيات إضافية
    const [activeProductsCount, productCategories] = await Promise.all([
      Product.countDocuments({
        store: store._id,
        status: 'approved',
        isActive: true
      }),
      Product.aggregate([
        {
          $match: {
            store: store._id,
            status: 'approved',
            isActive: true
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    res.json({
      store: {
        ...store.toObject(),
        isOpen: store.isOpen,
        storeUrl: store.storeUrl,
        activeProductsCount
      },
      productCategories: productCategories.map(cat => ({
        category: cat._id,
        count: cat.count
      }))
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل المتجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_STORE_ERROR'
    });
  }
});

// جلب تفاصيل متجر بالـ ID
router.get('/:storeId', optionalAuth, validateMongoId('storeId'), async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findOne({
      _id: storeId,
      isActive: true,
      status: 'active'
    })
    .populate('region', 'name nameEn deliveryFee deliveryTime')
    .populate('merchant', 'firstName lastName businessName businessCategory');

    if (!store) {
      return res.status(404).json({
        error: 'المتجر غير موجود أو غير متاح',
        code: 'STORE_NOT_FOUND'
      });
    }

    // تحديث عدد المشاهدات
    if (!req.user || req.user.role !== 'admin') {
      await store.incrementViews();
    }

    // جلب إحصائيات إضافية
    const [activeProductsCount, productCategories, recentProducts] = await Promise.all([
      Product.countDocuments({
        store: store._id,
        status: 'approved',
        isActive: true
      }),
      Product.aggregate([
        {
          $match: {
            store: store._id,
            status: 'approved',
            isActive: true
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]),
      Product.find({
        store: store._id,
        status: 'approved',
        isActive: true
      })
      .select('name price originalPrice discountPercentage images')
      .sort({ createdAt: -1 })
      .limit(6)
    ]);

    res.json({
      store: {
        ...store.toObject(),
        isOpen: store.isOpen,
        storeUrl: store.storeUrl,
        activeProductsCount
      },
      productCategories: productCategories.map(cat => ({
        category: cat._id,
        count: cat.count
      })),
      recentProducts: recentProducts.map(product => ({
        ...product.toObject(),
        primaryImage: product.primaryImage,
        discountedPrice: product.discountedPrice
      }))
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
router.get('/:storeId/products', optionalAuth, validateMongoId('storeId'), validatePagination, async (req, res) => {
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
    }).select('name subdomain');

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
      'newest': 'createdAt',
      'featured': 'isFeatured'
    };

    const sortField = validSortFields[sortBy] || 'createdAt';
    const sortDirection = (sortBy === 'price_high') ? -1 : (sortOrder === 'asc' ? 1 : -1);
    sortOptions[sortField] = sortDirection;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .select('name shortDescription price originalPrice discountPercentage images category stats inventory isFeatured')
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

// البحث في المتاجر
router.get('/search/:query', optionalAuth, async (req, res) => {
  try {
    const { query } = req.params;
    const { region, category, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'كلمة البحث يجب أن تكون حرفين على الأقل',
        code: 'SEARCH_QUERY_TOO_SHORT'
      });
    }

    const searchRegex = new RegExp(query, 'i');
    const searchQuery = {
      isActive: true,
      status: 'active',
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    };

    if (region) searchQuery.region = region;
    if (category) searchQuery.category = category;

    const stores = await Store.find(searchQuery)
      .populate('region', 'name nameEn')
      .populate('merchant', 'businessName')
      .select('name description category subdomain logo stats contactInfo')
      .sort({ 'stats.averageRating': -1, 'stats.totalOrders': -1 })
      .limit(parseInt(limit));

    res.json({
      query,
      stores: stores.map(store => ({
        ...store.toObject(),
        isOpen: store.isOpen,
        storeUrl: store.storeUrl
      })),
      totalFound: stores.length
    });

  } catch (error) {
    console.error('خطأ في البحث عن المتاجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في البحث',
      code: 'SEARCH_STORES_ERROR'
    });
  }
});

// جلب إحصائيات المتاجر العامة
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalStores,
      activeStores,
      storesByCategory,
      storesByRegion,
      topStores
    ] = await Promise.all([
      Store.countDocuments(),
      Store.countDocuments({ isActive: true, status: 'active' }),
      Store.aggregate([
        { $match: { isActive: true, status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Store.aggregate([
        { $match: { isActive: true, status: 'active' } },
        { $group: { _id: '$region', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'regions',
            localField: '_id',
            foreignField: '_id',
            as: 'regionInfo'
          }
        },
        { $unwind: '$regionInfo' },
        {
          $project: {
            regionName: '$regionInfo.name',
            count: 1
          }
        }
      ]),
      Store.find({
        isActive: true,
        status: 'active'
      })
      .select('name subdomain stats category')
      .sort({ 'stats.averageRating': -1, 'stats.totalOrders': -1 })
      .limit(10)
      .populate('merchant', 'businessName')
    ]);

    res.json({
      statistics: {
        stores: {
          total: totalStores,
          active: activeStores
        },
        distribution: {
          byCategory: storesByCategory.map(cat => ({
            category: cat._id,
            count: cat.count
          })),
          byRegion: storesByRegion
        },
        topStores: topStores.map(store => ({
          id: store._id,
          name: store.name,
          subdomain: store.subdomain,
          category: store.category,
          businessName: store.merchant?.businessName,
          rating: store.stats.averageRating,
          orders: store.stats.totalOrders
        }))
      }
    });

  } catch (error) {
    console.error('خطأ في جلب إحصائيات المتاجر:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب الإحصائيات',
      code: 'FETCH_STORES_STATS_ERROR'
    });
  }
});

module.exports = router;
