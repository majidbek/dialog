import { db } from 'sdk';
import { desc } from 'sdk/db';
import { users } from '../schema.js';
import { requirePremium } from '../lib/users.js';

// Top-10 reyting — faqat Premium foydalanuvchilar ko'radi.
export default async function (input, ctx) {
  await requirePremium(ctx);
  const top = await db.select({ firstName: users.firstName, taps: users.taps })
    .from(users)
    .orderBy(desc(users.taps))
    .limit(10)
    .all();
  return { top };
}
