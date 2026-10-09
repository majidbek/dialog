// Cloudflare Worker: Telegram bot backend + Telegram Stars to'lovi.
//
// Sozlamalar (Cloudflare → Worker → Settings → Variables and Secrets):
//   BOT_TOKEN      (Secret) — @BotFather bergan token
//   WEBHOOK_SECRET (Secret) — o'zingiz o'ylab topgan tasodifiy so'z (A-Z, a-z, 0-9, _ -)
//
// Yo'llar:
//   GET  /setup?key=WEBHOOK_SECRET  — Telegram webhook'ni shu Worker'ga ulaydi (bir marta)
//   POST /webhook                   — Telegram yangilanishlari (xabarlar, to'lovlar)
//   POST /api/invoice               — Mini App'dan: Stars to'lov havolasini yaratadi

const WEBAPP_URL = 'https://majidbek.github.io/dialog/';
const ALLOWED_ORIGIN = 'https://majidbek.github.io';

// Sotiladigan mahsulotlar. Narx — Telegram Stars (XTR) da.
const PRODUCTS = {
  premium: {
    title: 'Premium',
    description: 'Dialog Mini App Premium imkoniyatlari',
    stars: 1,
  },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (url.pathname === '/setup' && request.method === 'GET') {
        return await handleSetup(url, env);
      }
      if (url.pathname === '/webhook' && request.method === 'POST') {
        return await handleWebhook(request, env);
      }
      if (url.pathname === '/api/invoice' && request.method === 'POST') {
        return await handleInvoice(request, env);
      }
      return new Response('Dialog bot ishlayapti', { status: 200 });
    } catch (err) {
      console.error(err);
      return json({ error: 'server_error' }, 500);
    }
  },
};

// --- /setup: webhook'ni ulash ---------------------------------------------

async function handleSetup(url, env) {
  if (url.searchParams.get('key') !== env.WEBHOOK_SECRET) {
    return new Response('Kalit noto\'g\'ri', { status: 403 });
  }
  const result = await tg(env, 'setWebhook', {
    url: `${url.origin}/webhook`,
    secret_token: env.WEBHOOK_SECRET,
    allowed_updates: ['message', 'pre_checkout_query'],
  });
  return json(result);
}

// --- /webhook: Telegram'dan keladigan yangilanishlar -----------------------

async function handleWebhook(request, env) {
  // Faqat Telegram yuborgan so'rovlarni qabul qilamiz
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }
  const update = await request.json();

  // To'lovdan oldingi tekshiruv: 10 soniya ichida javob berish shart
  if (update.pre_checkout_query) {
    const q = update.pre_checkout_query;
    const payload = safeParse(q.invoice_payload);
    const product = payload && PRODUCTS[payload.product];
    const ok = Boolean(product) && q.currency === 'XTR' && q.total_amount === product.stars;
    await tg(env, 'answerPreCheckoutQuery', ok
      ? { pre_checkout_query_id: q.id, ok: true }
      : { pre_checkout_query_id: q.id, ok: false, error_message: 'Mahsulot topilmadi' });
    return new Response('ok');
  }

  const msg = update.message;
  if (!msg) return new Response('ok');

  // To'lov muvaffaqiyatli o'tdi
  if (msg.successful_payment) {
    const p = msg.successful_payment;
    console.log('PAYMENT', JSON.stringify({
      user_id: msg.from.id,
      stars: p.total_amount,
      payload: p.invoice_payload,
      charge_id: p.telegram_payment_charge_id,
    }));
    await tg(env, 'sendMessage', {
      chat_id: msg.chat.id,
      text: `Rahmat! ${p.total_amount} ⭐ qabul qilindi. Premium faollashtirildi.`,
    });
    return new Response('ok');
  }

  if (msg.text && msg.text.startsWith('/start')) {
    await tg(env, 'sendMessage', {
      chat_id: msg.chat.id,
      text: 'Salom! Mini App\'ni ochish uchun pastdagi tugmani bosing.',
      reply_markup: {
        inline_keyboard: [[{ text: 'Ochish', web_app: { url: WEBAPP_URL } }]],
      },
    });
  }
  return new Response('ok');
}

// --- /api/invoice: Mini App'dan to'lov havolasi so'rash --------------------

async function handleInvoice(request, env) {
  const body = await request.json().catch(() => ({}));
  const user = await validateInitData(body.initData, env.BOT_TOKEN);
  if (!user) return json({ error: 'unauthorized' }, 401);

  const product = PRODUCTS[body.product];
  if (!product) return json({ error: 'unknown_product' }, 400);

  const result = await tg(env, 'createInvoiceLink', {
    title: product.title,
    description: product.description,
    payload: JSON.stringify({ product: body.product, user_id: user.id }),
    currency: 'XTR', // Telegram Stars
    prices: [{ label: product.title, amount: product.stars }],
  });
  if (!result.ok) return json({ error: 'telegram_error', detail: result.description }, 502);
  return json({ link: result.result });
}

// --- initData tekshiruvi -----------------------------------------------------
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// Mini App yuborgan ma'lumot haqiqatan Telegram'dan kelganini HMAC imzo orqali tekshiradi.

async function validateInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (typeof initData !== 'string' || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = await hmac(new TextEncoder().encode('WebAppData'), botToken);
  const expected = toHex(await hmac(secretKey, dataCheckString));
  if (!timingSafeEqual(expected, hash)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  return safeParse(params.get('user'));
}

async function hmac(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// --- Yordamchilar ------------------------------------------------------------

async function tg(env, method, params) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
