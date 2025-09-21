@echo off
echo ========================================
echo         رفع المشروع على GitHub
echo ========================================
echo.

echo [1/4] تهيئة Git...
git init
if %errorlevel% neq 0 (
    echo ❌ Error: Git غير مثبت
    echo يرجى تحميل Git من: https://git-scm.com/
    pause
    exit /b 1
)

echo [2/4] إضافة الملفات...
git add .

echo [3/4] إنشاء Commit...
git commit -m "Initial commit - Commercial Platform"

echo [4/4] ربط بـ GitHub...
echo.
echo 📝 تعليمات مهمة:
echo 1. اذهب إلى https://github.com
echo 2. اضغط "New repository" 
echo 3. اسم الـ Repository: commercial-platform
echo 4. اتركه Public
echo 5. لا تضع README (موجود بالفعل)
echo 6. اضغط "Create repository"
echo 7. انسخ الرابط وأدخله هنا:
echo.

set /p repo_url="أدخل رابط الـ GitHub repository: "

git remote add origin %repo_url%
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo ✅ تم رفع المشروع على GitHub بنجاح!
    echo 🔗 الرابط: %repo_url%
) else (
    echo ❌ حدث خطأ في الرفع
)

echo.
pause
