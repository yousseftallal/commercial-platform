# المنصة التجارية الشاملة 🛍️

منصة تجارية متكاملة لإدارة المتاجر الإلكترونية والمنتجات مع نظام إدارة المناطق وتقسيم التوصيل الجغرافي.

## 🌟 المميزات الرئيسية

### للإداريين
- **لوحة تحكم شاملة** مع إحصائيات مفصلة
- **إدارة التجار** - موافقة ورفض طلبات التسجيل
- **إدارة المناطق** - تحديد مناطق التوصيل ورسومها
- **مراقبة المتاجر والمنتجات** مع إمكانية التحكم الكامل
- **إدارة المستخدمين** مع نظام التعليق والإيقاف

### للتجار
- **تسجيل سهل** مع مراجعة من قبل الإدارة
- **لوحة تحكم خاصة** لإدارة المتجر والمنتجات
- **نطاق فرعي مخصص** لكل متجر (subdomain)
- **إدارة المخزون** مع تتبع الكميات
- **إحصائيات مفصلة** للمبيعات والمشاهدات
- **تخصيص واجهة المتجر** (ألوان، شعار، إلخ)

### للعملاء
- **تصفح المتاجر** حسب المنطقة والفئة
- **بحث متقدم** في المنتجات والمتاجر
- **عرض تفصيلي** لكل منتج ومتجر
- **فلترة ذكية** حسب السعر والتقييم
- **واجهة سريعة الاستجابة** لجميع الأجهزة

### النظام العام
- **نظام المناطق المتقدم** - تقسيم جغرافي للتوصيل
- **أمان عالي** مع تشفير البيانات ومعالجة الجلسات
- **API مكتمل** مع التوثيق
- **واجهة عربية** متكاملة مع دعم RTL
- **تحسين لمحركات البحث** (SEO)

## 🏗️ التقنيات المستخدمة

### Backend
- **Node.js** مع Express.js
- **MongoDB** مع Mongoose
- **JWT** للمصادقة والتفويض
- **bcryptjs** لتشفير كلمات المرور
- **express-validator** للتحقق من البيانات
- **helmet** للأمان
- **cors** للطلبات المشتركة
- **rate-limiting** لحماية من الهجمات

### Frontend
- **React 18** مع TypeScript
- **Tailwind CSS** للتصميم
- **React Router** للتنقل
- **React Hook Form** للنماذج
- **React Query** لإدارة البيانات
- **Zustand** لإدارة الحالة العامة
- **Framer Motion** للحركات والانيميشن
- **React Hot Toast** للإشعارات

### الأدوات والمكتبات
- **Yup** للتحقق من البيانات
- **Axios** لطلبات HTTP
- **date-fns** للتعامل مع التواريخ
- **Headless UI** للمكونات التفاعلية
- **Heroicons** للأيقونات

## 📁 هيكل المشروع

```
commercial-platform/
├── 📁 client/                 # تطبيق React Frontend
│   ├── 📁 public/
│   ├── 📁 src/
│   │   ├── 📁 components/     # المكونات المشتركة
│   │   ├── 📁 contexts/       # React Contexts
│   │   ├── 📁 pages/          # صفحات التطبيق
│   │   ├── 📁 services/       # خدمات API
│   │   └── 📁 utils/          # الأدوات المساعدة
│   ├── 📄 package.json
│   └── 📄 tailwind.config.js
├── 📁 middleware/             # Express Middlewares
├── 📁 models/                 # MongoDB Models
├── 📁 routes/                 # API Routes
├── 📁 utils/                  # الأدوات المساعدة
├── 📄 server.js              # نقطة البداية للخادم
├── 📄 package.json
└── 📄 env.example            # متغيرات البيئة المطلوبة
```

## 🚀 التثبيت والتشغيل

### المتطلبات الأساسية
- Node.js (v16 أو أحدث)
- MongoDB (v5 أو أحدث)
- npm أو yarn

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd commercial-platform
```

### 2. تثبيت التبعيات
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client && npm install && cd ..
```

### 3. إعداد متغيرات البيئة
```bash
# انسخ ملف البيئة المثال
cp env.example .env

# قم بتحرير الملف وإضافة قيمك
nano .env
```

### 4. تشغيل قاعدة البيانات
```bash
# تأكد من تشغيل MongoDB
mongod
```

### 5. تشغيل التطبيق

#### التطوير (Development)
```bash
# تشغيل Backend و Frontend معاً
npm run dev-full

# أو تشغيل كل واحد منفصل
npm run dev        # Backend على البورت 5000
npm run client     # Frontend على البورت 3000
```

#### الإنتاج (Production)
```bash
# بناء Frontend
npm run build

# تشغيل الخادم
npm start
```

## 🔐 الحسابات الافتراضية

عند التشغيل لأول مرة، سيتم إنشاء:

