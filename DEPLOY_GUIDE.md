# 🚀 מדריך העלאה ל-Netlify ודומיין של ספיר

מדריך זה מוביל אותך **שלב אחרי שלב** מהזיפ הזה ועד שהדמו יהיה זמין ב-`app.sappirbarak.co.il` (או סאב-דומיין אחר שתבחר).

זמן מוערך: **30–60 דקות**, כולל זמן המתנה להפצת הדומיין.

---

## 📦 מה יש בזיפ

```
sappir-barak-demo/
├── index.html             ← נקודת כניסה ל-HTML
├── package.json           ← הגדרות npm (dependencies)
├── vite.config.js         ← הגדרות Vite (בנאי)
├── netlify.toml           ← הגדרות Netlify (build + SPA routing)
├── .gitignore
├── DEPLOY_GUIDE.md        ← המדריך הזה
└── src/
    ├── main.jsx           ← נקודת הכניסה של React
    ├── App.jsx            ← מסך בחירה בין מאמנת/מתאמנת
    ├── coach_app.jsx      ← צד המאמנת (ספיר)
    └── client_app.jsx     ← צד המתאמנת
```

---

## 🧪 בדיקה מקומית (אופציונלי אבל מומלץ)

**אם עדיין לא מותקן אצלך Node.js:**
- הורד מ-https://nodejs.org — גרסת LTS (20+)
- התקן ובדוק במסוף: `node -v` ו-`npm -v`

**בדיקה בעבודה:**

```bash
# חלץ את הזיפ לתיקייה כלשהי
cd sappir-barak-demo

# התקן dependencies
npm install

# הרץ שרת פיתוח
npm run dev

# פתח בדפדפן: http://localhost:5173
```

אם הכל עובד — סגור עם `Ctrl+C` ותעבור לשלב הבא.

---

## 🌐 שלב 1 — העלאה ל-Netlify

### אפשרות A: Drag & Drop (הכי מהיר, 5 דקות)

1. **בנה את הגרסה להפצה** מקומית:
   ```bash
   npm install
   npm run build
   ```
   זה ייצור תיקייה חדשה בשם `dist/` — זו התיקייה שנעלה.

2. **היכנס לאתר Netlify:** https://app.netlify.com
3. **הירשם** (בחינם) אם אין לך חשבון — ההרשמה עם Google/GitHub הכי מהירה.
4. **גרור את תיקיית `dist/` אל האזור "Drag and drop your site folder here"** במסך הבית של Netlify.
5. תוך כמה שניות Netlify יעלה את האתר וייתן לך כתובת כמו:
   ```
   https://spontaneous-otter-ab12cd.netlify.app
   ```
6. **פתח את הכתובת** — האתר אמור לעבוד! תראה את מסך הכניסה של סםיר.

### אפשרות B: חיבור ל-Git (מקצועי יותר, דיפלוי אוטומטי בכל שינוי)

בחר את זה אם אתה רוצה שכל `git push` יפרסם אוטומטית גרסה חדשה.

1. **יצירת ריפו ב-GitHub:**
   - פתח https://github.com/new
   - שם הריפו: `sappir-barak-demo` (או מה שתרצה)
   - בחר Private אם אתה לא רוצה שהקוד יהיה פומבי
   - לחץ "Create repository"

2. **דחיפת הקוד לריפו:**
   ```bash
   cd sappir-barak-demo
   git init
   git add .
   git commit -m "Initial commit — Sappir Barak demo"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sappir-barak-demo.git
   git push -u origin main
   ```

3. **חיבור ל-Netlify:**
   - היכנס ל-https://app.netlify.com
   - לחץ "Add new site" → "Import an existing project"
   - בחר GitHub
   - אשר את ההרשאה לקריאת הריפו שיצרת
   - בחר את הריפו `sappir-barak-demo`
   - הגדרות הבנייה יזוהו אוטומטית מקובץ `netlify.toml`:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - לחץ "Deploy"

**כל עדכון עתידי:** `git push` → Netlify מזהה ומעלה גרסה חדשה תוך 1-2 דקות.

---

## 🔗 שלב 2 — קישור לדומיין `sappirbarak.co.il`

עכשיו אנחנו מוסיפים תת-דומיין כמו **`app.sappirbarak.co.il`** שמפנה לאתר ב-Netlify.

### בצד Netlify:

