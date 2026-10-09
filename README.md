# Dialog — Telegram Serverless Mini App

Bot, Mini App, endpointlar va ma'lumotlar bazasi to'liq
[Telegram Serverless](https://core.telegram.org/bots/serverless) ustida ishlaydi — server kerak emas.

## Tuzilma

```
app/index.html                     Mini App (hisoblagich + Premium ⭐ sotib olish)
tgcloud/schema.js                  users, payments jadvallari
tgcloud/handlers/message.js        /start → "Ochish" tugmasi; successful_payment → Premium yoqiladi
tgcloud/handlers/pre_checkout_query.js   to'lovdan oldingi tekshiruv
tgcloud/endpoints/getMe.js         foydalanuvchi holati (taps, premium)
tgcloud/endpoints/tap.js           hisoblagichni bazada oshiradi
tgcloud/endpoints/createInvoice.js Telegram Stars to'lov havolasi
tgcloud/lib/                       config, products, users
tgcloud.jsonc                      app/ ni Mini App sifatida joylaydi
```

## Deploy

**GitHub Actions orqali (telefondan):** `TGCLOUD_TOKEN` secret'ini qo'shing
(BotFather → bot → Serverless → CLI Access). Har bir push `.github/workflows/deploy.yml`
orqali `tgcloud push` va `tgcloud migrate --safe` ni bajaradi.

**Kompyuterdan:**

```bash
npm install
npx tgcloud login     # CLI Access tokenini kiriting
npx tgcloud push      # https://app<id>.tgcloud.ai/ manzilini chiqaradi
npx tgcloud migrate   # jadvallarni yaratadi
```

Chiqqan manzilni `tgcloud/lib/config.js` dagi `APP_URL` ga yozing va BotFather'da Menu Button qilib qo'ying.
