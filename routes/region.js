const express = require('express');
const Region = require('../models/Region');
const Store = require('../models/Store');
const { optionalAuth } = require('../middleware/auth');
const { validatePagination, validateSearch } = require('../middleware/validation');
const router = express.Router();

// جلب جميع المناطق النشطة (متاح للجميع)
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { featured, search } = req.query;

    // بناء استعلام البحث
    const query = { isActive: true };
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { nameEn: searchRegex },
        { code: searchRegex },
        { description: searchRegex }
      ];
    }

    const [regions, totalCount] = await Promise.all([
      Region.find(query)
        .select('name nameEn code coordinates deliveryFee deliveryTime description image stats isFeatured')
        .sort({ sortOrder: 1, isFeatured: -1, name: 1 })
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

// جلب المناطق المميزة فقط
router.get('/featured', async (req, res) => {
  try {
    const regions = await Region.findFeatured()
      .select('name nameEn code coordinates deliveryFee deliveryTime description image stats');

    res.json({
      regions
    });

  } catch (error) {
    console.error('خطأ في جلب المناطق المميزة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_FEATURED_REGIONS_ERROR'
    });
  }
});

// جلب تفاصيل منطقة واحدة
router.get('/:regionId', optionalAuth, async (req, res) => {
  try {
    const { regionId } = req.params;
    
    let region;
    
    // إذا كان regionId يبدو كـ ObjectId، ابحث بالـ ID
    if (regionId.match(/^[0-9a-fA-F]{24}$/)) {
      region = await Region.findOne({ _id: regionId, isActive: true });
    } else {
      // وإلا ابحث بالكود أو slug
      region = await Region.findOne({
        $or: [
          { code: regionId.toUpperCase() },
          { slug: regionId.toLowerCase() }
        ],
        isActive: true
      });
    }
    
    if (!region) {
      return res.status(404).json({
        error: 'المنطقة غير موجودة',
        code: 'REGION_NOT_FOUND'
      });
    }

    // جلب إحصائيات إضافية
    const [storesCount, categoriesStats] = await Promise.all([
      Store.countDocuments({ region: region._id, isActive: true, status: 'active' }),
      Store.aggregate([
        { $match: { region: region._id, isActive: true, status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // تحديث عدد المشاهدات إذا لم يكن المستخدم إداري
    if (!req.user || req.user.role !== 'admin') {
      region.stats.views = (region.stats.views || 0) + 1;
      await region.save();
    }

    res.json({
      region: {
        ...region.toObject(),
        stats: {
          ...region.stats,
          activeStores: storesCount
        }
      },
      storesCount,
      categoriesStats: categoriesStats.map(cat => ({
        category: cat._id,
        count: cat.count
      }))
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل المنطقة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_REGION_ERROR'
    });
  }
});

// جلب المتاجر في منطقة معينة
router.get('/:regionId/stores', optionalAuth, validatePagination, validateSearch, async (req, res) => {
  try {
    const { regionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // العثور على المنطقة
    let region;
    if (regionId.match(/^[0-9a-fA-F]{24}$/)) {
      region = await Region.findOne({ _id: regionId, isActive: true });
    } else {
      region = await Region.findOne({
        $or: [
          { code: regionId.toUpperCase() },
          { slug: regionId.toLowerCase() }
        ],
        isActive: true
      });
    }

    if (!region) {
      return res.status(404).json({
        error: 'المنطقة غير موجودة',
        code: 'REGION_NOT_FOUND'
      });
    }

    // بناء استعلام البحث
    const query = {
      region: region._id,
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
      'createdAt': 'createdAt'
    };

    const sortField = validSortFields[sortBy] || 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [stores, totalCount, categories] = await Promise.all([
      Store.find(query)
        .populate('merchant', 'firstName lastName businessName')
        .select('name description category subdomain logo stats contactInfo businessHours isOpen')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Store.countDocuments(query),
      Store.aggregate([
        { $match: { region: region._id, isActive: true, status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      stores,
      region: {
        id: region._id,
        name: region.name,
        nameEn: region.nameEn,
        code: region.code,
        deliveryInfo: {
          fee: region.deliveryFee,
          time: region.deliveryTimeString
        }
      },
      categories: categories.map(cat => ({
        category: cat._id,
        count: cat.count
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
        search,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('خطأ في جلب متاجر المنطقة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب البيانات',
      code: 'FETCH_REGION_STORES_ERROR'
    });
  }
});

// جلب إحصائيات منطقة معينة
router.get('/:regionId/stats', async (req, res) => {
  try {
    const { regionId } = req.params;

    let region;
    if (regionId.match(/^[0-9a-fA-F]{24}$/)) {
      region = await Region.findOne({ _id: regionId, isActive: true });
    } else {
      region = await Region.findOne({
        $or: [
          { code: regionId.toUpperCase() },
          { slug: regionId.toLowerCase() }
        ],
        isActive: true
      });
    }

    if (!region) {
      return res.status(404).json({
        error: 'المنطقة غير موجودة',
        code: 'REGION_NOT_FOUND'
      });
    }

    // جلب إحصائيات مفصلة
    const [
      totalStores,
      activeStores,
      storesByCategory,
      topStores,
      newStoresThisMonth
    ] = await Promise.all([
      Store.countDocuments({ region: region._id }),
      Store.countDocuments({ region: region._id, isActive: true, status: 'active' }),
      Store.aggregate([
        { $match: { region: region._id, isActive: true, status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Store.find({ region: region._id, isActive: true, status: 'active' })
        .sort({ 'stats.averageRating': -1, 'stats.totalOrders': -1 })
        .limit(5)
        .select('name subdomain stats category')
        .populate('merchant', 'businessName'),
      Store.countDocuments({
        region: region._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      region: {
        id: region._id,
        name: region.name,
        nameEn: region.nameEn,
        code: region.code
      },
      statistics: {
        stores: {
          total: totalStores,
          active: activeStores,
          newThisMonth: newStoresThisMonth
        },
        categories: storesByCategory.map(cat => ({
          name: cat._id,
          count: cat.count
        })),
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
    console.error('خطأ في جلب إحصائيات المنطقة:', error);
    res.status(500).json({
      error: 'حدث خطأ في جلب الإحصائيات',
      code: 'FETCH_REGION_STATS_ERROR'
    });
  }
});

// البحث في المناطق
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'كلمة البحث يجب أن تكون حرفين على الأقل',
        code: 'SEARCH_QUERY_TOO_SHORT'
      });
    }

    const searchRegex = new RegExp(query, 'i');
    
    const regions = await Region.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { nameEn: searchRegex },
        { code: searchRegex },
        { description: searchRegex }
      ]
    })
    .select('name nameEn code description image stats')
    .sort({ isFeatured: -1, stats.totalStores: -1, name: 1 })
    .limit(limit);

    res.json({
      query,
      regions,
      totalFound: regions.length
    });

  } catch (error) {
    console.error('خطأ في البحث عن المناطق:', error);
    res.status(500).json({
      error: 'حدث خطأ في البحث',
      code: 'SEARCH_REGIONS_ERROR'
    });
  }
});

module.exports = router;
