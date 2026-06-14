import {
  resolveRouteType,
  type RouteType,
} from "@/lib/escape-plan/route-types";
import type { EscapePlanOption } from "@/types/escape-plan";

export const ROUTE_STEP_CHANNELS = "Определить каналы поиска клиентов";
export const ROUTE_STEP_CREATE_AD = "Создать объявление";

export type RouteGuideKind = RouteType;

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
  sectionLabels?: Partial<{
    platforms: string;
    message: string;
    details: string;
    checklist: string;
    platformWhy: string;
    platformWhat: string;
  }>;
}

const SERVICE_CHECKLIST = [
  "Выберите 2–3 площадки",
  "Подготовьте описание услуги",
  "Добавьте примеры работ",
  "Опубликуйте первое объявление",
];

const CONSULTING_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Профи.ру",
    why: "Люди ищут консультации и обучение по конкретным темам",
    whatToPost: "Тема, формат, длительность и цена «от»",
  },
  {
    name: "Авито Услуги",
    why: "Подходит для локальных и онлайн-консультаций",
    whatToPost: "Короткое описание темы и способ связи",
  },
  {
    name: "Telegram / VK",
    why: "Быстрые рекомендации в тематических чатах",
    whatToPost: "Короткий пост: кому помогаете и какая тема",
  },
  {
    name: "Личные рекомендации",
    why: "Первые консультации часто приходят от знакомых",
    whatToPost: "Сообщение: тема, формат и как записаться",
  },
];

const CONSULTING_MESSAGE = `Консультация по [ваша тема]

Помогу разобраться с [конкретная задача]: объясню по шагам, отвечу на вопросы, подскажу, что делать дальше.
Формат: созвон или переписка, 30–45 минут.

Напишите, с чем нужна помощь — уточню, подойдёт ли формат.`;

const CONSULTING_DETAILS = [
  "Тема и для кого консультация",
  "Формат: созвон, переписка, мини-урок",
  "Длительность и цена «от»",
  "Что человек получит на выходе",
  "Как записаться и связаться",
];

const CONSULTING_CHECKLIST = [
  "Определена тема консультации",
  "Выбран формат работы",
  "Готово короткое предложение",
  "Выбраны 2 площадки для первых заявок",
  "Сделана первая проверка формата",
];

const CASHBACK_PARTNER_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Letyshops",
    why: "Кэшбэк с покупок в популярных магазинах, без вложений",
    whatToPost: "Проверьте минимальную сумму вывода и сроки начисления",
  },
  {
    name: "Admitad / партнёрские сети",
    why: "Реферальные ссылки на сервисы и магазины",
    whatToPost: "Условия участия, запреты на спам и требования к трафику",
  },
  {
    name: "Банковские кэшбэк-программы",
    why: "Бонусы за обычные покупки по карте",
    whatToPost: "Лимиты начисления, категории и срок действия акций",
  },
  {
    name: "Telegram / VK",
    why: "Простой канал для личных рекомендаций знакомым",
    whatToPost: "Короткое сообщение без обещаний гарантированного дохода",
  },
];

const CASHBACK_MESSAGE_TEXT = `Нашёл сервис с бонусом/кэшбэком, который может быть полезен при обычных покупках. Посмотрите условия сами, особенно минимальную сумму вывода и сроки начисления. Если подходит — можно попробовать без лишних вложений.`;

const CASHBACK_CONDITIONS_CHECKLIST = [
  "Минимальная сумма вывода и комиссии",
  "Сроки начисления бонусов или кэшбэка",
  "Правила участия и ограничения по региону",
  "Нужны ли вложения или покупки «для галочки»",
  "Как отслеживать переходы и начисления",
];

const CASHBACK_SAFETY_CHECKLIST = [
  "Выбраны 2–3 сервиса с понятными условиями",
  "Проверены сроки и минимальная сумма вывода",
  "Подготовлено короткое честное сообщение",
  "Выбран один безопасный канал без спама",
  "Сделана первая проверка: переходы или начисления",
];

const ON_SITE_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Авито Услуги",
    why: "Люди часто ищут мастера рядом с домом",
    whatToPost: "Услуги, район выезда, примерные цены и фото работ",
  },
  {
    name: "Яндекс Услуги",
    why: "Удобно для срочных вызовов и локальных заявок",
    whatToPost: "Список работ, зона обслуживания и быстрый контакт",
  },
  {
    name: "Профи",
    why: "Ищут проверенных мастеров с отзывами",
    whatToPost: "Профиль с фото работ, ценами и описанием выезда",
  },
  {
    name: "Местные Telegram-чаты района",
    why: "Быстрые рекомендации соседей",
    whatToPost: "Короткое сообщение: чем помогаете, район, телефон",
  },
];

