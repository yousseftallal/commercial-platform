const User = require('../models/User');
const Region = require('../models/Region');

// إنشاء المسؤول الافتراضي والمناطق الأساسية
const createDefaultAdmin = async () => {
  try {
    // التحقق من وجود مسؤول
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (!existingAdmin) {
      console.log('🔧 إنشاء حساب المسؤول الافتراضي...');
      
      const adminData = {
        email: process.env.ADMIN_EMAIL || 'admin@platform.com',
        password: process.env.ADMIN_PASSWORD || 'Admin123!@#',
        firstName: 'مسؤول',
        lastName: 'النظام',
        phone: '+201000000000',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        phoneVerified: true
      };

      const admin = new User(adminData);
      await admin.save();
      
      console.log('✅ تم إنشاء حساب المسؤول الافتراضي');
      console.log(`📧 البريد الإلكتروني: ${adminData.email}`);
      console.log(`🔑 كلمة المرور: ${adminData.password}`);
      console.log('⚠️  يرجى تغيير كلمة المرور بعد تسجيل الدخول!');
    }

    // إنشاء المناطق الأساسية إذا لم تكن موجودة
    const existingRegions = await Region.countDocuments();
    
    if (existingRegions === 0) {
      console.log('🌍 إنشاء المناطق الأساسية...');
      
      const defaultRegions = [
        {
          name: 'القاهرة',
          nameEn: 'Cairo',
          code: 'CAI',
          coordinates: {
            latitude: 30.0444,
            longitude: 31.2357
          },
          deliveryFee: 25,
          deliveryTime: {
            min: 30,
            max: 90
          },
          governorate: 'القاهرة',
          country: 'مصر',
          description: 'العاصمة المصرية ومركز الثقافة والتجارة',
          isActive: true,
          isFeatured: true,
          sortOrder: 1,
          contactInfo: {
            phone: '+201000000001',
            email: 'cairo@platform.com'
          }
        },
        {
          name: 'الجيزة',
          nameEn: 'Giza',
          code: 'GIZ',
          coordinates: {
            latitude: 30.0131,
            longitude: 31.2089
          },
          deliveryFee: 30,
          deliveryTime: {
            min: 45,
            max: 120
          },
          governorate: 'الجيزة',
          country: 'مصر',
          description: 'محافظة الجيزة وموطن الأهرامات',
          isActive: true,
          isFeatured: true,
          sortOrder: 2,
          contactInfo: {
            phone: '+201000000002',
            email: 'giza@platform.com'
          }
        },
        {
          name: 'الإسكندرية',
          nameEn: 'Alexandria',
          code: 'ALX',
          coordinates: {
            latitude: 31.2001,
            longitude: 29.9187
          },
          deliveryFee: 20,
          deliveryTime: {
            min: 30,
            max: 90
          },
          governorate: 'الإسكندرية',
          country: 'مصر',
          description: 'عروس البحر المتوسط والميناء الرئيسي',
          isActive: true,
          isFeatured: true,
          sortOrder: 3,
          contactInfo: {
            phone: '+201000000003',
            email: 'alex@platform.com'
          }
        },
        {
          name: 'شبرا الخيمة',
          nameEn: 'Shubra El Kheima',
          code: 'SHK',
          coordinates: {
            latitude: 30.1287,
            longitude: 31.2441
          },
          deliveryFee: 20,
          deliveryTime: {
            min: 30,
            max: 90
          },
          governorate: 'القليوبية',
          country: 'مصر',
          description: 'مدينة شبرا الخيمة الصناعية',
          isActive: true,
          isFeatured: false,
          sortOrder: 4
        },
        {
          name: 'بورسعيد',
          nameEn: 'Port Said',
          code: 'PSD',
          coordinates: {
            latitude: 31.2653,
            longitude: 32.3019
          },
          deliveryFee: 35,
          deliveryTime: {
            min: 60,
            max: 150
          },
          governorate: 'بورسعيد',
          country: 'مصر',
          description: 'مدينة بورسعيد ومدخل قناة السويس',
          isActive: true,
          isFeatured: false,
          sortOrder: 5
        },
        {
          name: 'السويس',
          nameEn: 'Suez',
          code: 'SUZ',
          coordinates: {
            latitude: 29.9737,
            longitude: 32.5263
          },
          deliveryFee: 40,
          deliveryTime: {
            min: 90,
            max: 180
          },
          governorate: 'السويس',
          country: 'مصر',
          description: 'مدينة السويس وقناة السويس',
          isActive: true,
          isFeatured: false,
          sortOrder: 6
        }
      ];

      for (const regionData of defaultRegions) {
        const region = new Region(regionData);
        await region.save();
        console.log(`✅ تم إنشاء منطقة: ${regionData.name}`);
      }
      
      console.log('✅ تم إنشاء جميع المناطق الأساسية');
    }

  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات الافتراضية:', error.message);
  }
};

module.exports = createDefaultAdmin;
