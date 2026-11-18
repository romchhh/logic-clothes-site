export const SITE_NAME = "Logic Clothes";
export const SITE_PHONE = "+380669708735";
export const SITE_PHONE_DISPLAY = "+38 066 970 87 35";
export const SITE_EMAIL = "logicclothes.ua@gmail.com";
export const SITE_INSTAGRAM_HANDLE = "_logic_clothes";
export const SITE_INSTAGRAM = "https://www.instagram.com/_logic_clothes/";
export const SITE_ADDRESS_LINES = [
  "Україна, м. Київ",
  "вул. Софіївська, 5",
  "Logic Clothes Concept store",
] as const;

/** Sofiivska 5, Kyiv — Logic Clothes Concept store (building, not the square). */
export const SITE_MAP_COORDS = { lat: 50.451367, lng: 30.520645 } as const;

/** Google Maps embed pinned to the store. */
export const SITE_MAP_EMBED =
  `https://maps.google.com/maps?q=${SITE_MAP_COORDS.lat},${SITE_MAP_COORDS.lng}&hl=uk&z=18&output=embed`;

export const SITE_MAP_LINK =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Logic Clothes, вул. Софіївська, 5, Київ");


