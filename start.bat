@echo off
echo ========================================
echo      المنصة التجارية الشاملة
echo      Commercial Platform Startup
echo ========================================
echo.

echo [1/5] التحقق من Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js غير مثبت
    echo يرجى تحميل وتثبيت Node.js من: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js مثبت

echo.
echo [2/5] التحقق من MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Warning: MongoDB غير مثبت أو غير متاح
    echo سيتم المحاولة مع إعدادات افتراضية...
)

echo.
echo [3/5] تثبيت تبعيات Backend...
if not exist node_modules (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Error: فشل في تثبيت تبعيات Backend
        pause
        exit /b 1
    )
)
echo ✅ تبعيات Backend جاهزة

echo.
echo [4/5] تثبيت تبعيات Frontend...
cd client
if not exist node_modules (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Error: فشل في تثبيت تبعيات Frontend
        pause
        exit /b 1
    )
)
echo ✅ تبعيات Frontend جاهزة
cd ..

echo.
echo [5/5] إعداد ملف البيئة...
if not exist .env (
    copy env.example .env >nul 2>&1
    echo ✅ تم إنشاء ملف .env من المثال
    echo ⚠️  يرجى تحديث ملف .env بقيمك الخاصة
) else (
    echo ✅ ملف .env موجود
)

echo.
echo ========================================
echo           جاري تشغيل التطبيق...
echo ========================================
echo.
echo 🔧 Backend سيعمل على: http://localhost:5000
echo 🌐 Frontend سيعمل على: http://localhost:3000
echo 👤 حساب الإداري:
echo    البريد: admin@platform.com
echo    كلمة المرور: Admin123!@#
echo.

REM تشغيل كلا الخادمين
start "Backend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd client && npm start"

echo ✅ تم تشغيل الخادمين!
echo.
echo اضغط أي مفتاح لإنهاء البرنامج...
pause >nul
