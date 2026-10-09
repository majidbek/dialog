import { api, EndpointError } from 'sdk';
import { PRODUCTS } from '../lib/products.js';
import { getOrCreateUser } from '../lib/users.js';

// Telegram Stars to'lov havolasini yaratadi; Mini App uni openInvoice bilan ochadi.
export default async function (input, ctx) {
  const me = await getOrCreateUser(ctx);
  const product = PRODUCTS[input.product];
  if (!product) throw new EndpointError('Bunday mahsulot yo\'q.', { code: 'UNKNOWN_PRODUCT' });
  if (me.premium) throw new EndpointError('Sizda Premium allaqachon bor.', { code: 'ALREADY_PREMIUM' });

  const link = await api.createInvoiceLink({
    title: product.title,
    description: product.description,
    payload: JSON.stringify({ product: input.product }),
    currency: 'XTR', // Telegram Stars
    prices: [{ label: product.title, amount: product.stars }],
  });
  return { link };
}
