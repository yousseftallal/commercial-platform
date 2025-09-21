# المرجع السريع للمطورين 📚

## أوامر التشغيل السريع

### تشغيل سريع (Windows)
```bash
./start.bat
```

### تشغيل سريع (Linux/Mac)
```bash
chmod +x start.sh
./start.sh
```

### تشغيل يدوي
```bash
# Backend + Frontend معاً
npm run dev-full

# Backend فقط
npm run dev

# Frontend فقط
cd client && npm start
```

## هيكل المشروع السريع

```
📁 commercial-platform/
├── 📄 server.js                 # نقطة البداية
├── 📄 package.json             # تبعيات Backend
├── 📁 routes/                   # API Routes
│   ├── auth.js                 # المصادقة
│   ├── admin.js                # إدارة
│   ├── merchant.js             # التجار
│   ├── customer.js             # العملاء
│   ├── region.js               # المناطق
│   ├── store.js                # المتاجر
│   └── product.js              # المنتجات
├── 📁 models/                   # نماذج قاعدة البيانات
│   ├── User.js                 # المستخدمين
│   ├── Region.js               # المناطق
│   ├── Store.js                # المتاجر
│   └── Product.js              # المنتجات
├── 📁 middleware/               # الوسائط
│   ├── auth.js                 # المصادقة
│   └── validation.js           # التحقق
├── 📁 client/                   # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 pages/           # الصفحات
│   │   ├── 📁 components/      # المكونات
│   │   ├── 📁 contexts/        # السياقات
│   │   └── 📁 services/        # خدمات API
│   └── 📄 package.json         # تبعيات Frontend
└── 📄 README.md                # الدليل الشامل
```

## API Endpoints المهمة

### المصادقة
- `POST /api/auth/login` - تسجيل دخول
- `POST /api/auth/register` - تسجيل عميل
- `POST /api/auth/register/merchant` - تسجيل تاجر
- `GET /api/auth/me` - بيانات المستخدم

### الإدارة
- `GET /api/admin/dashboard` - إحصائيات
- `GET /api/admin/merchants/pending` - طلبات التجار
- `PUT /api/admin/merchants/:id/approve` - موافقة تاجر
- `PUT /api/admin/merchants/:id/reject` - رفض تاجر

### التجار
- `GET /api/merchant/dashboard` - لوحة التاجر
- `GET /api/merchant/products` - منتجات التاجر
- `POST /api/merchant/products` - إضافة منتج

### العملاء
- `GET /api/customer/stores` - متاجر المنطقة
- `GET /api/customer/products/:id` - تفاصيل منتج

## نماذج البيانات الرئيسية

### User (المستخدم)
```javascript
{
  email: String,
  password: String (مشفر),
  firstName: String,
  lastName: String,
  phone: String,
  role: 'admin' | 'merchant' | 'customer',
  status: 'pending' | 'active' | 'suspended' | 'rejected',
  region: ObjectId,
  // للتجار فقط
  businessName: String,
  businessCategory: String,
  storeSubdomain: String
}
```

### Store (المتجر)
```javascript
{
  merchant: ObjectId,
  region: ObjectId,
  name: String,
  category: String,
  subdomain: String,
  contactInfo: {
    phone: String,
    whatsapp: String,
    email: String
  },
  isActive: Boolean,
  stats: {
    totalProducts: Number,
    totalOrders: Number,
    averageRating: Number
  }
}
```

### Product (المنتج)
```javascript
{
  store: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  inventory: {
    quantity: Number,
    trackQuantity: Boolean
  },
  images: [String],
  status: 'pending' | 'approved' | 'rejected',
  isActive: Boolean
}
```

## متغيرات البيئة الأساسية

```env
# قاعدة البيانات
MONGODB_URI=mongodb://localhost:27017/commercial_platform

# الأمان
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

# الخادم
PORT=5000
NODE_ENV=development

# الإداري الافتراضي
ADMIN_EMAIL=admin@platform.com
ADMIN_PASSWORD=Admin123!@#
```

## الأدوار والصلاحيات

### Admin (الإداري)
- ✅ إدارة كاملة للنظام
- ✅ موافقة/رفض التجار
- ✅ إدارة المناطق
- ✅ مراقبة المتاجر والمنتجات

### Merchant (التاجر)
- ✅ إدارة متجره
- ✅ إضافة/تعديل المنتجات
- ✅ عرض الإحصائيات
- ❌ لا يمكن إدارة مناطق أخرى

### Customer (العميل)
- ✅ تصفح المتاجر
- ✅ البحث في المنتجات
- ✅ عرض تفاصيل المنتجات
- ❌ لا يمكن إضافة منتجات

## حالات الحساب

### pending (قيد المراجعة)
- للتجار الجدد
- لا يمكن الدخول للوحة التحكم

### active (نشط)
- حساب معتمد ونشط
- إمكانية كاملة للاستخدام

### suspended (معلق)
- تم تعليق الحساب مؤقتاً
- لا يمكن الدخول

### rejected (مرفوض)
- تم رفض الطلب
- لا يمكن الدخول

## المناطق الافتراضية

1. **القاهرة** (CAI) - رسوم توصيل: 25 جنيه
2. **الجيزة** (GIZ) - رسوم توصيل: 30 جنيه  
3. **الإسكندرية** (ALX) - رسوم توصيل: 20 جنيه
4. **شبرا الخيمة** (SHK) - رسوم توصيل: 20 جنيه
5. **بورسعيد** (PSD) - رسوم توصيل: 35 جنيه
6. **السويس** (SUZ) - رسوم توصيل: 40 جنيه

## فئات المنتجات المدعومة

- ملابس
- إلكترونيات
- طعام وشراب
- صحة وجمال
- رياضة
- كتب
- منزل وحديقة
- أخرى

## الاختصارات المفيدة

### npm scripts
```bash
npm run dev           # Backend development
npm run client        # Frontend development  
npm run dev-full      # كلاهما معاً
npm run build         # بناء للإنتاج
npm start             # تشغيل الإنتاج
```

### MongoDB commands
```bash
mongod                # تشغيل MongoDB
mongo                 # دخول MongoDB shell
use commercial_platform  # استخدام قاعدة البيانات
show collections      # عرض الجداول
```

## تطوير سريع

### إضافة route جديد
1. إنشاء الملف في `/routes/`
2. إضافة middleware المطلوب
3. ربط Route في `server.js`

### إضافة صفحة جديدة
1. إنشاء مكون في `/client/src/pages/`
2. إضافة Route في `App.tsx`
3. إضافة الحماية المطلوبة

### إضافة نموذج بيانات
1. إنشاء Schema في `/models/`
2. إضافة validations مطلوبة
3. إضافة indexes للأداء

---

**نصيحة**: استخدم `start.bat` أو `start.sh` للتشغيل السريع! 🚀