1. באפליקציית Netlify, היכנס לאתר שהעלית (הקישור המוזר).
2. לך ל-**Site settings** → **Domain management**.
3. לחץ **Add a domain**.
4. הכנס `app.sappirbarak.co.il` (או מה שתבחר — `demo.sappirbarak.co.il`, `myapp.sappirbarak.co.il` וכו').
5. Netlify יציג לך הוראות DNS — **שמור אותן פתוחות**. תראה משהו כמו:
   ```
   CNAME: app.sappirbarak.co.il → your-site.netlify.app
   ```

### בצד ניהול הדומיין של `sappirbarak.co.il`:

כאן אתה צריך להיכנס לספק שאצלו קנית את הדומיין. מהאתר הקיים יכול להיות אחד מהבאים:
- **אחד מהספקים הישראליים:** Domain the Net, Livedns, Z-host, Cloudflare
- או ספק בינלאומי: GoDaddy, Namecheap, Google Domains

**צעדים כלליים (זהים לכל ספק):**

1. היכנס לממשק ניהול ה-DNS של הדומיין `sappirbarak.co.il`.
2. חפש **DNS Records** / **רשומות DNS** / **Zone Editor**.
3. הוסף רשומה חדשה מסוג **CNAME**:
   ```
   Type:   CNAME
   Name:   app        ← או מה שבחרת (demo, my, וכו')
   Value:  your-site.netlify.app  ← הכתובת המדויקת של Netlify
   TTL:    3600  (או Auto)
   ```
4. **שמור**.

### אימות ב-Netlify:

1. חזור ל-Netlify → Domain management.
2. לחץ "Verify DNS configuration".
3. תוך **5-60 דקות** (לפעמים עד 24 שעות בעברית) — הדומיין יעבוד.

### הפעלת HTTPS (חשוב!):

1. ב-Netlify → Domain management → **HTTPS**.
2. לחץ "Verify DNS configuration" וואחר כך "Provision certificate".
3. Netlify ייתן תעודת SSL חינם מ-Let's Encrypt תוך כמה דקות.
4. הפעל "Force HTTPS".

**עכשיו `https://app.sappirbarak.co.il` יעבוד עם תעודה תקינה!** 🎉

---

## 🔄 עדכונים עתידיים

### אם בחרת Drag & Drop:
- הרץ `npm run build` שוב
- גרור את `dist/` החדש ל-Netlify (באותו מקום)

### אם בחרת Git:
- ערוך את הקוד מקומית
- `git add . && git commit -m "שינוי X" && git push`
- Netlify מעלה אוטומטית תוך דקה

---

## 🎯 מה Sappir רואה כשהיא נכנסת

1. **מסך בחירה** עם לוגו "SAPPIR BARAK" ושני כפתורים: "אני ספיר" / "אני מתאמנת"
2. **כפתור "החלף תצוגה"** בפינה — מאפשר לה לעבור בין שני הצדדים בכל רגע
3. **בצד המאמנת:** דשבורד מלא — לקוחות, תוכניות, מחשבון מאקרו, הודעות
4. **בצד המתאמנת:** 5 טאבים — בית, יומן, אימון, התקדמות, הודעות + צ'אט AI

---

## ⚠️ חשוב להסביר לספיר

**זה דמו בלבד** — הנתונים לא נשמרים בין רענונים. כשהיא "מוסיפה לקוחה" או "שולחת הודעה" זה לדוגמה בלבד.

הדמו המטרה שלו:
- ✅ להראות את העיצוב
- ✅ להרגיש את הזרימה
- ✅ לקבל ממנה פידבק ושיפורים
- ❌ **אינו** מוצר production — הנתונים לא נשמרים, אין DB אמיתי

אחרי שספיר מאשרת את העיצוב — נעבור לשלב הבא: **בנייה מלאה עם backend ו-DB**.

---

## 📞 בעיות?

- **הבנייה נכשלת ב-Netlify** — בדוק שגרסת Node ב-`netlify.toml` היא 20 ושה-`package.json` נכון.
- **הדומיין לא נטען אחרי 24 שעות** — בדוק ב-https://dnschecker.org שהרשומה התפשטה.
- **נראה שבור בטלפון** — דפדפן לפעמים קאש. נסה מצב פרטי.

---

## 🎁 בונוס — PWA (Progressive Web App)

אם תרצה שספיר תוכל "להתקין" את הדמו כאפליקציה על הטלפון (הוספה למסך הבית):

צור קובץ `public/manifest.json`:

```json
{
  "name": "Sappir Barak",
  "short_name": "Sappir",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F0FA",
  "theme_color": "#B794D4",
  "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"}]
}
```

והוסף ל-`index.html` בין תגי `<head>`:
```html
<link rel="manifest" href="/manifest.json" />
```

זה אופציונלי — לא חובה.

---

בהצלחה, תומר! 💜
