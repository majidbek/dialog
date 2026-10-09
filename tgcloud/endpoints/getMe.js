import { getOrCreateUser } from '../lib/users.js';
import { PRODUCTS } from '../lib/products.js';

// Mini App ochilganda: foydalanuvchining saqlangan holati va Premium narxi.
export default async function (input, ctx) {
  const me = await getOrCreateUser(ctx);
  return {
    firstName: me.firstName,
    taps: me.taps,
    premium: me.premium,
    premiumPrice: PRODUCTS.premium.stars,
  };
}
