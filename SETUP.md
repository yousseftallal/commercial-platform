# دليل التثبيت والتشغيل 🚀

## المتطلبات الأساسية

قبل البدء، تأكد من تثبيت المتطلبات التالية على نظامك:

- **Node.js** v16 أو أحدث - [تحميل](https://nodejs.org/)
- **MongoDB** v5 أو أحدث - [تحميل](https://mongodb.com/try/download/community)
- **Git** - [تحميل](https://git-scm.com/)

## خطوات التثبيت

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd commercial-platform
```

### 2. إعداد Backend

#### تثبيت التبعيات
```bash
npm install
```

#### إعداد متغيرات البيئة
```bash
# انسخ ملف البيئة المثال
cp env.example .env

# قم بتحرير الملف وإضافة قيمك
notepad .env  # في Windows
nano .env     # في Linux/Mac
```

#### متغيرات البيئة المطلوبة
```env
# Database
MONGODB_URI=mongodb://localhost:27017/commercial_platform

# JWT Secrets (مهم: غير هذه القيم في الإنتاج)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Server
PORT=5000
NODE_ENV=development

# Admin Account
ADMIN_EMAIL=admin@platform.com
ADMIN_PASSWORD=Admin123!@#
```

### 3. إعداد Frontend

#### الانتقال لمجلد client
```bash
cd client
```

#### تثبيت التبعيات
```bash
npm install
```

#### إضافة التبعيات المطلوبة إذا لم تكن موجودة
```bash
npm install @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio
```

#### العودة للمجلد الرئيسي
```bash
cd ..
```

### 4. تشغيل قاعدة البيانات

#### تشغيل MongoDB محلياً
```bash
# في Windows
mongod

# في Linux/Mac
sudo systemctl start mongod
# أو
brew services start mongodb/brew/mongodb-community
```

#### التحقق من الاتصال
```bash
mongo
# يجب أن تظهر MongoDB shell إذا كان كل شيء يعمل بشكل صحيح
```

## تشغيل التطبيق

### التطوير (Development)

#### الطريقة السريعة - تشغيل كل شيء معاً
```bash
npm run dev-full
```

#### الطريقة المنفصلة
```bash
# تشغيل Backend في terminal منفصل
npm run dev

# تشغيل Frontend في terminal آخر
cd client && npm start
```

### الإنتاج (Production)

#### بناء Frontend
```bash
npm run build
```

#### تشغيل الخادم
```bash
npm start
```

## الوصول للتطبيق

بعد التشغيل الناجح:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## الحسابات الافتراضية

### حساب الإداري
- **البريد**: admin@platform.com  
- **كلمة المرور**: Admin123!@#

### المناطق الافتراضية
سيتم إنشاء 6 مناطق تلقائياً:
- القاهرة
- الجيزة
- الإسكندرية
- شبرا الخيمة
- بورسعيد
- السويس

## استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات
```bash
# تأكد من تشغيل MongoDB
sudo systemctl status mongod

# أو تحقق من العملية
ps aux | grep mongod
```

### خطأ في تثبيت التبعيات
```bash
# امسح node_modules وأعد التثبيت
rm -rf node_modules package-lock.json
npm install
```

### خطأ في تشغيل Frontend
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### خطأ في البورت المستخدم
```bash
# تغيير البورت في ملف .env
PORT=5001

# أو إيقاف العملية التي تستخدم البورت
# في Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# في Linux/Mac
lsof -ti:5000 | xargs kill -9
```

## اختبار التثبيت

### 1. فحص Backend
```bash
curl http://localhost:5000/api/health
```

يجب أن ترى:
```json
{
  "status": "success",
  "message": "الخادم يعمل بشكل طبيعي",
  "timestamp": "...",
  "environment": "development"
}
```

### 2. فحص Frontend
افتح المتصفح على http://localhost:3000
يجب أن تظهر الصفحة الرئيسية للمنصة

### 3. تسجيل الدخول للإدارة
1. اذهب إلى http://localhost:3000/login
2. استخدم بيانات الإداري المذكورة أعلاه
3. يجب أن تصل للوحة التحكم الإدارية

## التكوين الإضافي (اختياري)

### إعداد البريد الإلكتروني
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### إعداد تحميل الملفات (Cloudinary)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret
```

### إعداد واتساب API
```env
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your_api_key
```

## النشر

### Heroku
```bash
# تسجيل الدخول لـ Heroku
heroku login

# إنشاء تطبيق جديد
heroku create your-app-name

# إضافة قاعدة بيانات MongoDB
heroku addons:create mongolab:sandbox

# تعيين متغيرات البيئة
heroku config:set JWT_SECRET=your_production_secret
heroku config:set NODE_ENV=production

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

## الدعم والمساعدة

إذا واجهت أي مشاكل:

1. **تحقق من الـ logs**:
   ```bash
   # Backend logs
   npm run dev
   
   # Frontend logs  
   cd client && npm start
   ```

2. **تحقق من متغيرات البيئة**: تأكد أن ملف `.env` صحيح

3. **تحقق من قاعدة البيانات**: تأكد أن MongoDB يعمل

4. **تنظيف التبعيات**: امسح `node_modules` وأعد التثبيت

للحصول على مساعدة إضافية، راجع ملف `README.md` أو تواصل مع فريق التطوير.

---

**مبروك! 🎉 تطبيقك جاهز للاستخدام**
