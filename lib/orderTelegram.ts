import type { CheckoutPayload, DeliveryMethod, PaymentType } from "@/lib/types";
import { variantSummary } from "@/lib/orderVariant";
import { resolveSetting } from "@/lib/settings";
import { SITE_NAME } from "@/lib/siteContact";
import { PREPAY_AMOUNT_UAH } from "@/lib/wayforpay";

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  nova_poshta_branch: "Нова Пошта · відділення",
  nova_poshta_locker: "Нова Пошта · поштомат",
  nova_poshta_courier: "Нова Пошта · кур’єр",
  pickup: "Самовивіз · Софіївська, 5",
  international: "Міжнародна доставка",
};

const PAYMENT_LABELS: Record<PaymentType, string> = {
  full: "Повна оплата (WayForPay)",
  prepay: `Передоплата ${PREPAY_AMOUNT_UAH} ₴ (WayForPay)`,
  pay_after: "Післяплата",
};

function formatMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString("uk-UA")} ₴`;
}

export async function sendOrderTelegramNotification(
  payload: CheckoutPayload,
  orderId: string,
  opts?: { amountToPay?: number; paymentPending?: boolean }
): Promise<boolean> {
  const BOT_TOKEN = await resolveSetting("telegram_bot_token", [
    process.env.BOT_TOKEN,
  ]);
  const CHAT_ID = await resolveSetting("telegram_chat_id", [
    process.env.CHAT_ID,
  ]);
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[telegram] BOT_TOKEN or CHAT_ID missing — order not sent");
    return false;
  }

  const total = payload.items.reduce(
    (sum, item) => sum + item.priceNum * item.quantity,
    0
  );

  const lines = payload.items
    .map((item, i) => {
      const variant = variantSummary(item) || item.size;
      return `${i + 1}. ${item.name}\n   ${variant}\n   ×${item.quantity} · ${formatMoney(item.priceNum * item.quantity)}`;
    })
    .join("\n");

  const paymentType = payload.paymentType || "pay_after";
  const payLine =
    opts?.amountToPay != null && opts.amountToPay > 0
      ? `\n💳 <b>До оплати зараз:</b> ${formatMoney(opts.amountToPay)}${opts.paymentPending ? " (очікуємо WayForPay)" : ""}`
      : "";

  const text = `
🛒 <b>Нове замовлення · ${SITE_NAME}</b>

🆔 <b>ID:</b> ${orderId}
🌐 <b>Мова:</b> ${(payload.locale || "uk").toUpperCase()}

👤 <b>Ім’я:</b> ${escapeHtml(payload.customerName)}
📱 <b>Тел:</b> ${escapeHtml(payload.phone)}
📧 <b>Email:</b> ${escapeHtml(payload.email || "—")}
🚚 <b>Доставка:</b> ${DELIVERY_LABELS[payload.deliveryMethod] || payload.deliveryMethod}
💰 <b>Оплата:</b> ${PAYMENT_LABELS[paymentType] || paymentType}${payLine}
🏙️ <b>Місто:</b> ${escapeHtml(payload.city)}
🏤 <b>Адреса:</b> ${escapeHtml(payload.address)}
📝 <b>Коментар:</b> ${escapeHtml(payload.comment || "—")}

📦 <b>Товари:</b>
${lines}

🧾 <b>Разом:</b> ${formatMoney(total)}
`.trim();

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[telegram] send failed", res.status, body);
    return false;
  }

  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
