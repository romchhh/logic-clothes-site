import type { Locale } from "@/lib/i18n/config";

export type Messages = {
  nav: {
    catalog: string;
    collections: string;
    concept: string;
    about: string;
    new: string;
    stores: string;
    menu: string;
  };
  home: {
    cta: string;
    eyebrow: string;
    lead: string;
    since: string;
    categories: string;
    categoriesScrollHint: string;
    featured: string;
    newcomers: string;
    sale: string;
    seeAll: string;
    aboutTitle: string;
    aboutText: string;
    aboutReadMore: string;
  };
  catalog: {
    title: string;
    count: (n: number) => string;
    sort: string;
    filter: string;
    filters: string;
    empty: string;
    category: string;
    sortNewest: string;
    sortAsc: string;
    sortDesc: string;
    size: string;
    color: string;
    price: string;
    minPrice: string;
    maxPrice: string;
    reset: string;
    showMore: string;
  };
  product: {
    home: string;
    catalog: string;
    inStock: string;
    outOfStock: string;
    preorder: string;
    size: string;
    sizeGuide: string;
    sizeCustom: string;
    length: string;
    materialVariant: string;
    pickLength: string;
    pickMaterial: string;
    color: string;
    sewForYou: string;
    checkStores: string;
    addToCart: string;
    cardAdd: string;
    addWish: string;
    inWish: string;
    description: string;
    fabric: string;
    related: string;
    lookTitle: string;
    pickSize: string;
    model: string;
    modelOnPhoto: string;
    sizeChartTitle: string;
    sizeChartSubtitle: string;
    sizeChartAlso: string;
    sizeChartCustom: string;
    sizeCol: string;
    bust: string;
    waist: string;
    hips: string;
    deliveryTitle: string;
    deliveryText: string[];
    paymentTitle: string;
    paymentText: string[];
  };
  basket: {
    title: string;
    empty: string;
    total: string;
    checkout: string;
    thanks: string;
    remove: string;
    size: string;
  };
  checkout: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyCta: string;
    contact: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    email: string;
    emailOptional: string;
    delivery: string;
    deliveryMethod: string;
    city: string;
    cityPlaceholder: string;
    cityLoading: string;
    warehouse: string;
    warehousePlaceholder: string;
    warehouseLoading: string;
    courierAddress: string;
    courierAddressPlaceholder: string;
    address: string;
    addressHint: string;
    comment: string;
    commentPlaceholder: string;
    orderSummary: string;
    summaryPositions: string;
    managerNote: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successText: string;
    successOrderId: string;
    successDetails: string;
    successFollowUp: string;
    successCta: string;
    backToShop: string;
    alsoLike: string;
    methods: {
      nova_poshta_branch: string;
      nova_poshta_locker: string;
      nova_poshta_courier: string;
      pickup: string;
      international: string;
    };
    errors: {
      name: string;
      phone: string;
      city: string;
      address: string;
      empty: string;
      generic: string;
      np: string;
    };
  };
  wish: {
    title: string;
    lead: string;
    empty: string;
    emptyCta: string;
    toCart: string;
    remove: string;
  };
  search: {
    title: string;
    placeholder: string;
    empty: string;
    close: string;
  };
  footer: {
    brand: string;
    slogan: string;
    sloganAccent: string;
    newsletterLabel: string;
    newsletterPlaceholder: string;
    region: string;
    address: string;
    contacts: string;
    clients: string;
    howToBuy: string;
    cart: string;
    order: string;
    legal: string;
    privacy: string;
    offer: string;
    cookies: string;
    shipping: string;
    returns: string;
    contactsPage: string;
    payment: string;
    about: string;
    instagram: string;
    developedBy: string;
    developedByBrand: string;
  };
  a11y: {
    search: string;
    account: string;
    wishlist: string;
    cart: string;
    menu: string;
    close: string;
    chat: string;
    wishAdd: string;
    prevPhoto: string;
    nextPhoto: string;
  };
  notFound: {
    code: string;
    title: string;
    lead: string;
    home: string;
    catalog: string;
  };
};

