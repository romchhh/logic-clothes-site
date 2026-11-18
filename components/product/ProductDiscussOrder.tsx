"use client";

import { useCallback, useId, useMemo, useState } from "react";
import {
  SITE_INSTAGRAM_HANDLE,
  SITE_PHONE,
} from "@/lib/siteContact";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";

type Channel = "instagram" | "viber";

/** Digits only (no +). Prefill text via clipboard — URL text param breaks many Viber clients. */
function viberChatUrl(): string {
  const digits = SITE_PHONE.replace(/\D/g, "");
  return `viber://chat?number=${digits}`;
}

function instagramDirectUrl(): string {
  const handle = SITE_INSTAGRAM_HANDLE.replace(/^@/, "");
  return `https://ig.me/m/${encodeURIComponent(handle)}`;
}

export default function ProductDiscussOrder({
  lang,
  productId,
  productName,
  shadeLabel,
  label,
  intent = "order",
}: {
  lang: Locale;
  productId: string;
  productName: string;
  shadeLabel: string;
  label?: string;
  intent?: "order" | "color" | "size";
}) {
  const { t } = useI18n();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const defaultBody = useMemo(() => {
    const ask =
      intent === "color"
        ? lang === "uk"
          ? "Хочу пошити цю модель у своєму кольорі."
          : "I'd like this piece sewn in my own colour."
        : intent === "size"
          ? lang === "uk"
            ? "Хочу замовити цю модель у своєму розмірі."
            : "I'd like this piece in my own size."
          : lang === "uk"
            ? "Вітаю! Хочу обговорити замовлення."
            : "Hi! I'd like to discuss an order.";
    const lines =
      lang === "uk"
        ? [
            ask,
            productName ? `Модель: ${productName} (${productId})` : `Модель: ${productId}`,
            shadeLabel ? `Колір: ${shadeLabel}` : "",
            "",
            "Мій запит:",
          ]
        : [
            ask,
            productName ? `Item: ${productName} (${productId})` : `Item: ${productId}`,
            shadeLabel ? `Colour: ${shadeLabel}` : "",
            "",
            "My request:",
          ];
    return lines.filter(Boolean).join("\n");
  }, [intent, lang, productId, productName, shadeLabel]);

  const draft = message.trim() ? message : defaultBody;

  const send = useCallback(async () => {
    setNotice(null);
    const text = draft.trim();
    if (!text || !channel) return;

    if (channel === "viber") {
      try {
        await navigator.clipboard.writeText(text);
        setNotice(
          lang === "uk"
            ? "Текст скопійовано — вставте його у Viber."
            : "Text copied — paste it into Viber."
        );
      } catch {
        /* open chat anyway */
      }
      window.location.href = viberChatUrl();
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setNotice(t.product.discussCopied);
    } catch {
      setNotice(t.product.discussCopyManual);
    }
    window.open(instagramDirectUrl(), "_blank", "noopener,noreferrer");
  }, [channel, draft, lang, t.product.discussCopied, t.product.discussCopyManual]);

  return (
    <div className="pdp-discuss">
      <button
        type="button"
        className="pdp-chat-link"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((v) => !v);
          if (open) {
            setChannel(null);
            setNotice(null);
          }
        }}
      >
        {label || t.product.customOrderCta}
      </button>

      {open ? (
        <div className="pdp-discuss-panel" id={panelId}>
          <p className="pdp-discuss-lead">{t.product.discussChoose}</p>
          <div className="pdp-discuss-channels" role="group">
            <button
              type="button"
              className={`pdp-discuss-channel pdp-discuss-channel--ig${channel === "instagram" ? " is-active" : ""}`}
              aria-pressed={channel === "instagram"}
              onClick={() => {
                setChannel("instagram");
                setNotice(null);
              }}
            >
              <svg className="pdp-discuss-channel-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
              </svg>
              <span>{t.product.discussInstagram}</span>
            </button>
            <button
              type="button"
              className={`pdp-discuss-channel pdp-discuss-channel--viber${channel === "viber" ? " is-active" : ""}`}
              aria-pressed={channel === "viber"}
              onClick={() => {
                setChannel("viber");
                setNotice(null);
              }}
            >
              <svg className="pdp-discuss-channel-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3.2c-4.6 0-8.3 3.1-8.3 7 0 2.3 1.2 4.4 3.1 5.7l-.7 2.6 2.8-1.5c.9.3 1.9.4 3.1.4 4.6 0 8.3-3.1 8.3-7S16.6 3.2 12 3.2z" />
                <path d="M9.2 9.1c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.3c-.1.1-.2.3-.1.5.3.5.9 1.1 1.5 1.4.2.1.4.1.5-.1l.4-.5c.1-.2.3-.2.5-.1l1.7.7c.3.1.4.3.4.5v.5c0 .2 0 .4-.5.6-.4.2-1 .3-1.6.1-1.5-.4-3.1-1.7-4.1-3.2-.5-.7-.8-1.5-.7-2.2.1-.5.2-.8.2-1z" fill="currentColor" stroke="none" />
              </svg>
              <span>{t.product.discussMessenger}</span>
            </button>
          </div>

          {channel ? (
            <>
              <label className="pdp-discuss-label" htmlFor={`${panelId}-msg`}>
                {t.product.discussMessageLabel}
              </label>
              <textarea
                id={`${panelId}-msg`}
                className="pdp-discuss-textarea"
                rows={5}
                placeholder={defaultBody}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {notice ? (
                <p className="pdp-discuss-notice" role="status">
                  {notice}
                </p>
              ) : null}
              <button
                type="button"
                className="pdp-discuss-send"
                onClick={() => void send()}
              >
                {t.product.discussSend}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
