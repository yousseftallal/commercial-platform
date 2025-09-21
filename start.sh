#!/bin/bash

echo "========================================"
echo "      المنصة التجارية الشاملة"
echo "      Commercial Platform Startup"
echo "========================================"
echo

echo "[1/5] التحقق من Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js غير مثبت"
    echo "يرجى تحميل وتثبيت Node.js من: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js مثبت ($(node --version))"

echo
echo "[2/5] التحقق من MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "⚠️  Warning: MongoDB غير مثبت أو غير متاح"
    echo "سيتم المحاولة مع إعدادات افتراضية..."
else
    echo "✅ MongoDB متاح"
fi

echo
echo "[3/5] تثبيت تبعيات Backend..."
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: فشل في تثبيت تبعيات Backend"
        exit 1
    fi
fi
echo "✅ تبعيات Backend جاهزة"

echo
echo "[4/5] تثبيت تبعيات Frontend..."
cd client
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: فشل في تثبيت تبعيات Frontend"
        exit 1
    fi
fi
echo "✅ تبعيات Frontend جاهزة"
cd ..

echo
echo "[5/5] إعداد ملف البيئة..."
if [ ! -f ".env" ]; then
    cp env.example .env 2>/dev/null
    echo "✅ تم إنشاء ملف .env من المثال"
    echo "⚠️  يرجى تحديث ملف .env بقيمك الخاصة"
else
    echo "✅ ملف .env موجود"
fi

echo
echo "========================================"
echo "           جاري تشغيل التطبيق..."
echo "========================================"
echo
echo "🔧 Backend سيعمل على: http://localhost:5000"
echo "🌐 Frontend سيعمل على: http://localhost:3000"
echo "👤 حساب الإداري:"
echo "   البريد: admin@platform.com"
echo "   كلمة المرور: Admin123!@#"
echo

# تحقق من نظام التشغيل
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev"'
    sleep 3
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/client && npm start"'
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "npm run dev; exec bash"
        sleep 3
        gnome-terminal -- bash -c "cd client && npm start; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -e "npm run dev" &
        sleep 3
        xterm -e "cd client && npm start" &
    else
        echo "تشغيل Backend..."
        npm run dev &
        sleep 5
        echo "تشغيل Frontend..."
        cd client && npm start
    fi
else
    # نظام غير مدعوم، تشغيل عادي
    echo "تشغيل Backend..."
    npm run dev &
    sleep 5
    echo "تشغيل Frontend..."
    cd client && npm start
fi

echo "✅ تم تشغيل الخادمين!"
