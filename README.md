# DeadlineT — Drive-based Tasks (No server) — Ready for Vercel

این پروژه یک اپ تک‌صفحه‌ای React (Vite) است که:
- بدون سرور است (کل داده‌ها در Google Drive کاربر ذخیره می‌شود)
- با Google Identity Services برای گرفتن access token کار می‌کند
- مناسب اجرا روی **Vercel** یا محلی

---

## فایل‌ها
- `public/` — index.html، manifest و service worker
- `src/` — اپ React: `App.jsx`, `googleDrive.js`, `main.jsx`, `styles.css`
- `package.json` — اسکریپت‌های dev/build/preview

---

## گام‌به‌گام راه‌اندازی (Local + Vercel)

### 1) پیش‌نیازها
- Node.js نصب شده
- حساب Google
- حساب GitHub و repo (شما قبلاً آپلود کردید)

### 2) ساخت Google OAuth Client ID
1. برو به: https://console.cloud.google.com/apis/credentials
2. اگر پروژه ندارید بسازید (مثلاً: DeadlineT)
3. **OAuth consent screen** را برای External و با ایمیل خودتان تنظیم کنید
4. **Create Credentials → OAuth client ID**:
   - Application type: Web application
   - Authorized JavaScript origins:
     - http://localhost:5173
     - http://localhost:3000
     - https://deadlinet.vercel.app
   - Authorized redirect URIs:
     - http://localhost:5173
     - http://localhost:3000
     - https://deadlinet.vercel.app
5. Enable **Google Drive API** in APIs & Services → Library
6. Copy the **Client ID** (ends with `.apps.googleusercontent.com`)

### 3) قرار دادن Client ID در پروژه
در `src/App.jsx` مقدار `CLIENT_ID_PLACEHOLDER` را با مقدار Client ID جایگزین کنید:
```js
const CLIENT_ID_PLACEHOLDER = 'YOUR_CLIENT_ID.apps.googleusercontent.com'
```

### 4) نصب و اجرای محلی
```
npm install
npm run dev
```
و مرورگر را باز کنید: http://localhost:5173 (یا port که Vite نشان می‌دهد)

### 5) Deploy روی Vercel
1. Push به GitHub
2. در Vercel import project از GitHub و Deploy
3. در Google Cloud Console مطمئن شو origin `https://deadlinet.vercel.app` اضافه شده
4. باز کردن آدرس https://deadlinet.vercel.app و کلیک روی "Sign in with Google (Drive)"

---

## نکات امنیتی و محدودیت‌ها
- این اپ از `drive.file` scope استفاده می‌کند، که اجازهٔ دسترسی به فایل‌هایی که اپ ایجاد می‌کند را می‌دهد.
- توکن فقط در حافظهٔ مرورگر نگهداری می‌شود.
- اگر اپ برای انتشار عمومی بزرگ‌تر شد، ممکن است نیاز به App Verification در Google Console باشد.

---

## کمک و عیب‌یابی
- اگر popup لاگین باز نمی‌شود یا origin mismatch: در Console (Google Cloud) origin را بررسی کن
- اگر خطای Drive API: بررسی کن که Drive API فعال باشد و توکن ست شده باشد

