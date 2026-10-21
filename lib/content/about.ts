import type { Locale } from "@/lib/i18n/config";

export type AboutContent = {
  title: string;
  lead: string;
  sectionTitle: string;
  points: string[];
  closingTitle: string;
  closing: string[];
};

export const aboutContent: Record<Locale, AboutContent> = {
  uk: {
    title: "Про нас",
    lead: "Logic Clothes — український авторський бренд жіночого одягу. Ми відрізняємося від схожих брендів тим, як мислимо, шиємо і спілкуємось з аудиторією.",
    sectionTitle: "Відмінні від схожих авторських брендів",
    points: [
      "Дуже багато кольору й принту.",
      "Немає «колекцій». Ідеї йдуть потоком: придумали — зшили.",
      "Продаємо стільки років, скільки люди це купують.",
      "Не прибираємо «несезонне» — аудиторія по всьому світу.",
      "Аудиторія = дуже продвинуті користувачі, які в умовну Zara навіть не ходять.",
      "Аудиторія швидка на сприйняття, обізнана, користується технологіями — люди в авангарді.",
      "Немає «бази».",
      "Одяг для крейзі людей, яким скучно все як у всіх.",
      "Це творчі професії: дуже відкриті світу хлопці й дівчата, що багато чого бачили — і все як у всіх їм нецікаве.",
      "Магазин і Instagram як лавка скарбів: купа всього, купа цікавинок. Важка для аудиторії Zara — і така й задумка.",
      "Кастомізуємо ідеї: ваш колір / ваш принт / ваш розмір.",
      "Необмежена розмірна сітка — буквально на будь-які параметри шиємо.",
      "Немає «надуманих сенсів», як у брендів для «нішевих» киян.",
    ],
    closingTitle: "Логіка роботи",
    closing: [
      "Усе робимо як для себе.",
      "Шиємо для себе. Речі самі носимо.",
      "Магазин побудували такий, яким хотіли б, щоб були інші магазини.",
      "Сайт створюємо таким, яким самим зручно користуватися.",
    ],
  },
  en: {
    title: "About us",
    lead: "Logic Clothes is a Ukrainian author womenswear brand. We differ from similar brands in how we think, sew, and talk to our audience.",
    sectionTitle: "Different from similar author brands",
    points: [
      "A lot of colour and print.",
      "No “collections”. Ideas come as a stream: we invent — we sew.",
      "We sell for as many years as people keep buying it.",
      "We don’t remove “off-season” pieces — the audience is worldwide.",
      "Audience = very advanced users who don’t even go to a typical Zara.",
      "A fast-perceiving, informed audience that uses technology — people at the avant-garde.",
      "No “basics”.",
      "Clothes for crazy people who are bored of everything looking the same.",
      "Creative professions: open-to-the-world people who have seen a lot — and “like everyone else” is not interesting to them.",
      "The store and Instagram feel like a treasure shop: piles of things, piles of curiosities. Heavy for a Zara audience — and that’s the point.",
      "We customise ideas: your colour / your print / your size.",
      "Unlimited size range — we literally sew for any parameters.",
      "No “invented meanings” like brands for “niche Kyivans”.",
    ],
    closingTitle: "How we work",
    closing: [
      "We do everything as if for ourselves.",
      "We sew for ourselves. We wear the pieces ourselves.",
      "We built the store the way we wish other stores were.",
      "We’re building the website the way we ourselves find convenient to use.",
    ],
  },
};
