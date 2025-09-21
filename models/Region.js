const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 100
  },
  nameEn: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10,
    match: [/^[A-Z0-9]+$/, 'كود المنطقة يجب أن يحتوي على أحرف إنجليزية كبيرة وأرقام فقط']
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  boundaries: [{
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  }],
  deliveryFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  deliveryTime: {
    min: {
      type: Number,
      required: true,
      min: 0,
      default: 30 // minutes
    },
    max: {
      type: Number,
      required: true,
      min: 0,
      default: 120 // minutes
    }
  },
  population: {
    type: Number,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Service coverage settings
  serviceCoverage: {
    delivery: {
      type: Boolean,
      default: true
    },
    pickup: {
      type: Boolean,
      default: true
    },
    express: {
      type: Boolean,
      default: false
    }
  },
  // Regional settings
  timezone: {
    type: String,
    default: 'Africa/Cairo',
    trim: true
  },
  currency: {
    type: String,
    default: 'EGP',
    uppercase: true,
    trim: true,
    maxlength: 3
  },
  language: {
    type: String,
    default: 'ar',
    lowercase: true,
    trim: true,
    enum: ['ar', 'en']
  },
  // Administrative info
  governorate: {
    type: String,
    trim: true,
    maxlength: 100
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'مصر'
  },
  // Statistics
  stats: {
    totalStores: {
      type: Number,
      default: 0
    },
    activeStores: {
      type: Number,
      default: 0
    },
    totalCustomers: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    }
  },
  // SEO and display
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160
  },
  image: {
    type: String, // URL to region image
    trim: true
  },
  // Contact and support
  contactInfo: {
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'يرجى إدخال رقم هاتف صالح']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'يرجى إدخال بريد إلكتروني صالح']
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  // Featured settings
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full coordinates string
regionSchema.virtual('coordinatesString').get(function() {
  return `${this.coordinates.latitude}, ${this.coordinates.longitude}`;
});

// Virtual for delivery time string
regionSchema.virtual('deliveryTimeString').get(function() {
  if (this.deliveryTime.min === this.deliveryTime.max) {
    return `${this.deliveryTime.min} دقيقة`;
  }
  return `${this.deliveryTime.min} - ${this.deliveryTime.max} دقيقة`;
});

// Pre-save middleware to generate slug
regionSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isModified('nameEn')) {
    this.slug = (this.nameEn || this.name)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Static method to find active regions
regionSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static method to find by code
regionSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

// Static method to find featured regions
regionSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Instance method to update stats
regionSchema.methods.updateStats = async function() {
  const User = mongoose.model('User');
  const Store = mongoose.model('Store');
  
  try {
    const [stores, customers] = await Promise.all([
      Store.find({ region: this._id }),
      User.countDocuments({ region: this._id, role: 'customer', status: 'active' })
    ]);
    
    const activeStores = stores.filter(store => store.isActive).length;
    
    this.stats = {
      totalStores: stores.length,
      activeStores: activeStores,
      totalCustomers: customers,
      totalOrders: this.stats.totalOrders || 0 // Keep existing order count
    };
    
    return this.save();
  } catch (error) {
    console.error('Error updating region stats:', error);
    throw error;
  }
};

// Indexes for performance
regionSchema.index({ code: 1 });
regionSchema.index({ slug: 1 });
regionSchema.index({ isActive: 1, isFeatured: 1 });
regionSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
regionSchema.index({ sortOrder: 1, name: 1 });

module.exports = mongoose.model('Region', regionSchema);