const uk: Messages = {
  nav: {
    catalog: "Каталог",
    collections: "Колекції",
    concept: "Concept store",
    about: "Про бренд",
    new: "Новинки",
    stores: "Магазини",
    menu: "Меню",
  },
  home: {
    cta: "Каталог",
    eyebrow: "Український бренд · з 2015",
    lead: "Простота, логіка, жіночність і натуральні тканини. Обмежені тиражі — кожна річ зшита в Україні з увагою до деталей.",
    since: "З 2015",
    categories: "Популярні категорії",
    categoriesScrollHint: "Прокрутіть, щоб побачити більше категорій",
    featured: "Популярне",
    newcomers: "Новинки",
    sale: "Sale",
    seeAll: "Усі",
    aboutTitle: "Український бренд одягу Logic Clothes",
    aboutText:
      "Уявіть гардероб, де кожна річ про вас, незалежно від сезону, трендів чи настрою. З цієї концепції народжується український дизайнерський одяг Logic Clothes. Колекції, натхненні жінками, простотою крою, натуральними тканинами й обмеженими тиражами — кожна річ зшита в Україні з увагою до деталей.",
    aboutReadMore: "Читати далі",
  },
  catalog: {
    title: "Каталог",
    count: (n: number) => `Показано ${n} моделей`,
    sort: "Сортувати",
    filter: "Фільтр",
    filters: "Фільтри",
    empty: "Товарів не знайдено",
    category: "Категорія",
    sortNewest: "За пріоритетом",
    sortAsc: "Ціна: від низької",
    sortDesc: "Ціна: від високої",
    size: "Розмір",
    color: "Колір",
    price: "Ціна",
    minPrice: "Від",
    maxPrice: "До",
    reset: "Скинути",
    showMore: "Показати ще",
  },
  product: {
    home: "Головна",
    catalog: "Каталог",
    inStock: "В наявності",
    outOfStock: "Немає в наявності",
    preorder: "Під замовлення",
    size: "Розмір",
    sizeGuide: "Розмірна сітка",
    sizeCustom: "По мірках",
    length: "Довжина",
    materialVariant: "Матеріал",
    pickLength: "Оберіть довжину",
    pickMaterial: "Оберіть матеріал",
    color: "Колір",
    sewForYou: "Зшиємо для вас",
    checkStores: "Перевірити наявність в офлайн магазинах",
    addToCart: "Додати до кошика",
    cardAdd: "До кошика",
    addWish: "Додати у вішлист",
    inWish: "У вішлисті",
    description: "Опис",
    fabric: "Склад",
    related: "Ще з колекції",
    lookTitle: "Також у цьому луці",
    pickSize: "Оберіть розмір",
    model: "Модель:",
    modelOnPhoto:
      "На фото розмір S–M. Параметри моделі: зріст 175 см, груди 86, талія 64, стегна 92.",
    sizeChartTitle: "Розмірна сітка",
    sizeChartSubtitle: "здорової людини",
    sizeChartAlso: "А також",
    sizeChartCustom: "по мірках",
    sizeCol: "Розмір",
    bust: "Груди",
    waist: "Талія",
    hips: "Стегна",
    deliveryTitle: "Доставка",
    deliveryText: [
      "Нова Пошта / інші перевізники — за тарифами служби.",
      "Самовивіз з concept store: Київ, вул. Софіївська, 5.",
      "Міжнародна доставка — узгоджується перед відправкою.",
    ],
    paymentTitle: "Оплата",
    paymentText: [
      "Онлайн-оплата або банківський переказ — після підтвердження менеджером.",
      "Оплата в concept store (готівка / картка).",
      "Для кастомних замовлень можлива передоплата.",
    ],
  },
  basket: {
    title: "Кошик",
    empty: "Кошик порожній",
    total: "Разом",
    checkout: "Оформити замовлення",
    thanks: "Дякуємо! Замовлення надіслано — менеджер зв’яжеться з вами.",
    remove: "Видалити",
    size: "Розмір",
  },
  checkout: {
    title: "Оформлення замовлення",
    subtitle: "Залиште контакти та зручний спосіб отримання — менеджер підтвердить деталі.",
    emptyTitle: "У кошику поки порожньо",
    emptyCta: "До каталогу",
    contact: "Контакти",
    name: "Ім’я та прізвище",
    namePlaceholder: "Анна Коваленко",
    phone: "Телефон",
    email: "Email",
    emailOptional: "не обов’язково",
    delivery: "Доставка",
    deliveryMethod: "Спосіб отримання",
    city: "Місто",
    cityPlaceholder: "Почніть вводити місто…",
    cityLoading: "Шукаємо міста…",
    warehouse: "Відділення / поштомат",
    warehousePlaceholder: "Оберіть зі списку…",
    warehouseLoading: "Шукаємо відділення…",
    courierAddress: "Адреса доставки",
    courierAddressPlaceholder: "Вулиця, будинок, квартира",
    address: "Відділення / адреса",
    addressHint: "Оберіть місто зі списку Нової Пошти, потім відділення",
    comment: "Коментар",
    commentPlaceholder: "Колір / принт / кастом — якщо потрібно",
    orderSummary: "Ваше замовлення",
    summaryPositions: "поз.",
    managerNote: "Менеджер зв’яжеться з вами для підтвердження перед відправкою.",
    submit: "Підтвердити замовлення",
    submitting: "Надсилаємо…",
    successTitle: "Замовлення прийнято",
    successText:
      "Дякуємо! Ми отримали ваше замовлення — нижче всі деталі для перевірки.",
    successOrderId: "Номер замовлення",
    successDetails: "Деталі замовлення",
    successFollowUp:
      "Наш менеджер зв’яжеться з вами найближчим часом за вказаним телефоном, щоб підтвердити замовлення та узгодити оплату й доставку.",
    successCta: "На головну",
    backToShop: "Продовжити покупки",
    alsoLike: "Вам може сподобатися",
    methods: {
      nova_poshta_branch: "Нова Пошта · відділення",
      nova_poshta_locker: "Нова Пошта · поштомат",
      nova_poshta_courier: "Нова Пошта · кур’єр",
      pickup: "Самовивіз · Софіївська, 5",
      international: "Міжнародна доставка",
    },
    errors: {
      name: "Вкажіть ім’я та прізвище",
      phone: "Вкажіть коректний телефон",
      city: "Оберіть місто зі списку",
      address: "Оберіть відділення або вкажіть адресу",
      empty: "Кошик порожній",
      generic: "Не вдалося надіслати замовлення. Спробуйте ще раз або зателефонуйте нам.",
      np: "Не вдалося завантажити дані Нової Пошти. Перевірте ключ API або введіть адресу вручну.",
    },
  },
  wish: {
    title: "Вішлист",
    lead: "Збережені речі — повертайтесь, коли будете готові.",
    empty: "Вішлист порожній",
    emptyCta: "До каталогу",
    toCart: "У кошик",
    remove: "Прибрати",
  },
  search: {
    title: "Пошук",
    placeholder: "Назва або артикул…",
    empty: "Нічого не знайдено",
    close: "Закрити",
  },
  footer: {
    brand:
      "Concept store у Києві. Авторський жіночий одяг — невеликі тиражі, рідкі принти, логіка крою.",
    slogan:
      "Ми не стежимо за трендами. Ми не виробляємо речі, які роками безцільно висітимуть у шафах. Ми виробляємо тільки те, що дійсно",
    sloganAccent: "LOGIC",
    newsletterLabel: "Приєднуйся до Logic Clothes",
    newsletterPlaceholder: "E-mail",
    region: "Україна | Українська",
    address: "Адреса",
    contacts: "Контакти",
    clients: "Клієнтам",
    howToBuy: "Як купити",
    cart: "Корзина",
    order: "Оформити замовлення",
    legal: "Документи",
    privacy: "Політика конфіденційності",
    offer: "Публічна оферта",
    cookies: "Cookies",
    shipping: "Доставка",
    returns: "Повернення та обмін",
    contactsPage: "Контакти",
    payment: "Оплата",
    about: "Про нас",
    instagram: "Instagram",
    developedBy: "Сайт розроблений",
    developedByBrand: "Telebots",
  },
  a11y: {
    search: "Пошук",
    account: "Акаунт",
    wishlist: "Вішлист",
    cart: "Кошик",
    menu: "Меню",
    close: "Закрити",
    chat: "Чат",
    wishAdd: "У вішлист",
    prevPhoto: "Попереднє фото",
    nextPhoto: "Наступне фото",
  },
  notFound: {
    code: "404",
    title: "Цю сторінку не знайдено",
    lead: "Можливо, посилання застаріло або сторінку перемістили. Оберіть каталог або поверніться на головну.",
    home: "На головну",
    catalog: "До каталогу",
  },
};

