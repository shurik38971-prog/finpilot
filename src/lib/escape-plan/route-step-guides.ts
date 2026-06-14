export const ROUTE_STEP_CHANNELS = "Определить каналы поиска клиентов";
export const ROUTE_STEP_CREATE_AD = "Создать объявление";

export type RouteGuideKind = "web_dev" | "on_site_repair" | "computer_help";

export interface RoutePlatformGuide {
  name: string;
  why: string;
  whatToPost: string;
}

export interface RouteStepGuide {
  kind: RouteGuideKind;
  platforms: RoutePlatformGuide[];
  adText: string;
  portfolioItems: string[];
  checklist: string[];
}

const STEP_COMPLETION_CHECKLIST = [
  "Выберите 2–3 площадки",
  "Подготовьте описание услуги",
  "Добавьте портфолио или примеры работ",
  "Опубликуйте первое объявление",
];

const WEB_DEV_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Авито Услуги",
    why: "Много малых бизнесов ищут исполнителей по городу",
    whatToPost: "Короткое объявление с ценой «от», 2–3 примера работ и сроком",
  },
  {
    name: "Яндекс Услуги",
    why: "Удобно для локальных заказов и быстрых откликов",
    whatToPost: "Услуга, район, примеры работ и контакт для связи",
  },
  {
    name: "Kwork",
    why: "Клиенты уже привыкли заказывать сайты и лендинги по пакетам",
    whatToPost: "Кворк с понятным результатом: «лендинг под ключ», срок и что входит",
  },
  {
    name: "VK / Telegram-чаты предпринимателей",
    why: "Быстрые рекомендации и заказы от знакомых предпринимателей",
    whatToPost: "Короткий пост: кому помогаете, 1–2 кейса, ссылка на портфолио",
  },
  {
    name: "FL / freelance-площадки",
    why: "Подходит для удалённых заказов и первых отзывов",
    whatToPost: "Профиль с портфолио и отклики на небольшие проекты",
  },
];

const ON_SITE_REPAIR_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Авито Услуги",
    why: "Люди часто ищут мастера рядом с домом",
    whatToPost: "Услуги, район выезда, примерные цены и фото работ",
  },
  {
    name: "Яндекс Услуги",
    why: "Удобно для срочных вызовов и локальных заказов",
    whatToPost: "Список работ, зона обслуживания и быстрый контакт",
  },
  {
    name: "Профи",
    why: "Клиенты ищут проверенных мастеров с отзывами",
    whatToPost: "Профиль с фото работ, ценами и описанием выезда",
  },
  {
    name: "Местные Telegram-чаты района",
    why: "Быстрые рекомендации соседей и сарафанное радио",
    whatToPost: "Короткое сообщение: чем помогаете, район, телефон",
  },
  {
    name: "Объявления в домовых чатах / ЖК",
    why: "Близкая аудитория, которой нужен мастер «здесь и сейчас»",
    whatToPost: "Простое объявление с видами работ и контактом",
  },
];

const COMPUTER_HELP_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Авито Услуги",
    why: "Частый поиск мастера «рядом с домом» для настройки техники",
    whatToPost: "Список услуг, выезд или удалённо, цена «от» и район",
  },
  {
    name: "Яндекс Услуги",
    why: "Подходит для срочных вызовов и локальных заказов",
    whatToPost: "Что настраиваете, сроки выезда и контакт",
  },
  {
    name: "Профи",
    why: "Клиенты ищут специалистов с отзывами по IT-услугам",
    whatToPost: "Профиль с перечнем работ, ценами и примерами задач",
  },
  {
    name: "Местные Telegram-чаты района",
    why: "Быстрые рекомендации соседям и знакомым",
    whatToPost: "Короткий пост: чем помогаете, выезд, телефон",
  },
  {
    name: "Объявления в домовых чатах / ЖК",
    why: "Люди часто ищут помощь с ПК и интернетом рядом",
    whatToPost: "Простое объявление: настройка ПК, роутера, принтера",
  },
];

