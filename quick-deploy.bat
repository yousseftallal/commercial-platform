@echo off
echo ========================================
echo     🚀 نشر المنصة التجارية أونلاين
echo ========================================
echo.

echo 📋 قائمة التحقق:
echo [ ] MongoDB Atlas account
echo [ ] GitHub account  
echo [ ] Vercel account
echo.

echo 🎯 الخطوات:
echo.
echo 1️⃣  إعداد MongoDB Atlas (5 دقائق)
echo    🌐 https://cloud.mongodb.com
echo    💰 اختر M0 Sandbox (مجاني)
echo    🔗 احصل على Connection String
echo.

echo 2️⃣  رفع على GitHub (2 دقيقة)  
echo    📂 أنشئ repository جديد
echo    📤 ارفع الكود
echo.

echo 3️⃣  نشر على Vercel (3 دقائق)
echo    🌐 https://vercel.com
echo    🔗 اربط GitHub repository
echo    ⚙️  أضف Environment Variables
echo.

echo 📄 اقرأ الملفات التالية للتفاصيل:
echo    📖 DEPLOY_GUIDE.md - دليل مرئي مفصل
echo    📋 deploy-config.txt - متغيرات البيئة
echo    🚀 deploy-online.md - خطوات سريعة
echo.

echo 🎉 بعد النشر ستحصل على:
echo    🌐 موقع متاح 24/7
echo    🔒 أمان عالي المستوى
echo    👤 لوحة تحكم إدارية
echo    🏪 نظام إدارة التجار
echo    🛒 واجهة التسوق للعملاء
echo.

echo ⚡ للبدء السريع:
echo    1. اقرأ DEPLOY_GUIDE.md
echo    2. شغل git-setup.bat لرفع GitHub
echo    3. اتبع خطوات Vercel
echo.

echo 💡 نصيحة: ابدأ بـ MongoDB Atlas أولاً!
echo.

set /p choice="هل تريد فتح دليل النشر؟ (y/n): "
if /i "%choice%"=="y" (
    start DEPLOY_GUIDE.md
)

echo.
echo 🚀 حظاً موفقاً في النشر!
pause
