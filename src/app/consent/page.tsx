import { LegalPageShell } from "@/components/legal/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных — FinPilot",
  description:
    "Текст согласия пользователя на обработку персональных данных в FinPilot.",
};

export default function ConsentPage() {
  return (
    <LegalPageShell title="Согласие на обработку персональных данных">
      <p className="text-foreground">
        Регистрируясь в FinPilot и отмечая соответствующий чекбокс, вы
        подтверждаете, что ознакомились с{" "}
        <a href="/privacy" className="text-accent hover:underline">
          Политикой конфиденциальности
        </a>{" "}
        и даёте согласие на обработку персональных данных на условиях ниже.
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-foreground">
          Добровольное предоставление данных
        </h2>
        <p>
          Пользователь добровольно предоставляет данные для использования в
          сервисе FinPilot. Без согласия регистрация и полноценная работа
          личного кабинета невозможны.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-foreground">
          Перечень действий с данными
        </h2>
        <p>Вы соглашаетесь на сбор, запись, хранение, уточнение и использование
          следующих данных:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>адрес электронной почты;</li>
          <li>данные учётной записи;</li>
          <li>
            финансовая информация, которую вы вводите (доходы, расходы, долги,
            цели);
          </li>
          <li>результаты ИИ-анализа и ваши действия в сервисе.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-foreground">Цели обработки</h2>
        <p>
          Обработка осуществляется для предоставления функций FinPilot:
          персональный финансовый анализ, планирование, цели, обратная связь и
          поддержка работоспособности сервиса.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-foreground">
          Отзыв согласия
        </h2>
        <p>
          Вы вправе отозвать согласие, направив запрос на удаление аккаунта.
          После отзыва мы прекратим обработку данных, за исключением случаев,
          когда хранение требуется по закону.
        </p>
      </section>

      <p className="text-xs text-muted/80 pt-2">
        Факт принятия фиксируется в профиле: поля{" "}
        <code className="text-accent">privacy_accepted</code> и{" "}
        <code className="text-accent">privacy_accepted_at</code> в момент
        регистрации.
      </p>
    </LegalPageShell>
  );
}