const en: Messages = {
  nav: {
    catalog: "Catalog",
    collections: "Collections",
    concept: "Concept store",
    about: "About",
    new: "New in",
    stores: "Stores",
    menu: "Menu",
  },
  home: {
    cta: "Shop",
    eyebrow: "Ukrainian brand · since 2015",
    lead: "Simplicity, logic, femininity and natural fabrics. Limited runs — each piece is made in Ukraine with care for detail.",
    since: "Since 2015",
    categories: "Popular categories",
    categoriesScrollHint: "Scroll to see more categories",
    featured: "Popular",
    newcomers: "New",
    sale: "Sale",
    seeAll: "See all",
    aboutTitle: "Ukrainian clothing brand Logic Clothes",
    aboutText:
      "Imagine a wardrobe where every piece is about you — beyond season, trends or mood. From this idea comes Ukrainian designer wear Logic Clothes. Collections inspired by women, clean cuts, natural fabrics and limited runs — each piece made in Ukraine with care for detail.",
    aboutReadMore: "Read more",
  },
  catalog: {
    title: "Catalog",
    count: (n: number) => `Showing ${n} styles`,
    sort: "Sort",
    filter: "Filter",
    filters: "Filters",
    empty: "No products found",
    category: "Category",
    sortNewest: "By priority",
    sortAsc: "Price: low to high",
    sortDesc: "Price: high to low",
    size: "Size",
    color: "Color",
    price: "Price",
    minPrice: "From",
    maxPrice: "To",
    reset: "Reset",
    showMore: "Show more",
  },
  product: {
    home: "Home",
    catalog: "Catalog",
    inStock: "In stock",
    outOfStock: "Out of stock",
    preorder: "Made to order",
    size: "Size",
    sizeGuide: "Size chart",
    sizeCustom: "By measurements",
    length: "Length",
    materialVariant: "Material",
    pickLength: "Please select a length",
    pickMaterial: "Please select a material",
    color: "Color",
    sewForYou: "We’ll sew it for you",
    checkStores: "Check availability in offline stores",
    addToCart: "Add to bag",
    cardAdd: "Add to bag",
    addWish: "Add to wishlist",
    inWish: "In wishlist",
    description: "Description",
    fabric: "Composition",
    related: "More from the collection",
    lookTitle: "Also in this look",
    pickSize: "Please select a size",
    model: "Style:",
    modelOnPhoto:
      "Size on photo: S–M. Model specs: height 175 cm, bust 86, waist 64, hips 92.",
    sizeChartTitle: "Size chart",
    sizeChartSubtitle: "for a healthy body",
    sizeChartAlso: "And also",
    sizeChartCustom: "by measurements",
    sizeCol: "Size",
    bust: "Bust",
    waist: "Waist",
    hips: "Hips",
    deliveryTitle: "Delivery",
    deliveryText: [
      "Nova Poshta / other carriers — at carrier rates.",
      "Pickup at concept store: Kyiv, Sofiivska 5.",
      "International shipping — confirmed before dispatch.",
    ],
    paymentTitle: "Payment",
    paymentText: [
      "Online payment or bank transfer — after manager confirmation.",
      "In-store payment (cash / card).",
      "Custom orders may require prepayment.",
    ],
  },
  basket: {
    title: "Bag",
    empty: "Your bag is empty",
    total: "Total",
    checkout: "Checkout",
    thanks: "Thank you! Your order was sent — a manager will contact you.",
    remove: "Remove",
    size: "Size",
  },
  checkout: {
    title: "Checkout",
    subtitle:
      "Leave your contacts and preferred delivery — a manager will confirm the details.",
    emptyTitle: "Your bag is empty",
    emptyCta: "Go to catalog",
    contact: "Contacts",
    name: "Full name",
    namePlaceholder: "Anna Kovalenko",
    phone: "Phone",
    email: "Email",
    emailOptional: "optional",
    delivery: "Delivery",
    deliveryMethod: "Delivery method",
    city: "City",
    cityPlaceholder: "Start typing a city…",
    cityLoading: "Searching cities…",
    warehouse: "Branch / locker",
    warehousePlaceholder: "Pick from the list…",
    warehouseLoading: "Searching warehouses…",
    courierAddress: "Delivery address",
    courierAddressPlaceholder: "Street, building, apartment",
    address: "Branch / address",
    addressHint: "Pick a Nova Poshta city, then a warehouse",
    comment: "Comment",
    commentPlaceholder: "Colour / print / custom — if needed",
    orderSummary: "Your order",
    summaryPositions: "items",
    managerNote: "Our team will contact you to confirm before shipping.",
    submit: "Place order",
    submitting: "Sending…",
    successTitle: "Order received",
    successText:
      "Thank you! We’ve received your order — review the details below.",
    successOrderId: "Order number",
    successDetails: "Order details",
    successFollowUp:
      "Our manager will call you shortly at the phone number below to confirm your order and arrange payment and delivery.",
    successCta: "Back home",
    backToShop: "Continue shopping",
    alsoLike: "You may also like",
    methods: {
      nova_poshta_branch: "Nova Poshta · branch",
      nova_poshta_locker: "Nova Poshta · locker",
      nova_poshta_courier: "Nova Poshta · courier",
      pickup: "Pickup · Sofiivska 5",
      international: "International shipping",
    },
    errors: {
      name: "Enter your full name",
      phone: "Enter a valid phone number",
      city: "Pick a city from the list",
      address: "Pick a warehouse or enter an address",
      empty: "Bag is empty",
      generic: "Could not send the order. Try again or call us.",
      np: "Could not load Nova Poshta data. Check the API key or enter the address manually.",
    },
  },
  wish: {
    title: "Wishlist",
    lead: "Saved pieces — come back when you’re ready.",
    empty: "Wishlist is empty",
    emptyCta: "Go to catalog",
    toCart: "Add to bag",
    remove: "Remove",
  },
  search: {
    title: "Search",
    placeholder: "Name or SKU…",
    empty: "Nothing found",
    close: "Close",
  },
  footer: {
    brand:
      "Concept store in Kyiv. Author womenswear — small runs, rare prints, logical cuts.",
    slogan:
      "We do not follow trends. We do not make pieces that hang unused for years. We make only what is truly",
    sloganAccent: "LOGIC",
    newsletterLabel: "Join Logic Clothes",
    newsletterPlaceholder: "E-mail",
    region: "Ukraine | English",
    address: "Address",
    contacts: "Contacts",
    clients: "Clients",
    howToBuy: "How to buy",
    cart: "Bag",
    order: "Place an order",
    legal: "Legal",
    privacy: "Privacy Policy",
    offer: "Public Offer",
    cookies: "Cookies",
    shipping: "Delivery",
    returns: "Returns & Exchanges",
    contactsPage: "Contacts",
    payment: "Payment",
    about: "About us",
    instagram: "Instagram",
    developedBy: "Site developed by",
    developedByBrand: "Telebots",
  },
  a11y: {
    search: "Search",
    account: "Account",
    wishlist: "Wishlist",
    cart: "Bag",
    menu: "Menu",
    close: "Close",
    chat: "Chat",
    wishAdd: "Wishlist",
    prevPhoto: "Previous photo",
    nextPhoto: "Next photo",
  },
  notFound: {
    code: "404",
    title: "This page could not be found",
    lead: "The link may be outdated or the page has moved. Browse the catalog or head back home.",
    home: "Back home",
    catalog: "Shop catalog",
  },
};

export const messages: Record<Locale, Messages> = { uk, en };

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.uk;
}
