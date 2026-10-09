import { table, integer, text, boolean, uniqueIndex, sql } from 'sdk/db';

// Mini App'ni ochgan har bir Telegram foydalanuvchisi uchun bitta qator.
export const users = table('users', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  tgId:      integer('tg_id').notNull(),
  firstName: text('first_name'),
  taps:      integer('taps').notNull().default(0),
  premium:   boolean('premium').notNull().default(false),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (t) => ({
  tgIdx: uniqueIndex('uidx_users_tg').on(t.tgId),
}));

// Har bir muvaffaqiyatli Stars to'lovi. charge_id — qaytarish (refund) uchun kerak.
export const payments = table('payments', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  tgId:      integer('tg_id').notNull(),
  product:   text('product').notNull(),
  stars:     integer('stars').notNull(),
  chargeId:  text('charge_id').notNull(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (t) => ({
  chargeIdx: uniqueIndex('uidx_payments_charge').on(t.chargeId),
}));
