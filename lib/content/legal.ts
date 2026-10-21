import type { Locale } from "@/lib/i18n/config";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_NAME,
  SITE_PHONE_DISPLAY,
} from "@/lib/siteContact";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalPage = {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const contactUk = `${SITE_NAME}, ${SITE_ADDRESS_LINES.join(", ")}. Тел.: ${SITE_PHONE_DISPLAY}. Email: ${SITE_EMAIL}.`;
const contactEn = `${SITE_NAME}, ${SITE_ADDRESS_LINES.join(", ")}. Phone: ${SITE_PHONE_DISPLAY}. Email: ${SITE_EMAIL}.`;

export const legalPages: Record<Locale, LegalPage[]> = {
  uk: [
    {
      slug: "privacy-policy",
      title: "Політика конфіденційності",
      updated: "Оновлено: жовтень 2026",
      intro:
        "Ця Політика пояснює, які персональні дані ми збираємо, навіщо їх використовуємо та які права маєте ви як користувач сайту Logic Clothes.",
      sections: [
        {
          heading: "1. Хто ми",
          paragraphs: [
            `Оператор сайту та даних: ${contactUk}`,
          ],
        },
        {
          heading: "2. Які дані ми можемо збирати",
          bullets: [
            "Ім’я, телефон, email — коли ви оформлюєте замовлення або пишете нам.",
            "Адреса доставки — для виконання замовлення.",
            "Технічні дані: IP, тип пристрою, браузер, сторінки перегляду (через cookies / аналітику).",
            "Дані кошика та вішлиста, збережені локально у вашому браузері.",
          ],
        },
        {
          heading: "3. Навіщо ми використовуємо дані",
          bullets: [
            "Оформлення та виконання замовлень, зв’язок щодо доставки й кастомізації.",
            "Відповіді на звернення та сервісна підтримка.",
            "Покращення сайту, аналітика відвідуваності.",
            "Виконання вимог законодавства України.",
          ],
        },
        {
          heading: "4. Передача третім сторонам",
          paragraphs: [
            "Ми можемо передавати дані службам доставки, платіжним провайдерам та технічним підрядникам лише в обсязі, потрібному для виконання замовлення або роботи сайту. Ми не продаємо ваші персональні дані.",
          ],
        },
        {
          heading: "5. Зберігання",
          paragraphs: [
            "Дані зберігаються стільки, скільки потрібно для виконання цілей обробки або вимог закону. Локальні дані кошика/вішлиста ви можете очистити самостійно в браузері.",
          ],
        },
        {
          heading: "6. Ваші права",
          bullets: [
            "Отримати інформацію про обробку ваших даних.",
            "Вимагати виправлення або видалення даних (якщо це не суперечить закону).",
            "Відкликати згоду на cookies / маркетинг (де застосовно).",
            "Звернутися до нас: " + SITE_EMAIL,
          ],
        },
      ],
    },
    {
      slug: "terms-of-service",
      title: "Публічна оферта",
      updated: "Оновлено: жовтень 2026",
      intro:
        "Цей документ є публічною офертою щодо купівлі товарів і послуг бренду Logic Clothes через сайт та concept store.",
      sections: [
        {
          heading: "1. Загальні положення",
          paragraphs: [
            `Продавець: ${contactUk}`,
            "Оформлюючи замовлення на сайті або в магазині, покупець підтверджує ознайомлення з умовами оферти.",
          ],
        },
        {
          heading: "2. Товар",
          bullets: [
            "Товари можуть бути лімітованими, кастомними або зшитим на параметри покупця.",
            "Зовнішній вигляд, колір і фактура можуть незначно відрізнятися від фото через екран і особливості тканини/принту.",
            "Оскільки немає «колекцій» у класичному сенсі, наявність позицій змінюється потоком виробництва.",
          ],
        },
        {
          heading: "3. Ціна та замовлення",
          paragraphs: [
            "Ціни вказані в гривнях, якщо не зазначено інше. Замовлення вважається прийнятим після підтвердження менеджером (телефон, email або месенджер).",
            "Для кастомних і індивідуальних замовлень терміни та вартість узгоджуються окремо.",
          ],
        },
        {
          heading: "4. Оплата",
          paragraphs: [
            "Можливі способи: банківський переказ / онлайн-оплата / оплата в магазині — за домовленістю. Деталі — на сторінці «Оплата і доставка».",
          ],
        },
        {
          heading: "5. Доставка і отримання",
          paragraphs: [
            "Доставка по Україні та за кордон здійснюється перевізниками, обраними разом із покупцем. Ризики випадкового пошкодження після передачі перевізнику регулюються правилами перевізника.",
          ],
        },
        {
          heading: "6. Індивідуальні замовлення",
          paragraphs: [
            "Речі, зшиті під ваш колір / принт / розмір, можуть не підлягати поверненню або обміну, окрім випадків виробничого браку — згідно із законодавством про захист прав споживачів.",
          ],
        },
      ],
    },
    {
      slug: "cookie-policy",
      title: "Політика cookies",
      updated: "Оновлено: жовтень 2026",
      intro:
        "Ми використовуємо cookies та схожі технології, щоб сайт працював стабільно і було зручніше ним користуватися.",
      sections: [
        {
          heading: "1. Що таке cookies",
          paragraphs: [
            "Cookies — це невеликі файли, які зберігаються у вашому браузері. Вони допомагають запам’ятовувати налаштування, аналізувати відвідуваність і покращувати сервіс.",
          ],
        },
        {
          heading: "2. Які cookies ми використовуємо",
          bullets: [
            "Необхідні — для базової роботи сайту, безпеки, збереження мови інтерфейсу.",
            "Функціональні — кошик / вішлист у localStorage вашого браузера.",
            "Аналітичні (за наявності) — анонімізована статистика відвідувань.",
          ],
        },
        {
          heading: "3. Керування",
          paragraphs: [
            "Ви можете обмежити або видалити cookies у налаштуваннях браузера. Частина функцій сайту (наприклад, збереження кошика) може працювати обмежено.",
          ],
        },
        {
          heading: "4. Контакти",
          paragraphs: [`Питання щодо cookies: ${SITE_EMAIL}`],
        },
      ],
    },
    {
      slug: "shipping-payment",
      title: "Оплата і доставка",
      updated: "Оновлено: жовтень 2026",
      intro:
        "Короткі правила оплати, доставки та самовивозу з concept store Logic Clothes у Києві.",
      sections: [
        {
          heading: "1. Оплата",
          bullets: [
            "Онлайн-оплата або банківський переказ — після підтвердження замовлення менеджером.",
            "Оплата в concept store (готівка / картка) — за наявності товару в магазині.",
            "Для кастомних замовлень можлива передоплата — узгоджується індивідуально.",
          ],
        },
        {
          heading: "2. Доставка по Україні",
          bullets: [
            "Нова Пошта / інші перевізники — за тарифами служби доставки.",
            "Термін відправки залежить від наявності: зі складу магазину або після пошиття.",
            "Вартість доставки оплачує покупець, якщо не домовлене інше.",
          ],
        },
        {
          heading: "3. Міжнародна доставка",
          paragraphs: [
            "Ми відправляємо замовлення за кордон. Маршрут, вартість і митні правила країни отримувача узгоджуються перед відправкою. Покупець відповідає за митні платежі у своїй країні (якщо застосовуються).",
          ],
        },
        {
          heading: "4. Самовивіз",
          paragraphs: [
            `Concept store: ${SITE_ADDRESS_LINES.join(", ")}. Перед візитом краще написати або зателефонувати: ${SITE_PHONE_DISPLAY}.`,
          ],
        },
        {
          heading: "5. Терміни пошиття",
          paragraphs: [
            "Оскільки ідеї йдуть потоком і багато речей кастомізуються, точні терміни повідомляє менеджер після уточнення розміру, кольору та принту.",
          ],
        },
      ],
    },
    {
      slug: "returns",
      title: "Повернення та обмін",
      updated: "Оновлено: жовтень 2026",
      intro:
        "Ми хочемо, щоб річ вам підійшла. Водночас частина асортименту — індивідуальна, тому умови повернення залежать від типу замовлення.",
      sections: [
        {
          heading: "1. Стандартні позиції з наявності",
          bullets: [
            "Обмін/повернення можливі протягом 14 днів з моменту отримання, якщо річ не носили, збережені бирки, товарний вигляд і комплектація.",
            "Вартість зворотної доставки зазвичай оплачує покупець, окрім випадків браку або помилки продавця.",
          ],
        },
        {
          heading: "2. Кастом і індивідуальний пошив",
          paragraphs: [
            "Речі під ваш колір / принт / розмір або зшиті «на параметри» зазвичай не підлягають поверненню чи обміну, крім виробничого браку.",
          ],
        },
        {
          heading: "3. Брак",
          paragraphs: [
            "Якщо виявили виробничий дефект — напишіть нам із фото на " +
              SITE_EMAIL +
              " протягом розумного строку після отримання. Ми запропонуємо ремонт, заміну або інше рішення.",
          ],
        },
        {
          heading: "4. Як оформити",
          bullets: [
            "Напишіть на " + SITE_EMAIL + " або зателефонуйте " + SITE_PHONE_DISPLAY + ".",
            "Вкажіть номер замовлення, причину та фото (за потреби).",
            "Дочекайтеся підтвердження менеджера перед відправкою посилки назад.",
          ],
        },
      ],
    },
    {
      slug: "contacts",
      title: "Контакти",
      updated: "Concept store · Київ",
      intro: "Будь-які питання щодо замовлення, кастому чи наявності — пишіть або заходьте в магазин.",
      sections: [
        {
          heading: "Concept store",
          paragraphs: [
            SITE_ADDRESS_LINES.join("\n"),
            `Телефон: ${SITE_PHONE_DISPLAY}`,
            `Email: ${SITE_EMAIL}`,
          ],
        },
        {
          heading: "Як ми відповідаємо",
          bullets: [
            "Замовлення та наявність — протягом робочого дня.",
            "Кастом (колір / принт / розмір) — після уточнення деталей менеджером.",
            "Instagram — як «лавка скарбів»: там теж багато новинок і цікавинок.",
          ],
        },
      ],
    },
  ],
  en: [
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      updated: "Updated: October 2026",
      intro:
        "This Policy explains what personal data we collect, why we use it, and what rights you have as a Logic Clothes website user.",
      sections: [
        {
          heading: "1. Who we are",
          paragraphs: [`Data controller: ${contactEn}`],
        },
        {
          heading: "2. Data we may collect",
          bullets: [
            "Name, phone, email — when you place an order or contact us.",
            "Delivery address — to fulfil the order.",
            "Technical data: IP, device, browser, pages viewed (via cookies / analytics).",
            "Cart and wishlist data stored locally in your browser.",
          ],
        },
        {
          heading: "3. Why we use data",
          bullets: [
            "Order processing, delivery and customisation communication.",
            "Support replies.",
            "Website improvement and traffic analytics.",
            "Compliance with applicable law.",
          ],
        },
        {
          heading: "4. Sharing with third parties",
          paragraphs: [
            "We may share data with delivery services, payment providers and technical contractors only as needed to fulfil orders or run the site. We do not sell your personal data.",
          ],
        },
        {
          heading: "5. Retention",
          paragraphs: [
            "We keep data as long as needed for processing purposes or legal requirements. You can clear local cart/wishlist data in your browser anytime.",
          ],
        },
        {
          heading: "6. Your rights",
          bullets: [
            "Request information about processing of your data.",
            "Ask for correction or deletion (where legally possible).",
            "Withdraw cookie / marketing consent where applicable.",
            "Contact us: " + SITE_EMAIL,
          ],
        },
      ],
    },
    {
      slug: "terms-of-service",
      title: "Public Offer / Terms",
      updated: "Updated: October 2026",
      intro:
        "This document is a public offer for buying Logic Clothes goods and services via the website and concept store.",
      sections: [
        {
          heading: "1. General",
          paragraphs: [
            `Seller: ${contactEn}`,
            "By placing an order online or in store, the buyer confirms they have read these terms.",
          ],
        },
        {
          heading: "2. Goods",
          bullets: [
            "Items may be limited, custom, or made to the buyer’s measurements.",
            "Colour and texture may slightly differ from photos due to screens and fabric/print specifics.",
            "Because there are no classic “collections”, availability changes with production flow.",
          ],
        },
        {
          heading: "3. Price and order",
          paragraphs: [
            "Prices are in UAH unless stated otherwise. An order is accepted after manager confirmation (phone, email or messenger).",
            "For custom / made-to-measure orders, timing and price are agreed separately.",
          ],
        },
        {
          heading: "4. Payment",
          paragraphs: [
            "Possible methods: bank transfer / online payment / in-store payment — by arrangement. See “Shipping & Payment”.",
          ],
        },
        {
          heading: "5. Delivery",
          paragraphs: [
            "Delivery in Ukraine and abroad is handled by carriers chosen with the buyer. Carrier rules apply after handover.",
          ],
        },
        {
          heading: "6. Custom orders",
          paragraphs: [
            "Items made in your colour / print / size may be non-returnable except for manufacturing defects, subject to consumer protection law.",
          ],
        },
      ],
    },
    {
      slug: "cookie-policy",
      title: "Cookie Policy",
      updated: "Updated: October 2026",
      intro:
        "We use cookies and similar technologies so the site works reliably and feels convenient.",
      sections: [
        {
          heading: "1. What cookies are",
          paragraphs: [
            "Cookies are small files stored in your browser. They help remember settings, analyse traffic and improve the service.",
          ],
        },
        {
          heading: "2. Cookies we use",
          bullets: [
            "Essential — basic site function, security, interface language.",
            "Functional — cart / wishlist in your browser localStorage.",
            "Analytics (if enabled) — anonymised visit statistics.",
          ],
        },
        {
          heading: "3. Control",
          paragraphs: [
            "You can limit or delete cookies in browser settings. Some features (like cart persistence) may then work with limits.",
          ],
        },
        {
          heading: "4. Contact",
          paragraphs: [`Cookie questions: ${SITE_EMAIL}`],
        },
      ],
    },
    {
      slug: "shipping-payment",
      title: "Shipping & Payment",
      updated: "Updated: October 2026",
      intro:
        "Payment, delivery and pickup rules for Logic Clothes concept store in Kyiv.",
      sections: [
        {
          heading: "1. Payment",
          bullets: [
            "Online payment or bank transfer — after manager confirmation.",
            "In-store payment (cash / card) — when the item is available in the store.",
            "Custom orders may require prepayment — agreed individually.",
          ],
        },
        {
          heading: "2. Delivery in Ukraine",
          bullets: [
            "Nova Poshta / other carriers — at carrier rates.",
            "Dispatch time depends on stock: from store or after sewing.",
            "Buyer pays delivery unless agreed otherwise.",
          ],
        },
        {
          heading: "3. International shipping",
          paragraphs: [
            "We ship abroad. Route, cost and customs rules are agreed before dispatch. The buyer is responsible for customs fees in their country if applicable.",
          ],
        },
        {
          heading: "4. Pickup",
          paragraphs: [
            `Concept store: ${SITE_ADDRESS_LINES.join(", ")}. Please message or call before visiting: ${SITE_PHONE_DISPLAY}.`,
          ],
        },
        {
          heading: "5. Production timing",
          paragraphs: [
            "Because ideas flow continuously and many pieces are customised, exact timing is confirmed by a manager after size, colour and print details.",
          ],
        },
      ],
    },
    {
      slug: "returns",
      title: "Returns & Exchanges",
      updated: "Updated: October 2026",
      intro:
        "We want the piece to work for you. Some items are individual, so return rules depend on order type.",
      sections: [
        {
          heading: "1. Standard in-stock items",
          bullets: [
            "Exchange/return within 14 days of receipt if unused, with tags and original condition.",
            "Return shipping is usually paid by the buyer, except defects or seller error.",
          ],
        },
        {
          heading: "2. Custom / made-to-measure",
          paragraphs: [
            "Items in your colour / print / size are usually non-returnable except manufacturing defects.",
          ],
        },
        {
          heading: "3. Defects",
          paragraphs: [
            "If you find a manufacturing defect — email photos to " +
              SITE_EMAIL +
              " within a reasonable time after receipt. We will offer repair, replacement or another solution.",
          ],
        },
        {
          heading: "4. How to request",
          bullets: [
            "Email " + SITE_EMAIL + " or call " + SITE_PHONE_DISPLAY + ".",
            "Include order details, reason and photos if needed.",
            "Wait for manager confirmation before sending a parcel back.",
          ],
        },
      ],
    },
    {
      slug: "contacts",
      title: "Contacts",
      updated: "Concept store · Kyiv",
      intro: "Questions about orders, custom pieces or availability — write or visit the store.",
      sections: [
        {
          heading: "Concept store",
          paragraphs: [
            SITE_ADDRESS_LINES.join("\n"),
            `Phone: ${SITE_PHONE_DISPLAY}`,
            `Email: ${SITE_EMAIL}`,
          ],
        },
        {
          heading: "Response timing",
          bullets: [
            "Orders and availability — within a business day.",
            "Custom (colour / print / size) — after manager clarifies details.",
            "Instagram is also a “treasure shop” with many finds.",
          ],
        },
      ],
    },
  ],
};

export function getLegalPage(
  lang: Locale,
  slug: string
): LegalPage | undefined {
  return legalPages[lang].find((p) => p.slug === slug);
}

export function getLegalSlugs(): string[] {
  return legalPages.uk.map((p) => p.slug);
}
