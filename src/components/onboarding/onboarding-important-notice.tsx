export function OnboardingImportantNotice() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed">
      <p className="font-medium text-amber-200">Важно</p>
      <p className="text-muted mt-1">
        Сейчас мы построим первый финансовый план на основе данных, которые вы
        введёте. Первый анализ поможет увидеть общую картину и возможные риски.
      </p>
      <p className="text-muted mt-2">
        Чем точнее вы будете вести доходы и расходы, тем точнее станут прогнозы
        и рекомендации. Обычно заметный рост точности появляется через 3–4 недели
        использования.
      </p>
      <p className="text-muted mt-2">
        ФинПилот — это финансовый навигатор, а не волшебная кнопка.
      </p>
    </div>
  );
}
