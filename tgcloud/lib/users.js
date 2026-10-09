import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { users } from '../schema.js';

// Chaqiruvchi foydalanuvchining qatori; birinchi marta kirsa — yaratiladi.
export async function getOrCreateUser(ctx) {
  const user = ctx.initData.user;
  if (!user) throw new EndpointError('Ilovani Telegram ichida oching.', { code: 'NO_USER' });

  await db.insert(users)
    .values({ tgId: user.id, firstName: user.first_name })
    .onConflictDoNothing({ target: users.tgId })
    .run();
  return db.select().from(users).where(eq(users.tgId, user.id)).get();
}

// Faqat Premium foydalanuvchilar uchun: aks holda endpoint rad etiladi.
export async function requirePremium(ctx) {
  const me = await getOrCreateUser(ctx);
  if (!me.premium) throw new EndpointError('Bu imkoniyat faqat Premium uchun.', { code: 'PREMIUM_REQUIRED' });
  return me;
}
