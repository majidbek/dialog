import { getOrCreateUser } from '../lib/users.js';

// Mini App ochilganda: foydalanuvchining saqlangan holati.
export default async function (input, ctx) {
  const me = await getOrCreateUser(ctx);
  return { firstName: me.firstName, taps: me.taps, premium: me.premium };
}
