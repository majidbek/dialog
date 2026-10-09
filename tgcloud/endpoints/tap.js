import { db } from 'sdk';
import { eq, sql } from 'sdk/db';
import { users } from '../schema.js';
import { getOrCreateUser } from '../lib/users.js';

// Hisoblagichni bazada oshiradi: oddiy +1, Premium +2.
export default async function (input, ctx) {
  const me = await getOrCreateUser(ctx);
  const step = me.premium ? 2 : 1;
  await db.run(sql`UPDATE users SET taps = taps + ${step} WHERE id = ${me.id}`);
  const row = await db.select().from(users).where(eq(users.id, me.id)).get();
  return { taps: row.taps, step };
}
