export const SETTING_KEYS = [
  "telegram_bot_token",
  "telegram_chat_id",
  "nova_poshta_api_key",
  "site_url",
  "hero_image",
  "hero_image_position",
  "hero_since_uk",
  "hero_since_en",
  "hero_title_uk",
  "hero_title_en",
  "hero_subtitle_uk",
  "hero_subtitle_en",
] as const;

/** Keys edited on the Hero admin screen. */
export const HERO_SETTING_KEYS = [
  "hero_image",
  "hero_image_position",
  "hero_since_uk",
  "hero_since_en",
  "hero_title_uk",
  "hero_title_en",
  "hero_subtitle_uk",
  "hero_subtitle_en",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type SettingsMap = Record<SettingKey, string>;