### حساب الإداري
- **البريد الإلكتروني:** admin@platform.com
- **كلمة المرور:** Admin123!@#

### المناطق الافتراضية
- القاهرة (CAI)
- الجيزة (GIZ)  
- الإسكندرية (ALX)
- شبرا الخيمة (SHK)
- بورسعيد (PSD)
- السويس (SUZ)

## 🔧 إعداد متغيرات البيئة

```env
# Database
MONGODB_URI=mongodb://localhost:27017/commercial_platform
DB_NAME=commercial_platform

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# WhatsApp API (اختياري)
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your_whatsapp_api_key

# File Upload (اختياري)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Default Credentials
ADMIN_EMAIL=admin@platform.com
ADMIN_PASSWORD=Admin123!@#
```

## 📡 API Endpoints

### المصادقة (Authentication)
```
POST   /api/auth/login                 # تسجيل الدخول
POST   /api/auth/register              # تسجيل عميل جديد
POST   /api/auth/register/merchant     # تسجيل تاجر جديد
POST   /api/auth/logout               # تسجيل الخروج
GET    /api/auth/me                   # بيانات المستخدم الحالي
PUT    /api/auth/change-password      # تغيير كلمة المرور
POST   /api/auth/refresh              # تجديد التوكن
```

### الإدارة (Admin)
```
GET    /api/admin/dashboard           # إحصائيات لوحة التحكم
GET    /api/admin/merchants/pending   # طلبات التجار المعلقة
PUT    /api/admin/merchants/:id/approve  # موافقة على تاجر
PUT    /api/admin/merchants/:id/reject   # رفض تاجر
GET    /api/admin/users               # جميع المستخدمين
GET    /api/admin/stores              # جميع المتاجر
GET    /api/admin/regions             # إدارة المناطق
```

### التجار (Merchants)
```
GET    /api/merchant/dashboard        # لوحة تحكم التاجر
GET    /api/merchant/store            # بيانات المتجر
PUT    /api/merchant/store            # تحديث المتجر
GET    /api/merchant/products         # منتجات التاجر
POST   /api/merchant/products         # إضافة منتج جديد
PUT    /api/merchant/products/:id     # تحديث منتج
DELETE /api/merchant/products/:id     # حذف منتج
```

### العملاء (Customers)
```
GET    /api/customer/stores           # متاجر المنطقة
GET    /api/customer/stores/:id       # تفاصيل متجر
GET    /api/customer/stores/:id/products  # منتجات متجر
GET    /api/customer/products/:id     # تفاصيل منتج
GET    /api/customer/search/products  # البحث في المنتجات
```

### عام (Public)
```
GET    /api/regions                   # جميع المناطق
GET    /api/regions/featured          # المناطق المميزة
GET    /api/stores                    # جميع المتاجر
GET    /api/stores/featured           # المتاجر المميزة
GET    /api/products                  # جميع المنتجات
GET    /api/products/featured         # المنتجات المميزة
```

## 🎨 التخصيص والتطوير

### إضافة فئة جديدة
```javascript
// في models/Store.js و models/Product.js
enum: ['ملابس', 'إلكترونيات', 'طعام وشراب', 'صحة وجمال', 'رياضة', 'كتب', 'منزل وحديقة', 'فئتك الجديدة', 'أخرى']
```

### إضافة منطقة جديدة
```javascript
// استخدم API الإدارة أو أضف في utils/createDefaultAdmin.js
const newRegion = {
  name: 'اسم المنطقة',
  nameEn: 'Region Name',
  code: 'RGN',
  coordinates: { latitude: 0, longitude: 0 },
  deliveryFee: 25,
  // ... باقي البيانات
};
```

### تخصيص التصميم
```javascript
// في client/tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        // ألوانك المخصصة
      }
    }
  }
}
```

## 🧪 الاختبار

```bash
# تشغيل اختبارات Backend
npm test

# تشغيل اختبارات Frontend
cd client && npm test
```

## 📦 النشر (Deployment)

### Heroku
```bash
# إضافة Heroku remote
heroku git:remote -a your-app-name

# نشر التطبيق
git push heroku main
```

### Docker
```bash
# بناء الصورة
docker build -t commercial-platform .

# تشغيل الحاوية
docker run -p 5000:5000 commercial-platform
```

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

## 📞 الدعم والتواصل

- **البريد الإلكتروني:** support@platform.com
- **الواتساب:** +20xxxxxxxxx
- **الموقع:** https://platform.com

## 🔄 سجل التحديثات

### v1.0.0 (2024-09-21)
- إطلاق النسخة الأولى
- نظام المصادقة الكامل
- لوحات التحكم للإداريين والتجار
- إدارة المناطق والمتاجر
- واجهة العملاء للتصفح والبحث

---

**صُنع بـ ❤️ للمجتمع التجاري العربي**