const ON_SITE_AD_TEXT = `Мастер на выезд — [укажите ваш район]

Выполняю [список работ]. Работаю аккуратно, уточняю задачу перед выездом.
Звоните или пишите — оценю задачу по фото или описанию.`;

const ON_SITE_DETAILS = [
  "Фото «до / после»",
  "Краткое описание выполненной работы",
  "Район или формат выезда",
  "Примерные сроки выполнения",
  "Контакты для связи",
];

const REMOTE_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Kwork",
    why: "Удобно для пакетных удалённых услуг",
    whatToPost: "Кворк с понятным результатом, сроком и ценой «от»",
  },
  {
    name: "FL.ru",
    why: "Подходит для удалённых задач и первых отзывов",
    whatToPost: "Профиль с примерами и отклики на небольшие задачи",
  },
  {
    name: "Telegram / VK",
    why: "Быстрые рекомендации и прямые обращения",
    whatToPost: "Короткий пост: чем помогаете и как связаться",
  },
];

const REMOTE_MESSAGE = `Помогу удалённо с [ваша услуга]

Формат: онлайн, сроки и стоимость обсуждаем после уточнения задачи.
Покажу примеры работ, если нужно.

Напишите, что требуется — оценю, смогу ли помочь.`;

const FREELANCE_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Kwork",
    why: "Клиенты заказывают сайты и дизайн по пакетам",
    whatToPost: "Кворк с результатом, сроком и что входит",
  },
  {
    name: "FL.ru",
    why: "Подходит для проектной работы",
    whatToPost: "Портфолио и отклики на небольшие проекты",
  },
  {
    name: "Авито Услуги",
    why: "Локальный спрос на сайты и лендинги",
    whatToPost: "Короткое объявление с ценой «от» и примерами",
  },
];

const FREELANCE_MESSAGE = `Разработка сайтов для малого бизнеса

Сделаю сайт-визитку или лендинг: структура, тексты, адаптив.
Срок: 5–10 дней. Покажу 2–3 примера работ.

Пишите в сообщения — обсудим задачу и смету.`;

const FREELANCE_DETAILS = [
  "2–3 скриншота готовых работ",
  "Короткое описание задачи",
  "Что именно было сделано",
  "Ссылка на проект или демо",
  "Кому подойдёт такой результат",
];

const RESALE_PLATFORMS: RoutePlatformGuide[] = [
  {
    name: "Авито",
    why: "Быстрый старт для перепродажи без вложений в витрину",
    whatToPost: "Честные фото, описание, цена и условия передачи",
  },
  {
    name: "Юла",
    why: "Дополнительный охват локального спроса",
    whatToPost: "Короткое объявление с фото и ценой",
  },
  {
    name: "Маркетплейсы",
    why: "Если готовы к упаковке и логистике",
    whatToPost: "Карточка товара, остатки и условия доставки",
  },
];

const RESALE_MESSAGE = `Продаю [товар] в хорошем состоянии.

Цена: [сумма]. Самовывоз / доставка по договорённости.
Пишите — отвечу на вопросы, пришлю дополнительные фото.`;

const GENERIC_CHECKLIST = [
  "Уточнено направление",
  "Выбран формат работы",
  "Готово короткое предложение",
  "Проверен спрос в одном канале",
  "Сделан первый тест",
];

