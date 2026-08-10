# Runtime (Live Candle/CHOCH/BOS Worker)

این پروژه دو روش برای اجرای مداوم منطق "بگیر یک کندل جدید → detect CHOCH → detect BOS" داره. منطق مشترک هر دو، در `src/services/runtime/runtime.service.js` (تابع `runRuntimeTick`) هست.

## روش ۱: اسکریپت مستقل (Local / VPS / سرور خودتان)

برای اجرای local یا روی هر سروری که اجازه‌ی process دائمی می‌ده (VPS، Docker، PM2 و ...):

```bash
npm run runtime
```

این دستور `src/runtime/live-runtime.mjs` رو اجرا می‌کنه که یک حلقه‌ی بی‌نهایت هست و هر `RUNTIME_INTERVAL_MS` میلی‌ثانیه (پیش‌فرض ۱۵۰۰۰ = ۱۵ ثانیه) یک بار `runRuntimeTick()` رو صدا می‌زنه:

```bash
RUNTIME_INTERVAL_MS=30000 npm run runtime
```

با `Ctrl+C` هم به‌صورت graceful متوقف می‌شه (اتصال Mongo بسته می‌شه).

⚠️ **این روش روی Vercel کار نمی‌کنه.**

## روش ۲: Vercel (API Route + Cron)

چون Vercel serverless هست و process دائمی/حلقه‌ی بی‌نهایت رو پشتیبانی نمی‌کنه، منطق tick به‌صورت یک API route پیاده شده:

```
GET /api/runtime/tick
```

هر بار صدا زدن این route، فقط **یک دور** اجرا می‌کنه (نه حلقه). برای اجرای دوره‌ای، باید یک scheduler این route رو صدا بزنه.

### گزینه‌ی الف: Vercel Cron Jobs (توکار)

فایل `vercel.json` این cron رو تعریف کرده:

```json
{
  "crons": [
    { "path": "/api/runtime/tick", "schedule": "* * * * *" }
  ]
}
```

⚠️ **محدودیت مهم:** روی پلن **Hobby (رایگان)** Vercel، Cron Job حداکثر **یک‌بار در روز** قابل اجراست — هر schedule با فرکانس بالاتر (مثل هر دقیقه) موقع deploy با خطا رد می‌شه. برای اجرای هر دقیقه (که برای این پروژه لازمه) باید پلن **Pro** داشته باشید.

### گزینه‌ی ب: Scheduler بیرونی (برای پلن Hobby)

اگه روی Hobby هستید، از یک scheduler بیرونی برای صدا زدن `https://your-app.vercel.app/api/runtime/tick` هر دقیقه استفاده کنید:

- [cron-job.org](https://cron-job.org) (رایگان)
- [Upstash QStash](https://upstash.com/docs/qstash)
- GitHub Actions با `schedule` (رایگان، ولی دقت زمانی کمتر - معمولاً چند دقیقه تأخیر)

در این حالت باید هدر زیر رو خودتون توی تنظیمات scheduler اضافه کنید (چون دیگه خود Vercel این هدر رو نمی‌فرسته):

```
Authorization: Bearer <CRON_SECRET>
```

### تنظیم `CRON_SECRET`

این route با یک `CRON_SECRET` محافظت می‌شه تا کسی دیگه نتونه مستقیم صداش بزنه:

1. یک مقدار تصادفی امن بسازید (مثلاً `openssl rand -hex 32`)
2. توی Vercel Project Settings → Environment Variables، مقدار `CRON_SECRET` رو ست کنید
3. اگه از Vercel Cron توکار استفاده می‌کنید، خود Vercel این هدر رو خودکار می‌فرسته
4. اگه از scheduler بیرونی استفاده می‌کنید، خودتون این هدر رو دستی اضافه کنید

## خلاصه‌ی تصمیم‌گیری

| سناریو | روش پیشنهادی |
|---|---|
| اجرای local برای تست | `npm run runtime` |
| سرور اختصاصی / VPS / Docker | `npm run runtime` (با PM2 یا systemd برای persistent بودن) |
| Vercel + پلن Pro | `vercel.json` (Cron توکار، هر دقیقه) |
| Vercel + پلن Hobby | API route + scheduler بیرونی (cron-job.org یا مشابه) |
