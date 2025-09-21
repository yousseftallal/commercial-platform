const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['ملابس', 'إلكترونيات', 'طعام وشراب', 'صحة وجمال', 'رياضة', 'كتب', 'منزل وحديقة', 'أخرى']
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'النطاق الفرعي يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط']
  },
  customDomain: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  // Store appearance
  logo: {
    type: String, // URL or file path
    default: null
  },
  banner: {
    type: String, // URL or file path
    default: null
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#3B82F6',
      match: [/^#[0-9A-F]{6}$/i, 'يرجى إدخال لون صالح بصيغة hex']
    },
    secondaryColor: {
      type: String,
      default: '#10B981',
      match: [/^#[0-9A-F]{6}$/i, 'يرجى إدخال لون صالح بصيغة hex']
    },
    fontFamily: {
      type: String,
      default: 'Cairo',
      enum: ['Cairo', 'Tajawal', 'Almarai', 'Roboto', 'Open Sans']
    },
    layout: {
      type: String,
      default: 'grid',
      enum: ['grid', 'list', 'masonry']
    }
  },
  // Contact information
  contactInfo: {
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'يرجى إدخال رقم هاتف صالح']
    },
    whatsapp: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'يرجى إدخال رقم واتساب صالح']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'يرجى إدخال بريد إلكتروني صالح']
    },
    website: {
      type: String,
      trim: true
    },
    address: {
      street: {
        type: String,
        trim: true,
        maxlength: 200
      },
      city: {
        type: String,
        trim: true,
        maxlength: 100
      },
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180
        }
      }
    }
  },
  // Business hours
  businessHours: {
    sunday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '14:00' },
      closeTime: { type: String, default: '22:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    }
  },
  // Store settings
  settings: {
    acceptOrders: {
      type: Boolean,
      default: true
    },
    minimumOrder: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryTime: {
      min: {
        type: Number,
        default: 30,
        min: 0
      },
      max: {
        type: Number,
        default: 120,
        min: 0
      }
    },
    paymentMethods: [{
      type: String,
      enum: ['cash', 'card', 'wallet', 'bank_transfer'],
      default: ['cash']
    }],
    allowReviews: {
      type: Boolean,
      default: true
    },
    autoApproveProducts: {
      type: Boolean,
      default: false
    }
  },
  // Store status and verification
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'closed'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Statistics
  stats: {
    totalProducts: {
      type: Number,
      default: 0
    },
    activeProducts: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
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
    views: {
      type: Number,
      default: 0
    },
    followers: {
      type: Number,
      default: 0
    }
  },
  // SEO and marketing
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160
    },
    keywords: [{
      type: String,
      trim: true,
      maxlength: 50
    }]
  },
  // Social media links
  socialMedia: {
    facebook: {
      type: String,
      trim: true
    },
    instagram: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    youtube: {
      type: String,
      trim: true
    },
    tiktok: {
      type: String,
      trim: true
    }
  },
  // Store features
  features: {
    hasDelivery: {
      type: Boolean,
      default: true
    },
    hasPickup: {
      type: Boolean,
      default: true
    },
    hasExpressDelivery: {
      type: Boolean,
      default: false
    },
    hasLoyaltyProgram: {
      type: Boolean,
      default: false
    },
    hasDiscounts: {
      type: Boolean,
      default: false
    },
    hasGiftCards: {
      type: Boolean,
      default: false
    }
  },
  // Analytics tracking
  analytics: {
    googleAnalyticsId: {
      type: String,
      trim: true
    },
    facebookPixelId: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for store URL
storeSchema.virtual('storeUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3000';
  
  if (this.customDomain) {
    return `https://${this.customDomain}`;
  }
  
  return `${baseUrl}/store/${this.subdomain}`;
});

// Virtual for current status
storeSchema.virtual('isOpen').get(function() {
  if (!this.isActive || this.status !== 'active') {
    return false;
  }
  
  const now = new Date();
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  const daySchedule = this.businessHours[currentDay];
  
  if (!daySchedule || !daySchedule.isOpen) {
    return false;
  }
  
  return currentTime >= daySchedule.openTime && currentTime <= daySchedule.closeTime;
});

// Pre-save middleware to generate subdomain from store name
storeSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.subdomain) {
    this.subdomain = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (this.subdomain.length < 3) {
      this.subdomain += Math.floor(Math.random() * 1000);
    }
  }
  next();
});

// Static method to find active stores
storeSchema.statics.findActive = function() {
  return this.find({ isActive: true, status: 'active' });
};

// Static method to find by region
storeSchema.statics.findByRegion = function(regionId) {
  return this.find({ region: regionId, isActive: true, status: 'active' });
};

// Static method to find by category and region
storeSchema.statics.findByCategoryAndRegion = function(category, regionId) {
  return this.find({ 
    category: category, 
    region: regionId, 
    isActive: true, 
    status: 'active' 
  });
};

// Instance method to update stats
storeSchema.methods.updateStats = async function() {
  const Product = mongoose.model('Product');
  
  try {
    const products = await Product.find({ store: this._id });
    const activeProducts = products.filter(product => product.isActive && product.status === 'approved').length;
    
    this.stats.totalProducts = products.length;
    this.stats.activeProducts = activeProducts;
    
    return this.save();
  } catch (error) {
    console.error('Error updating store stats:', error);
    throw error;
  }
};

// Instance method to increment views
storeSchema.methods.incrementViews = function() {
  return this.updateOne({ $inc: { 'stats.views': 1 } });
};

// Indexes for performance
storeSchema.index({ subdomain: 1 });
storeSchema.index({ merchant: 1 });
storeSchema.index({ region: 1, isActive: 1, status: 1 });
storeSchema.index({ category: 1, region: 1 });
storeSchema.index({ status: 1, isActive: 1 });
storeSchema.index({ 'stats.averageRating': -1 });
storeSchema.index({ 'stats.totalOrders': -1 });
storeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Store', storeSchema);