const WEB_DEV_AD_TEXT = `Разработка сайтов для малого бизнеса

Сделаю сайт-визитку или лендинг под вашу задачу: структура, тексты, адаптив, базовое SEO.
Срок: 5–10 дней. Покажу 2–3 примера работ.

Пишите в сообщения — обсудим задачу и смету.`;

const ON_SITE_REPAIR_AD_TEXT = `Сантехник на выезд — [укажите ваш район]

Замена смесителей, устранение протечек, подключение сифона, мелкий ремонт.
Выезд в день обращения. Работаю аккуратно, убираю за собой.

Звоните или пишите — оценю задачу по фото.`;

const COMPUTER_HELP_AD_TEXT = `Компьютерная помощь на дому — [укажите ваш район]

Настройка ПК и ноутбука, подключение принтера, интернета и Wi‑Fi, помощь с телефоном.
Объясню простыми словами, что сделано. Выезд в удобное время.

Пишите или звоните — уточню задачу и стоимость.`;

const WEB_DEV_PORTFOLIO = [
  "2–3 скриншота готовых работ",
  "Короткое описание задачи клиента",
  "Что именно было сделано",
  "Ссылка на проект или демо",
  "Кому подойдёт такой сайт (ниша, формат бизнеса)",
];

const ON_SITE_REPAIR_PORTFOLIO = [
  "Фото «до / после»",
  "Краткое описание выполненной работы",
  "Район или формат выезда",
  "Примерные сроки выполнения",
  "Гарантия на работу, если есть",
  "Контакты для связи",
];

const COMPUTER_HELP_PORTFOLIO = [
  "Список типовых задач: ПК, принтер, интернет, телефон",
  "Краткое описание 1–2 решённых случаев",
  "Формат работы: выезд, удалённо или оба варианта",
  "Район обслуживания или время ответа",
  "Отзывы или рекомендации, если есть",
  "Контакты для связи",
];

export function detectRouteGuideKind(routeTitle: string): RouteGuideKind | null {
  const title = routeTitle.trim();
  if (
    /сантех|ремонт.*выезд|выезд.*ремонт|мастер.*выезд|сантехник/i.test(title)
  ) {
    return "on_site_repair";
  }
  if (
    /компьютер|настройк.*пк|it-помощ|it помощ|it услуг|ремонт.*комп|ноутбук|принтер|интернет|телефон|техподдерж|пк на дому/i.test(
      title
    )
  ) {
    return "computer_help";
  }
  if (
    /разработк.*сайт|сайт.*разработ|веб-разработ|лендинг|landing|tilda|wordpress/i.test(
      title
    )
  ) {
    return "web_dev";
  }
  return null;
}

function buildGuide(kind: RouteGuideKind): RouteStepGuide {
  switch (kind) {
    case "on_site_repair":
      return {
        kind,
        platforms: ON_SITE_REPAIR_PLATFORMS,
        adText: ON_SITE_REPAIR_AD_TEXT,
        portfolioItems: ON_SITE_REPAIR_PORTFOLIO,
        checklist: STEP_COMPLETION_CHECKLIST,
      };
    case "computer_help":
      return {
        kind,
        platforms: COMPUTER_HELP_PLATFORMS,
        adText: COMPUTER_HELP_AD_TEXT,
        portfolioItems: COMPUTER_HELP_PORTFOLIO,
        checklist: STEP_COMPLETION_CHECKLIST,
      };
    default:
      return {
        kind: "web_dev",
        platforms: WEB_DEV_PLATFORMS,
        adText: WEB_DEV_AD_TEXT,
        portfolioItems: WEB_DEV_PORTFOLIO,
        checklist: STEP_COMPLETION_CHECKLIST,
      };
  }
}

/** Route-specific practical example; same content for all steps of the route. */
export function getRoutePracticalGuide(routeTitle: string): RouteStepGuide | null {
  const kind = detectRouteGuideKind(routeTitle);
  if (!kind) return null;
  return buildGuide(kind);
}
