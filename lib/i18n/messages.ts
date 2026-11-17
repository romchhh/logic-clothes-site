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
    whoWeAre: string;
    custom14: string;
    shippingWorld: string;
    storeKyiv: string;
    contacts: string;
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
    sortAdded: string;
    sortAddedNew: string;
    sortAddedOld: string;
    size: string;
    color: string;
    price: string;
    season: string;
    seasonWarm: string;
    seasonCold: string;
    seasonAll: string;
    minPrice: string;
    maxPrice: string;
    reset: string;
  };
  product: {
    home: string;
    catalog: string;
    inStock: string;
    outOfStock: string;
    preorder: string;
    availability: string;
    sewIn14Days: string;
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
    sewMyColor: string;
    sewMySize: string;
    orderMySize: string;
    orderMyColorSize: string;
    orderSew: string;
    orderByMeasures: string;
    openSizeChart: string;
    closeSizeChart: string;
    care: string;
    closeCare: string;
    shippingPayment: string;
    closeShippingPayment: string;
    shipUa: string;
    shipAbroad: string;
    shipStore: string;
    shipStoreAddress: string;
    payMethods: string;
    payMethodsText: string;
    returnsLabel: string;
    returnsLink: string;
    storePhotosTitle: string;
    actualMeasures: string;
    fabricKind: string;
    fabricComposition: string;
    fabricMaterialLabel: string;
    lining: string;
    liningComposition: string;
    liningLabel: string;
    insulation: string;
    photoSizeLabel: string;
    modelParamsLabel: string;
    inWish: string;
    description: string;
    fabric: string;
    related: string;
    lookTitle: string;
    pickSize: string;
    inStockSizesLabel: string;
    madeToOrderSizesLabel: string;
    sizeTooltipInStock: string;
    sizeTooltipMadeToOrder: string;
    customOrderTitle: string;
    customOrderLead: string;
    customOrderCta: string;
    customOrderSelected: string;
    discussChoose: string;
    discussInstagram: string;
    discussMessenger: string;
    discussMessageLabel: string;
    discussSend: string;
    discussCopied: string;
    discussCopyManual: string;
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
    otherRecipient: string;
    otherRecipientName: string;
    otherRecipientPhone: string;
    phone: string;
    email: string;
    emailOptional: string;
    youChose: string;
    paymentStore: string;
    paymentStoreHint: string;
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
    payment: string;
    paymentMethod: string;
    paymentHint: string;
    paymentTypes: {
      full: string;
      prepay: string;
      pay_after: string;
    };
    paymentHints: {
      full: string;
      prepay: string;
      pay_after: string;
    };
    methodHints: {
      nova_poshta_branch: string;
      nova_poshta_locker: string;
      nova_poshta_courier: string;
      pickup: string;
      international: string;
    };
    payNow: string;
    amountDue: string;
    bagToggle: string;
    commentOptional: string;
    orderSummary: string;
    summaryPositions: string;
    managerNote: string;
    submit: string;
    submitting: string;
    redirectingPay: string;
    successTitle: string;
    successText: string;
    successPaidText: string;
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
      payment: string;
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
    stores: "Магазин",
    menu: "Меню",
    whoWeAre: "Хто ми",
    custom14: "Ваш колір + ваш розмір за 14 днів",
    shippingWorld: "Оплата і доставка 🌍",
    storeKyiv: "Магазин у Києві",
    contacts: "Контакти",
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
    seeAll: "Дивитись все",
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
    sortAdded: "Додано",
    sortAddedNew: "Спочатку нові",
    sortAddedOld: "Спочатку старі",
    size: "Розмір",
    color: "Колір",
    price: "Ціна",
    season: "Сезонність",
    seasonWarm: "Для теплої пори року",
    seasonCold: "Для холодної пори року",
    seasonAll: "Дивитись усі",
    minPrice: "Від",
    maxPrice: "До",
    reset: "Скинути",
  },
  product: {
    home: "Головна",
    catalog: "Каталог",
    inStock: "В наявності",
    outOfStock: "Немає в наявності",
    preorder: "Під замовлення",
    availability: "Наявність",
    sewIn14Days: "Зшиємо за 14 днів",
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
    addToCart: "Замовити",
    cardAdd: "До кошика",
    addWish: "Додати в wishlist",
    sewMyColor: "Хочу пошити в своєму кольорі",
    sewMySize: "Хочу пошити в своєму розмірі",
    orderMySize: "Хочу пошити в своєму розмірі",
    orderMyColorSize: "Пошити за моїми забаганками",
    orderSew: "Замовити пошиття",
    orderByMeasures: "Хочу замовити по своїх мірках",
    openSizeChart: "Розмірна сітка",
    closeSizeChart: "Згорнути",
    care: "Догляд",
    closeCare: "Згорнути",
    shippingPayment: "Оплата і доставка",
    closeShippingPayment: "Згорнути",
    shipUa: "Доставка по Україні",
    shipAbroad: "Доставка закордон",
    shipStore: "Забрати в магазині",
    shipStoreAddress: "Київ, вул. Софіївська 5",
    payMethods: "Оплата",
    payMethodsText: "онлайн карткою, накладений платіж, готівкою в магазині",
    returnsLabel: "Повернення",
    returnsLink: "Умови обміну і повернення",
    storePhotosTitle: "Наш магазин у Києві",
    actualMeasures: "Фактичні заміри виробу",
    fabricKind: "Основна тканина",
    fabricComposition: "Склад основної тканини",
    fabricMaterialLabel: "Матеріал",
    lining: "Підклад",
    liningComposition: "Склад підкладки",
    liningLabel: "Підкладка",
    insulation: "Утеплювач",
    photoSizeLabel: "На фото розмір",
    modelParamsLabel: "Параметри моделі на фото",
    inWish: "У вішлисті",
    description: "Опис",
    fabric: "Склад",
    related: "Ще з колекції",
    lookTitle: "Також у цьому луці",
    pickSize: "Оберіть розмір",
    inStockSizesLabel: "В наявності:",
    madeToOrderSizesLabel: "За 14 днів зшиємо",
    sizeTooltipInStock: "В наявності",
    sizeTooltipMadeToOrder: "Зшиємо за 14 днів",
    customOrderTitle: "Конструктор власного замовлення",
    customOrderLead:
      "Оберіть загальну гаму. Можливі відтінки відправимо вам на вибір та затвердження.",
    customOrderCta: "Обговорити замовлення з живою людиною",
    customOrderSelected: "Обрані палітри",
    discussChoose: "Куди надіслати повідомлення?",
    discussInstagram: "Instagram Direct",
    discussMessenger: "Месенджер (Viber менеджера)",
    discussMessageLabel: "Ваш текст",
    discussSend: "Надіслати",
    discussCopied:
      "Текст скопійовано — вставте його в Direct, якщо поле порожнє.",
    discussCopyManual:
      "Скопіюйте текст нижче та вставте в Instagram Direct.",
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
      "Повна оплата онлайн через WayForPay.",
      "Передоплата 200 ₴ онлайн — решта при отриманні.",
      "Післяплата при отриманні замовлення.",
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
    title: "давайте оформимо",
    subtitle: "Контакти, доставка й оплата — кілька хвилин.",
    emptyTitle: "У кошику поки порожньо",
    emptyCta: "До каталогу",
    contact: "Контакти",
    name: "Ім’я та прізвище",
    namePlaceholder: "Анна Коваленко",
    otherRecipient: "вказати іншого отримувача",
    otherRecipientName: "Ім’я отримувача",
    otherRecipientPhone: "Телефон отримувача",
    phone: "Телефон",
    email: "Email",
    emailOptional: "не обов’язково",
    youChose: "ви обрали:",
    paymentStore: "сплачу в магазині",
    paymentStoreHint: "картка/готівка",
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
    addressHint: "Спочатку місто зі списку, потім відділення",
    comment: "Коментар",
    commentPlaceholder: "",
    commentOptional: "за бажанням",
    payment: "Оплата",
    paymentMethod: "Спосіб оплати",
    paymentHint: "Картка — через WayForPay. Накладений платіж — з передоплатою 200 грн.",
    paymentTypes: {
      full: "Повна оплата",
      prepay: "оплата накладеним платежем",
      pay_after: "сплачу в магазині",
    },
    paymentHints: {
      full: "карткою онлайн",
      prepay: "(предоплата 200 грн)",
      pay_after: "картка/готівка",
    },
    methodHints: {
      nova_poshta_branch: "Класичне відділення",
      nova_poshta_locker: "Поштомат 24/7",
      nova_poshta_courier: "До дверей",
      pickup: "Київ, Софіївська 5",
      international: "За кордон",
    },
    payNow: "Оплатити",
    amountDue: "До сплати зараз",
    bagToggle: "ви обрали:",
    orderSummary: "Ваше замовлення",
    summaryPositions: "поз.",
    managerNote: "Після оформлення менеджер підтвердить деталі.",
    submit: "Підтвердити замовлення",
    submitting: "Надсилаємо…",
    redirectingPay: "Переходимо до оплати…",
    successTitle: "Замовлення прийнято",
    successText:
      "Дякуємо! Ми отримали ваше замовлення — нижче всі деталі для перевірки.",
    successPaidText:
      "Дякуємо! Оплату прийнято. Замовлення вже в роботі — деталі нижче.",
    successOrderId: "Номер замовлення",
    successDetails: "Деталі замовлення",
    successFollowUp:
      "Наш менеджер зв’яжеться з вами найближчим часом за вказаним телефоном, щоб підтвердити доставку.",
    successCta: "На головну",
    backToShop: "Продовжити покупки",
    alsoLike: "Вам може сподобатися",
    methods: {
      nova_poshta_branch: "Нова Пошта · відділення",
      nova_poshta_locker: "Нова Пошта · поштомат",
      nova_poshta_courier: "Нова Пошта · кур’єр",
      pickup: "забрати в магазині. Київ софіївська 5",
      international: "Міжнародна доставка",
    },
    errors: {
      name: "Вкажіть ім’я та прізвище",
      phone: "Вкажіть коректний телефон",
      city: "Оберіть місто зі списку",
      address: "Оберіть відділення або вкажіть адресу",
      payment: "Оберіть спосіб оплати",
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
    placeholder: "",
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
    region: "українська",
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
    shipping: "Оплата і доставка",
    returns: "Повернення та обмін",
    contactsPage: "Контакти",
    payment: "Оплата і доставка",
    about: "Про нас",
    instagram: "_logic_clothes",
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
    stores: "Store",
    menu: "Menu",
    whoWeAre: "Who we are",
    custom14: "Your colour + your size in 14 days",
    shippingWorld: "Payment & delivery 🌍",
    storeKyiv: "Store in Kyiv",
    contacts: "Contacts",
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
    sortAdded: "Added",
    sortAddedNew: "Newest first",
    sortAddedOld: "Oldest first",
    size: "Size",
    color: "Color",
    price: "Price",
    season: "Season",
    seasonWarm: "For warm weather",
    seasonCold: "For cold weather",
    seasonAll: "View all",
    minPrice: "From",
    maxPrice: "To",
    reset: "Reset",
  },
  product: {
    home: "Home",
    catalog: "Catalog",
    inStock: "In stock",
    outOfStock: "Out of stock",
    preorder: "Made to order",
    availability: "Availability",
    sewIn14Days: "Sewn in 14 days",
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
    addToCart: "Order",
    cardAdd: "Add to bag",
    addWish: "Add to wishlist",
    sewMyColor: "I want it sewn in my colour",
    sewMySize: "I want it sewn in my size",
    orderMySize: "I want it sewn in my size",
    orderMyColorSize: "Sew it my way",
    orderSew: "Order a custom sew",
    orderByMeasures: "I want it made to my measurements",
    openSizeChart: "Size chart",
    closeSizeChart: "Collapse",
    care: "Care",
    closeCare: "Collapse",
    shippingPayment: "Payment & delivery",
    closeShippingPayment: "Collapse",
    shipUa: "Delivery in Ukraine",
    shipAbroad: "International delivery",
    shipStore: "Pick up in store",
    shipStoreAddress: "Kyiv, Sofiivska 5",
    payMethods: "Payment",
    payMethodsText: "online card, cash on delivery, cash in store",
    returnsLabel: "Returns",
    returnsLink: "Exchange & returns policy",
    storePhotosTitle: "Our store in Kyiv",
    actualMeasures: "Actual garment measurements",
    fabricKind: "Main fabric",
    fabricComposition: "Main fabric composition",
    fabricMaterialLabel: "Material",
    lining: "Lining",
    liningComposition: "Lining composition",
    liningLabel: "Lining",
    insulation: "Insulation",
    photoSizeLabel: "Size on photo",
    modelParamsLabel: "Model on photo",
    inWish: "In wishlist",
    description: "Description",
    fabric: "Composition",
    related: "More from the collection",
    lookTitle: "Also in this look",
    pickSize: "Please select a size",
    inStockSizesLabel: "In stock:",
    madeToOrderSizesLabel: "Made in 14 days",
    sizeTooltipInStock: "In stock",
    sizeTooltipMadeToOrder: "Made to order in 14 days",
    customOrderTitle: "Build your custom order",
    customOrderLead:
      "Choose a colour family. We’ll send possible shades for you to pick and approve.",
    customOrderCta: "Discuss your order with a real person",
    customOrderSelected: "Selected palettes",
    discussChoose: "Where should we receive your message?",
    discussInstagram: "Instagram Direct",
    discussMessenger: "Viber (order manager)",
    discussMessageLabel: "Your message",
    discussSend: "Send",
    discussCopied:
      "Message copied — paste it into Direct if the field is empty.",
    discussCopyManual: "Copy the text below and paste it into Instagram Direct.",
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
      "Pay in full online via WayForPay.",
      "200 UAH prepayment online — balance on delivery.",
      "Cash on delivery.",
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
    title: "let's check out",
    subtitle: "Contacts, delivery and payment — a few minutes.",
    emptyTitle: "Your bag is empty",
    emptyCta: "Go to catalog",
    contact: "Contacts",
    name: "Full name",
    namePlaceholder: "Anna Kovalenko",
    otherRecipient: "add another recipient",
    otherRecipientName: "Recipient name",
    otherRecipientPhone: "Recipient phone",
    phone: "Phone",
    email: "Email",
    emailOptional: "optional",
    youChose: "you chose:",
    paymentStore: "pay in store",
    paymentStoreHint: "card/cash",
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
    addressHint: "City from the list first, then a warehouse",
    comment: "Comment",
    commentPlaceholder: "",
    commentOptional: "optional",
    payment: "Payment",
    paymentMethod: "Payment method",
    paymentHint: "Card via WayForPay. Cash on delivery with 200 UAH prepayment.",
    paymentTypes: {
      full: "Pay in full",
      prepay: "cash on delivery",
      pay_after: "pay in store",
    },
    paymentHints: {
      full: "card online",
      prepay: "(200 UAH prepayment)",
      pay_after: "card/cash",
    },
    methodHints: {
      nova_poshta_branch: "Classic branch",
      nova_poshta_locker: "Locker 24/7",
      nova_poshta_courier: "To your door",
      pickup: "Kyiv, Sofiivska 5",
      international: "Abroad",
    },
    payNow: "Pay now",
    amountDue: "Pay now",
    bagToggle: "you chose:",
    orderSummary: "Your order",
    summaryPositions: "items",
    managerNote: "After checkout a manager will confirm the details.",
    submit: "Place order",
    submitting: "Sending…",
    redirectingPay: "Redirecting to payment…",
    successTitle: "Order received",
    successText:
      "Thank you! We’ve received your order — review the details below.",
    successPaidText:
      "Thank you! Payment received. Your order is in progress — details below.",
    successOrderId: "Order number",
    successDetails: "Order details",
    successFollowUp:
      "Our manager will call you shortly at the phone number below to confirm delivery.",
    successCta: "Back home",
    backToShop: "Continue shopping",
    alsoLike: "You may also like",
    methods: {
      nova_poshta_branch: "Nova Poshta · branch",
      nova_poshta_locker: "Nova Poshta · locker",
      nova_poshta_courier: "Nova Poshta · courier",
      pickup: "pick up in store. Kyiv Sofiivska 5",
      international: "International shipping",
    },
    errors: {
      name: "Enter your full name",
      phone: "Enter a valid phone number",
      city: "Pick a city from the list",
      address: "Pick a warehouse or enter an address",
      payment: "Choose a payment method",
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
    placeholder: "",
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
    region: "english",
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
    shipping: "Payment & delivery",
    returns: "Returns & Exchanges",
    contactsPage: "Contacts",
    payment: "Payment & delivery",
    about: "About us",
    instagram: "_logic_clothes",
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
