# Sappir Barak — Fitness & Nutrition PWA

## 🚀 הפעלה מקומית

```bash
npm install
npm run dev
```

## 🏗️ Build לפרודקשן

```bash
npm install
npm run build
# תיקיית dist/ מוכנה להעלאה
```

## 📱 התקנת PWA

### אנדרואיד (Chrome)
1. פתחי את האתר ב-Chrome
2. תפיעע הודעה "הוספה למסך הבית" — לחצי עליה
3. אחרת: תפריט ⋮ → "הוסף למסך הבית"

### iPhone (Safari)
1. פתחי את האתר ב-Safari
2. לחצי על כפתור השיתוף ↑
3. בחרי "הוסף למסך הבית"

### מחשב (Chrome / Edge)
1. פתחי את האתר
2. בשורת הכתובת תופיע אייקון ➕ — לחצי עליה
3. לחצי "התקן"

## 🌐 Deploy ל-Netlify

```bash
npm run build
# העלי את תיקיית dist/ ל-Netlify
```

או חבר את GitHub ו-Netlify יבנה אוטומטית.

## 🔧 מה כלול ב-PWA

- ✅ manifest.json — שם, אייקון, צבע
- ✅ Service Worker עם Workbox — cache אוטומטי
- ✅ Offline support — הממשק עובד גם ללא אינטרנט
- ✅ "Add to Home Screen" ב-iOS ואנדרואיד
- ✅ Standalone mode — נראה כמו אפליקציה אמיתית

## 📁 מבנה קבצים

```
netlify-project/
├── src/
│   ├── App.jsx          # Router ראשי (מאמן / מתאמן)
│   ├── coach_app.jsx    # ממשק המאמנת
│   ├── client_app.jsx   # ממשק המתאמנת
│   └── main.jsx
├── public/
│   ├── icon-192.png     # אייקון PWA
│   ├── icon-512.png     # אייקון PWA גדול
│   └── logo.png
├── index.html           # עם כל meta tags של PWA
└── vite.config.js       # vite-plugin-pwa מוגדר
```
