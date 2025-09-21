const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'يرجى إدخال بريد إلكتروني صالح']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'يرجى إدخال رقم هاتف صالح']
  },
  role: {
    type: String,
    enum: ['admin', 'merchant', 'customer'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: function() {
      return this.role === 'merchant' ? 'pending' : 'active';
    }
  },
  avatar: {
    type: String,
    default: null
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: function() {
      return this.role === 'merchant' || this.role === 'customer';
    }
  },
  // Merchant specific fields
  businessName: {
    type: String,
    required: function() {
      return this.role === 'merchant';
    },
    trim: true,
    maxlength: 100
  },
  businessDescription: {
    type: String,
    trim: true,
    maxlength: 500
  },
  businessLicense: {
    type: String, // File path or URL
    required: function() {
      return this.role === 'merchant';
    }
  },
  businessCategory: {
    type: String,
    enum: ['ملابس', 'إلكترونيات', 'طعام وشراب', 'صحة وجمال', 'رياضة', 'كتب', 'منزل وحديقة', 'أخرى'],
    required: function() {
      return this.role === 'merchant';
    }
  },
  storeSubdomain: {
    type: String,
    unique: true,
    sparse: true, // Allows null values and ignores them for uniqueness
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'النطاق الفرعي يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط']
  },
  // Verification and approval
  documentsSubmitted: {
    type: Date,
    default: Date.now
  },
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
  // Additional contact info
  whatsapp: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'يرجى إدخال رقم واتساب صالح']
  },
  // Security and activity
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  // Preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    whatsapp: {
      type: Boolean,
      default: true
    },
    orderUpdates: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate store subdomain for merchants
userSchema.pre('save', function(next) {
  if (this.role === 'merchant' && this.businessName && !this.storeSubdomain) {
    // Generate subdomain from business name
    let subdomain = this.businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Add random number if subdomain is too short
    if (subdomain.length < 3) {
      subdomain += Math.floor(Math.random() * 1000);
    }
    
    this.storeSubdomain = subdomain;
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ storeSubdomain: 1 });
userSchema.index({ region: 1, role: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ businessCategory: 1 });

module.exports = mongoose.model('User', userSchema);
