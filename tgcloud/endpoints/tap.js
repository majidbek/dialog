import { db } from 'sdk';
import { eq, sql } from 'sdk/db';
import { users } from '../schema.js';
import { getOrCreateUser } from '../lib/users.js';

// Hisoblagichni bazada bittaga oshiradi.
export default async function (input, ctx) {
  const me = await getOrCreateUser(ctx);
  await db.run(sql`UPDATE users SET taps = taps + 1 WHERE id = ${me.id}`);
  const row = await db.select().from(users).where(eq(users.id, me.id)).get();
  return { taps: row.taps };
}
