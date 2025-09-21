const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 300
  },
  category: {
    type: String,
    required: true,
    enum: ['ملابس', 'إلكترونيات', 'طعام وشراب', 'صحة وجمال', 'رياضة', 'كتب', 'منزل وحديقة', 'أخرى']
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  currency: {
    type: String,
    default: 'EGP',
    uppercase: true,
    trim: true,
    maxlength: 3
  },
  // Inventory
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    sku: {
      type: String,
      trim: true,
      maxlength: 100
    },
    trackQuantity: {
      type: Boolean,
      default: true
    },
    allowOutOfStock: {
      type: Boolean,
      default: false
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5
    }
  },
  // Product variants (sizes, colors, etc.)
  variants: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      required: true,
      enum: ['size', 'color', 'material', 'style', 'other']
    },
    options: [{
      value: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
      },
      price: {
        type: Number,
        default: 0
      },
      quantity: {
        type: Number,
        default: 0
      },
      sku: {
        type: String,
        trim: true,
        maxlength: 100
      }
    }]
  }],
  // Media
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 200
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  }],
  videos: [{
    url: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200
    },
    duration: {
      type: Number // in seconds
    }
  }],
  // Product specifications
  specifications: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    }
  }],
  // Dimensions and weight
  dimensions: {
    length: {
      type: Number,
      min: 0
    },
    width: {
      type: Number,
      min: 0
    },
    height: {
      type: Number,
      min: 0
    },
    weight: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['cm', 'mm', 'inch'],
      default: 'cm'
    },
    weightUnit: {
      type: String,
      enum: ['g', 'kg', 'lb'],
      default: 'kg'
    }
  },
  // Product status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Approval process
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Delivery options
  delivery: {
    isFreeDelivery: {
      type: Boolean,
      default: false
    },
    deliveryFee: {
      type: Number,
      min: 0,
      default: 0
    },
    estimatedDeliveryTime: {
      min: {
        type: Number,
        default: 30
      },
      max: {
        type: Number,
        default: 120
      }
    },
    allowPickup: {
      type: Boolean,
      default: true
    },
    expressDelivery: {
      available: {
        type: Boolean,
        default: false
      },
      fee: {
        type: Number,
        min: 0,
        default: 0
      }
    }
  },
  // Tags and search
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  searchKeywords: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  // SEO
  seo: {
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط']
    },
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160
    }
  },
  // Statistics and analytics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    wishlistCount: {
      type: Number,
      default: 0
    },
    cartAddCount: {
      type: Number,
      default: 0
    }
  },
  // Additional settings
  settings: {
    allowReviews: {
      type: Boolean,
      default: true
    },
    showQuantity: {
      type: Boolean,
      default: true
    },
    allowWishlist: {
      type: Boolean,
      default: true
    },
    minOrderQuantity: {
      type: Number,
      min: 1,
      default: 1
    },
    maxOrderQuantity: {
      type: Number,
      min: 1,
      default: 100
    }
  },
  // Related products
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Seasonal or promotional flags
  isSeasonalItem: {
    type: Boolean,
    default: false
  },
  seasonalInfo: {
    season: {
      type: String,
      enum: ['spring', 'summer', 'autumn', 'winter']
    },
    availableFrom: {
      type: Date
    },
    availableUntil: {
      type: Date
    }
  },
  // Promotion and discount
  promotion: {
    isOnSale: {
      type: Boolean,
      default: false
    },
    saleStartDate: {
      type: Date
    },
    saleEndDate: {
      type: Date
    },
    flashSale: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discountPercentage > 0) {
    return this.price * (1 - this.discountPercentage / 100);
  }
  return this.price;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Virtual for in stock status
productSchema.virtual('isInStock').get(function() {
  if (!this.inventory.trackQuantity) {
    return true;
  }
  return this.inventory.quantity > 0 || this.inventory.allowOutOfStock;
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  if (!this.inventory.trackQuantity) {
    return false;
  }
  return this.inventory.quantity <= this.inventory.lowStockThreshold && this.inventory.quantity > 0;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + this._id.toString().slice(-6);
  }
  
  // Set primary image if none exists
  if (this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
    this.images[0].isPrimary = true;
  }
  
  // Calculate discount percentage if original price is set
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  
  next();
});

// Static method to find active products
productSchema.statics.findActive = function() {
  return this.find({ isActive: true, status: 'approved' });
};

// Static method to find by store
productSchema.statics.findByStore = function(storeId) {
  return this.find({ store: storeId, isActive: true, status: 'approved' });
};

// Static method to find by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category: category, isActive: true, status: 'approved' });
};

// Static method to search products
productSchema.statics.search = function(query, options = {}) {
  const searchRegex = new RegExp(query, 'i');
  
  const searchQuery = {
    $and: [
      { isActive: true, status: 'approved' },
      {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
          { searchKeywords: { $in: [searchRegex] } }
        ]
      }
    ]
  };
  
  if (options.category) {
    searchQuery.$and.push({ category: options.category });
  }
  
  if (options.storeId) {
    searchQuery.$and.push({ store: options.storeId });
  }
  
  if (options.minPrice || options.maxPrice) {
    const priceQuery = {};
    if (options.minPrice) priceQuery.$gte = options.minPrice;
    if (options.maxPrice) priceQuery.$lte = options.maxPrice;
    searchQuery.$and.push({ price: priceQuery });
  }
  
  return this.find(searchQuery);
};

// Instance method to increment views
productSchema.methods.incrementViews = function() {
  return this.updateOne({ $inc: { 'stats.views': 1 } });
};

// Instance method to add to wishlist count
productSchema.methods.incrementWishlist = function() {
  return this.updateOne({ $inc: { 'stats.wishlistCount': 1 } });
};

// Instance method to add to cart count
productSchema.methods.incrementCartAdd = function() {
  return this.updateOne({ $inc: { 'stats.cartAddCount': 1 } });
};

// Indexes for performance
productSchema.index({ store: 1, isActive: 1, status: 1 });
productSchema.index({ category: 1, isActive: 1, status: 1 });
productSchema.index({ 'seo.slug': 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'stats.sales': -1 });
productSchema.index({ 'stats.averageRating': -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
