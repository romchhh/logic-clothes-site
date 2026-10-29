"use client";

import { useCallback, useId, useMemo, useState } from "react";
import {
  SITE_INSTAGRAM_HANDLE,
  SITE_PHONE,
} from "@/lib/siteContact";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";

type Channel = "instagram" | "viber";

function viberChatUrl(text: string): string {
  const digits = SITE_PHONE.replace(/\D/g, "");
  return `viber://chat?number=%2B${digits}&text=${encodeURIComponent(text)}`;
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
}: {
  lang: Locale;
  productId: string;
  productName: string;
  shadeLabel: string;
}) {
  const { t } = useI18n();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const defaultBody = useMemo(() => {
    const lines =
      lang === "uk"
        ? [
            "Вітаю! Хочу обговорити замовлення.",
            productName ? `Модель: ${productName} (${productId})` : `Модель: ${productId}`,
            shadeLabel ? `Колір: ${shadeLabel}` : "",
            "",
            "Мій запит:",
          ]
        : [
            "Hi! I'd like to discuss an order.",
            productName ? `Item: ${productName} (${productId})` : `Item: ${productId}`,
            shadeLabel ? `Colour: ${shadeLabel}` : "",
            "",
            "My request:",
          ];
    return lines.filter(Boolean).join("\n");
  }, [lang, productId, productName, shadeLabel]);

  const draft = message.trim() ? message : defaultBody;

  const send = useCallback(async () => {
    setNotice(null);
    const text = draft.trim();
    if (!text || !channel) return;

    if (channel === "viber") {
      window.location.href = viberChatUrl(text);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setNotice(t.product.discussCopied);
    } catch {
      setNotice(t.product.discussCopyManual);
    }
    window.open(instagramDirectUrl(), "_blank", "noopener,noreferrer");
  }, [channel, draft, t.product.discussCopied, t.product.discussCopyManual]);

  return (
    <div className="pdp-discuss">
      <button
        type="button"
        className="pdp-custom-order-cta"
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
        {t.product.customOrderCta}
      </button>

      {open ? (
        <div className="pdp-discuss-panel" id={panelId}>
          <p className="pdp-discuss-lead">{t.product.discussChoose}</p>
          <div className="pdp-discuss-channels" role="group">
            <button
              type="button"
              className={`pdp-discuss-channel${channel === "instagram" ? " is-active" : ""}`}
              aria-pressed={channel === "instagram"}
              onClick={() => {
                setChannel("instagram");
                setNotice(null);
              }}
            >
              {t.product.discussInstagram}
            </button>
            <button
              type="button"
              className={`pdp-discuss-channel${channel === "viber" ? " is-active" : ""}`}
              aria-pressed={channel === "viber"}
              onClick={() => {
                setChannel("viber");
                setNotice(null);
              }}
            >
              {t.product.discussMessenger}
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