function buildGuideForRouteType(routeType: RouteType): RouteStepGuide {
  switch (routeType) {
    case "consulting_training":
      return {
        kind: routeType,
        platforms: CONSULTING_PLATFORMS,
        adText: CONSULTING_MESSAGE,
        portfolioItems: CONSULTING_DETAILS,
        checklist: CONSULTING_CHECKLIST,
        sectionLabels: {
          platforms: "Площадки для первых заявок",
          platformWhy: "Почему подходит: ",
          platformWhat: "Что разместить: ",
          message: "Пример короткого предложения",
          details: "Что указать в предложении",
          checklist: "Чек-лист перед первой консультацией",
        },
      };
    case "cashback_partner":
      return {
        kind: routeType,
        platforms: CASHBACK_PARTNER_PLATFORMS,
        adText: CASHBACK_MESSAGE_TEXT,
        portfolioItems: CASHBACK_CONDITIONS_CHECKLIST,
        checklist: CASHBACK_SAFETY_CHECKLIST,
        sectionLabels: {
          platforms: "Примеры площадок и сервисов",
          platformWhy: "Зачем смотреть: ",
          platformWhat: "На что обратить внимание: ",
          message: "Пример короткого сообщения",
          details: "На что смотреть в условиях",
          checklist: "Чек-лист безопасной проверки",
        },
      };
    case "on_site_service":
      return {
        kind: routeType,
        platforms: ON_SITE_PLATFORMS,
        adText: ON_SITE_AD_TEXT,
        portfolioItems: ON_SITE_DETAILS,
        checklist: SERVICE_CHECKLIST,
        sectionLabels: {
          details: "Что показать в объявлении",
        },
      };
    case "remote_service":
      return {
        kind: routeType,
        platforms: REMOTE_PLATFORMS,
        adText: REMOTE_MESSAGE,
        portfolioItems: [
          "Список типовых задач",
          "1–2 примера или кейса",
          "Сроки и формат связи",
          "Цена «от» или вилка",
        ],
        checklist: SERVICE_CHECKLIST,
        sectionLabels: {
          platforms: "Каналы для первых заявок",
          message: "Пример короткого предложения",
          details: "Что указать в профиле",
        },
      };
    case "freelance_project":
      return {
        kind: routeType,
        platforms: FREELANCE_PLATFORMS,
        adText: FREELANCE_MESSAGE,
        portfolioItems: FREELANCE_DETAILS,
        checklist: SERVICE_CHECKLIST,
      };
    case "resale_trade":
      return {
        kind: routeType,
        platforms: RESALE_PLATFORMS,
        adText: RESALE_MESSAGE,
        portfolioItems: [
          "Честные фото товара",
          "Состояние и комплектация",
          "Цена и торг",
          "Способ передачи",
        ],
        checklist: [
          "Выбрана категория товаров",
          "Проверена маржа",
          "Готово объявление",
          "Сделана первая проверка спроса",
        ],
        sectionLabels: {
          platforms: "Где продавать",
          message: "Пример объявления",
          details: "Что указать в карточке",
        },
      };
    case "simple_side_job":
      return {
        kind: routeType,
        platforms: [
          {
            name: "Подработка.ру",
            why: "Разовые смены и задачи",
            whatToPost: "Профиль и отклики на простые вакансии",
          },
          {
            name: "Авито Работа",
            why: "Локальные подработки",
            whatToPost: "Короткий отклик с доступным графиком",
          },
        ],
        adText: `Ищу подработку: [чем готовы заняться].
Доступен [график]. Пишите — уточню детали.`,
        portfolioItems: ["График", "Опыт", "Контакт"],
        checklist: GENERIC_CHECKLIST,
      };
    case "generic":
    default:
      return {
        kind: "generic",
        platforms: [
          {
            name: "Личные рекомендации",
            why: "Быстрый способ проверить идею",
            whatToPost: "Короткое сообщение знакомым",
          },
          {
            name: "Telegram / VK",
            why: "Тематические чаты по вашей нише",
            whatToPost: "Пост с предложением и контактом",
          },
        ],
        adText: `Проверяю направление «[тема]».
Коротко: [чем помогаете], формат [онлайн/офлайн].
Если актуально — напишите, обсудим.`,
        portfolioItems: [
          "Кому подходит предложение",
          "Формат и сроки",
          "Примерная стоимость или бонус",
        ],
        checklist: GENERIC_CHECKLIST,
        sectionLabels: {
          platforms: "Где проверить спрос",
          message: "Пример короткого предложения",
          details: "Что подготовить",
          checklist: "Чек-лист первого теста",
        },
      };
  }
}

export function getRoutePracticalGuideForOption(
  option: Pick<EscapePlanOption, "title" | "type"> &
    Partial<Pick<EscapePlanOption, "route_type" | "why_fits" | "first_step">>
): RouteStepGuide | null {
  if (option.type && option.type !== "increase_income") return null;
  const routeType = resolveRouteType({
    ...option,
    type: option.type ?? "increase_income",
  });
  return buildGuideForRouteType(routeType);
}

/** @deprecated use getRoutePracticalGuideForOption */
export function getRoutePracticalGuide(routeTitle: string): RouteStepGuide | null {
  return getRoutePracticalGuideForOption({
    title: routeTitle,
    type: "increase_income",
  });
}

export function detectRouteGuideKind(routeTitle: string): RouteGuideKind | null {
  const guide = getRoutePracticalGuide(routeTitle);
  return guide?.kind ?? null;
}
