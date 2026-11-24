"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  SITE_INSTAGRAM_HANDLE,
  SITE_VIBER_PHONE,
} from "@/lib/siteContact";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";

type Channel = "instagram" | "viber";

/** Digits only (no +). Prefill text via clipboard — URL text param breaks many Viber clients. */
function viberChatUrl(): string {
  const digits = SITE_VIBER_PHONE.replace(/\D/g, "");
  return `viber://chat?number=${digits}`;
}

function instagramDirectUrl(): string {
  const handle = SITE_INSTAGRAM_HANDLE.replace(/^@/, "");
  return `https://ig.me/m/${encodeURIComponent(handle)}`;
}

export default function ProductDiscussOrder({
  lang,
  productId = "",
  productName = "",
  shadeLabel = "",
  label,
  intent = "order",
  defaultMessage,
  exposeChannels = false,
  className = "",
}: {
  lang: Locale;
  productId?: string;
  productName?: string;
  shadeLabel?: string;
  label?: string;
  intent?: "order" | "color" | "size" | "catalog";
  /** Full draft shown in the textarea (overrides product-based template). */
  defaultMessage?: string;
  /** Show Instagram + Viber links under the CTA (e.g. catalog empty state). */
  exposeChannels?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const defaultBody = useMemo(() => {
    if (defaultMessage?.trim()) return defaultMessage.trim();

    if (intent === "catalog") {
      return lang === "uk"
        ? [
            "Вітаю! Шукала моделі в каталозі за фільтрами, але нічого не знайшла.",
            "Потрібна допомога з підбором або індивідуальним пошиттям.",
            "",
            "Мій запит:",
          ].join("\n")
        : [
            "Hi! I searched the catalog with filters and found nothing.",
            "I need help choosing a piece or a custom order.",
            "",
            "My request:",
          ].join("\n");
    }

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
            productName
              ? `Модель: ${productName}${productId ? ` (${productId})` : ""}`
              : productId
                ? `Модель: ${productId}`
                : "",
            shadeLabel ? `Колір: ${shadeLabel}` : "",
            "",
            "Мій запит:",
          ]
        : [
            ask,
            productName
              ? `Item: ${productName}${productId ? ` (${productId})` : ""}`
              : productId
                ? `Item: ${productId}`
                : "",
            shadeLabel ? `Colour: ${shadeLabel}` : "",
            "",
            "My request:",
          ];
    return lines.filter(Boolean).join("\n");
  }, [
    defaultMessage,
    intent,
    lang,
    productId,
    productName,
    shadeLabel,
  ]);

  const prefixLenRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    prefixLenRef.current = defaultBody.length;
  }, [defaultBody]);

  const ensurePrefix = useCallback(
    (next: string) => {
      if (next.startsWith(defaultBody)) return next;
      const tail = next.slice(prefixLenRef.current);
      return defaultBody + tail;
    },
    [defaultBody]
  );

  const draft = ensurePrefix(message).trim() ? ensurePrefix(message) : defaultBody;

  const focusAfterPrefix = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = defaultBody.length;
    requestAnimationFrame(() => {
      el.setSelectionRange(pos, pos);
      el.focus();
    });
  }, [defaultBody]);

  useEffect(() => {
    if (!channel || exposeChannels) return;
    setMessage((prev) => {
      const trimmed = prev.trim();
      if (!trimmed || trimmed === defaultBody) return defaultBody;
      return ensurePrefix(prev);
    });
    focusAfterPrefix();
  }, [channel, defaultBody, ensurePrefix, focusAfterPrefix, exposeChannels]);

  useEffect(() => {
    if (!open || !exposeChannels) return;
    setMessage((prev) => {
      const trimmed = prev.trim();
      if (!trimmed || trimmed === defaultBody) return defaultBody;
      return ensurePrefix(prev);
    });
    focusAfterPrefix();
  }, [open, exposeChannels, defaultBody, ensurePrefix, focusAfterPrefix]);

  const send = useCallback(async (via?: Channel) => {
    setNotice(null);
    const ch = via ?? channel;
    const text = draft.trim();
    if (!text || !ch) return;

    if (ch === "viber") {
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

  const copyDraftForChannel = useCallback(async () => {
    const text = ensurePrefix(message).trim() || defaultBody;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* optional */
    }
  }, [defaultBody, ensurePrefix, message]);

  const channelLinks = exposeChannels ? (
    <div className="pdp-discuss-quick">
      <p className="pdp-discuss-lead">{t.product.discussChoose}</p>
      <div className="pdp-discuss-channels" role="group">
        <a
          href={instagramDirectUrl()}
          className="pdp-discuss-channel pdp-discuss-channel--ig"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void copyDraftForChannel()}
        >
          <svg className="pdp-discuss-channel-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
          </svg>
          <span>{t.product.discussInstagram}</span>
        </a>
        <a
          href={viberChatUrl()}
          className="pdp-discuss-channel pdp-discuss-channel--viber"
          onClick={() => void copyDraftForChannel()}
        >
          <svg className="pdp-discuss-channel-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3.2c-4.6 0-8.3 3.1-8.3 7 0 2.3 1.2 4.4 3.1 5.7l-.7 2.6 2.8-1.5c.9.3 1.9.4 3.1.4 4.6 0 8.3-3.1 8.3-7S16.6 3.2 12 3.2z" />
            <path
              d="M9.2 9.1c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.3c-.1.1-.2.3-.1.5.3.5.9 1.1 1.5 1.4.2.1.4.1.5-.1l.4-.5c.1-.2.3-.2.5-.1l1.7.7c.3.1.4.3.4.5v.5c0 .2 0 .4-.5.6-.4.2-1 .3-1.6.1-1.5-.4-3.1-1.7-4.1-3.2-.5-.7-.8-1.5-.7-2.2.1-.5.2-.8.2-1z"
              fill="currentColor"
              stroke="none"
            />
          </svg>
          <span>{t.product.discussMessenger}</span>
        </a>
      </div>
    </div>
  ) : null;

  return (
    <div className={`pdp-discuss${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="pdp-chat-link"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open) {
            setOpen(false);
            setChannel(null);
            setNotice(null);
            return;
          }
          setOpen(true);
          setNotice(null);
          setMessage(defaultBody);
          setChannel(exposeChannels ? "instagram" : null);
        }}
      >
        {label || t.product.customOrderCta}
      </button>

      {open ? (
        <div className="pdp-discuss-panel" id={panelId}>
          {!exposeChannels ? (
            <>
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
            </>
          ) : null}

          {channel ? (
            <>
              <label className="pdp-discuss-label" htmlFor={`${panelId}-msg`}>
                {t.product.discussMessageLabel}
              </label>
              <textarea
                ref={textareaRef}
                id={`${panelId}-msg`}
                className="pdp-discuss-textarea"
                rows={5}
                value={ensurePrefix(message)}
                onChange={(e) => setMessage(ensurePrefix(e.target.value))}
                onFocus={focusAfterPrefix}
              />
              {notice ? (
                <p className="pdp-discuss-notice" role="status">
                  {notice}
                </p>
              ) : null}
              {!exposeChannels ? (
                <button
                  type="button"
                  className="pdp-discuss-send"
                  onClick={() => void send()}
                >
                  {t.product.discussSend}
                </button>
              ) : (
                <p className="pdp-discuss-notice pdp-discuss-hint">
                  {lang === "uk"
                    ? "Відредагуйте текст і натисніть Instagram або Viber нижче — повідомлення скопіюється автоматично."
                    : "Edit the text and tap Instagram or Viber below — your message will be copied."}
                </p>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      {channelLinks}
    </div>
  );
}
