export const SETTING_KEYS = [
  "telegram_bot_token",
  "telegram_chat_id",
  "nova_poshta_api_key",
  "site_url",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type SettingsMap = Record<SettingKey, string>;
