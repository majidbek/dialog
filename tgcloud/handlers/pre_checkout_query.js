import { api } from 'sdk';
import { PRODUCTS } from '../lib/products.js';

// To'lovdan oldingi tekshiruv: Telegram 10 soniya ichida javob kutadi.
export default async function (query) {
  let product = null;
  try {
    product = PRODUCTS[JSON.parse(query.invoice_payload).product];
  } catch {}

  const ok = Boolean(product) && query.currency === 'XTR' && query.total_amount === product.stars;
  await api.answerPreCheckoutQuery(ok
    ? { pre_checkout_query_id: query.id, ok: true }
    : { pre_checkout_query_id: query.id, ok: false, error_message: 'Mahsulot topilmadi' });
}
