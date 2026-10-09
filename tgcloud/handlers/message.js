import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { users, payments } from '../schema.js';
import { APP_URL } from '../lib/config.js';

export default async function (message) {
  if (message.chat.type !== 'private') return;

  // To'lov muvaffaqiyatli o'tdi: yozib qo'yamiz va Premium'ni yoqamiz
  if (message.successful_payment) {
    const p = message.successful_payment;
    const { product } = JSON.parse(p.invoice_payload);
    await db.insert(payments).values({
      tgId: message.from.id,
      product,
      stars: p.total_amount,
      chargeId: p.telegram_payment_charge_id,
    }).onConflictDoNothing({ target: payments.chargeId }).run();
    await db.update(users).set({ premium: true }).where(eq(users.tgId, message.from.id)).run();

    await api.sendMessage({
      chat_id: message.chat.id,
      text: `Rahmat! ${p.total_amount} ⭐ qabul qilindi. Premium faollashtirildi.`,
    });
    return;
  }

  await api.sendMessage({
    chat_id: message.chat.id,
    text: 'Salom! Mini App\'ni ochish uchun pastdagi tugmani bosing.',
    reply_markup: {
      inline_keyboard: [[{ text: 'Ochish', web_app: { url: APP_URL } }]],
    },
  });
}
