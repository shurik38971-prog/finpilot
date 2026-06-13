import { LegalPageShell } from "@/components/legal/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — FinPilot",
  description:
    "Как FinPilot собирает и использует персональные данные пользователей.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Политика конфиденциальности">
      <p className="text-foreground">
        Настоящая политика описывает, какие данные собирает сервис FinPilot и
        как они используются.
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-foreground">
          Какие данные мы собираем
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Email</strong> — для входа в
            аккаунт, восстановления доступа и важных уведомлений о сервисе.
          </li>
          <li>
            <strong className="text-foreground">Данные аккаунта</strong> —
            идентификатор пользователя, дата регистрации, факт принятия
            политики конфиденциальности и согласия на обработку данных.
          </li>
          <li>
            <strong className="text-foreground">
              Финансовые данные, введённые пользователем
            </strong>{" "}
            — доходы, расходы, долги, цели и результаты ИИ-анализа. Вы вводите
            их вручную; FinPilot не подключается к банку без вашего участия.
          </li>
          <li>
            <strong className="text-foreground">Цели и аналитика</strong> —
            финансовые цели, прогресс онбординга, события использования
            сервиса (например, переходы по страницам) и обратная связь, если вы
            её оставляете.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-foreground">
          Как мы используем данные
        </h2>
        <p>
          Данные используются исключительно для работы сервиса FinPilot: расчёта
          расчёта финансовой картины, формирования рекомендаций, хранения ваших целей
          и улучшения продукта.
        </p>
        <p>
          Мы не продаём персональные данные и не передаём их третьим лицам в
          маркетинговых целях. Доступ имеют только необходимые технические
          провайдеры, без которых сервис не может работать — например{" "}
          <strong className="text-foreground">Supabase</strong> (хранение
          данных и авторизация) и{" "}
          <strong className="text-foreground">Vercel</strong> (размещение
          приложения).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-foreground">Ваши права</h2>
        <p>
          Вы можете запросить уточнение, обновление или удаление данных,
          связавшись с нами по email, указанному в сервисе. Удаление аккаунта
          приводит к удалению связанных данных в пределах, допускаемых
          законодательством и техническими ограничениями резервного копирования.
        </p>
      </section>

      <p className="text-xs text-muted/80 pt-2">
        Дата публикации: {new Date().toLocaleDateString("ru-RU")}. См. также{" "}
        <a href="/consent" className="text-accent hover:underline">
          согласие на обработку персональных данных
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
