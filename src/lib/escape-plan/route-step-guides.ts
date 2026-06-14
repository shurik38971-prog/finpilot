export const ROUTE_STEP_CHANNELS = "Определить каналы поиска клиентов";
export const ROUTE_STEP_CREATE_AD = "Создать объявление";

export type RouteGuideKind = "web_dev" | "on_site_repair";

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

const WEB_DEV_AD_TEXT = `Разработка сайтов для малого бизнеса

Сделаю сайт-визитку или лендинг под вашу задачу: структура, тексты, адаптив, базовое SEO.
Срок: 5–10 дней. Покажу 2–3 примера работ.

Пишите в сообщения — обсудим задачу и смету.`;

const ON_SITE_REPAIR_AD_TEXT = `Сантехник на выезд — [укажите ваш район]

Замена смесителей, устранение протечек, подключение сифона, мелкий ремонт.
Выезд в день обращения. Работаю аккуратно, убираю за собой.

Звоните или пишите — оценю задачу по фото.`;

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

export function detectRouteGuideKind(routeTitle: string): RouteGuideKind | null {
  const title = routeTitle.trim();
  if (
    /сантех|ремонт.*выезд|выезд.*ремонт|мастер.*выезд|сантехник/i.test(title)
  ) {
    return "on_site_repair";
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
  if (kind === "on_site_repair") {
    return {
      kind,
      platforms: ON_SITE_REPAIR_PLATFORMS,
      adText: ON_SITE_REPAIR_AD_TEXT,
      portfolioItems: ON_SITE_REPAIR_PORTFOLIO,
      checklist: STEP_COMPLETION_CHECKLIST,
    };
  }

  return {
    kind,
    platforms: WEB_DEV_PLATFORMS,
    adText: WEB_DEV_AD_TEXT,
    portfolioItems: WEB_DEV_PORTFOLIO,
    checklist: STEP_COMPLETION_CHECKLIST,
  };
}

export function getRouteStepGuide(
  routeTitle: string,
  stepTitle: string
): RouteStepGuide | null {
  const kind = detectRouteGuideKind(routeTitle);
  if (!kind) return null;

  if (kind === "web_dev" && stepTitle === ROUTE_STEP_CHANNELS) {
    return buildGuide(kind);
  }

  if (kind === "on_site_repair" && stepTitle === ROUTE_STEP_CREATE_AD) {
    return buildGuide(kind);
  }

  return null;
}
