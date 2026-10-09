import { api, db } from 'sdk';
import { and, eq, desc, sql } from 'sdk/db';
import { users, payments } from '../schema.js';

// /stats — foydalanuvchilar, Premium va tushum.
export async function sendStats(chatId) {
  const totalUsers = await db.$count(users);
  const premiumUsers = await db.$count(users, eq(users.premium, true));
  const revenue = await db.get(sql`
    SELECT count(*) AS n, coalesce(sum(stars), 0) AS stars
    FROM payments WHERE refunded = 0`);
  const today = await db.get(sql`
    SELECT count(*) AS n, coalesce(sum(stars), 0) AS stars
    FROM payments WHERE refunded = 0 AND created_at >= unixepoch('now', 'start of day')`);

  await api.sendMessage({
    chat_id: chatId,
    text:
      `📊 Statistika\n\n` +
      `Foydalanuvchilar: ${totalUsers}\n` +
      `Premium: ${premiumUsers}\n\n` +
      `Bugun: ${today.n} to'lov, ${today.stars} ⭐\n` +
      `Jami: ${revenue.n} to'lov, ${revenue.stars} ⭐`,
  });
}

// /refund <charge_id> — Stars'ni qaytaradi va Premium'ni o'chiradi.
export async function refund(chatId, chargeId) {
  if (!chargeId) {
    const last = await db.select().from(payments)
      .where(eq(payments.refunded, false))
      .orderBy(desc(payments.id))
      .limit(5)
      .all();
    const lines = last.map((p) => `${p.stars} ⭐ · user ${p.tgId}\n/refund ${p.chargeId}`);
    await api.sendMessage({
      chat_id: chatId,
      text: lines.length ? `Oxirgi to'lovlar:\n\n${lines.join('\n\n')}` : 'To\'lovlar yo\'q.',
    });
    return;
  }

  const p = await db.select().from(payments)
    .where(and(eq(payments.chargeId, chargeId), eq(payments.refunded, false)))
    .get();
  if (!p) {
    await api.sendMessage({ chat_id: chatId, text: 'Bunday to\'lov topilmadi yoki allaqachon qaytarilgan.' });
    return;
  }

  await api.refundStarPayment({ user_id: p.tgId, telegram_payment_charge_id: p.chargeId });
  await db.update(payments).set({ refunded: true }).where(eq(payments.id, p.id)).run();
  await db.update(users).set({ premium: false }).where(eq(users.tgId, p.tgId)).run();
  await api.sendMessage({ chat_id: chatId, text: `Qaytarildi: ${p.stars} ⭐ → user ${p.tgId}` });
}
