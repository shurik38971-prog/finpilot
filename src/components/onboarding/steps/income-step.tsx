"use client";

import {
  saveWizardAdditionalIncome,
  saveWizardBusinessIncome,
  saveWizardEmployeeIncome,
  saveWizardRetireeIncome,
  saveWizardVariableIncome,
} from "@/lib/actions/onboarding-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  PROFILE_TYPES,
  usesVariableIncome,
  type ProfileType,
} from "@/types/profile";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const frequencyOptions = [
  { value: "monthly", label: "Раз в месяц" },
  { value: "twice_monthly", label: "Два раза в месяц" },
  { value: "weekly", label: "Раз в неделю" },
];

const additionalPeriodOptions = [
  { value: "monthly", label: "Каждый месяц" },
  { value: "once", label: "Разово" },
];

type Phase = "main" | "additional-ask" | "additional-form";

export function IncomeStep({
  profileType,
  onComplete,
}: {
  profileType: ProfileType;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function afterMainIncomeSaved() {
    if (usesVariableIncome(profileType)) {
      onComplete();
      return;
    }
    setPhase("additional-ask");
    setError("");
  }

  async function handleEmployeeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await saveWizardEmployeeIncome(
        Number(form.get("salary")),
        form.get("frequency") as "monthly" | "twice_monthly" | "weekly"
      );
      await afterMainIncomeSaved();
    } catch {
      setError("Не удалось сохранить доход");
    } finally {
      setLoading(false);
    }
  }

  async function handleVariableSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await saveWizardVariableIncome({
        badMonth: Number(form.get("badMonth")),
        goodMonth: Number(form.get("goodMonth")),
      });
      await afterMainIncomeSaved();
    } catch {
      setError("Не удалось сохранить доход");
    } finally {
      setLoading(false);
    }
  }

  async function handleBusinessSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await saveWizardBusinessIncome(Number(form.get("average")));
      await afterMainIncomeSaved();
    } catch {
      setError("Не удалось сохранить доход");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetireeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await saveWizardRetireeIncome(Number(form.get("pension")));
      await afterMainIncomeSaved();
    } catch {
      setError("Не удалось сохранить доход");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdditionalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await saveWizardAdditionalIncome({
        title: String(form.get("title")),
        amount: Number(form.get("amount")),
        frequency: form.get("frequency") as "monthly" | "once",
      });
      onComplete();
    } catch {
      setError("Не удалось сохранить дополнительный доход");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "additional-ask") {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Дополнительные доходы</h2>
          <p className="text-sm text-muted mt-1">
            Есть ли у вас доходы кроме основного? Например, подработка, аренда
            или премии.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full h-12"
            onClick={onComplete}
          >
            Нет, только основной доход
          </Button>
          <Button
            type="button"
            className="w-full h-12"
            onClick={() => setPhase("additional-form")}
          >
            Да, добавить
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "additional-form") {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Дополнительный доход</h2>
          <p className="text-sm text-muted mt-1">
            Укажите источник и сумму. Ещё доходы можно добавить позже в разделе
            «Доходы».
          </p>
        </div>
        <form onSubmit={handleAdditionalSubmit} className="space-y-4">
          <Input
            id="title"
            name="title"
            label="Название"
            required
            placeholder="Аренда квартиры"
          />
          <Input
            id="amount"
            name="amount"
            label="Сумма (₽)"
            type="number"
            min="1"
            required
            placeholder="15000"
          />
          <Select
            id="frequency"
            name="frequency"
            label="Как часто приходит"
            defaultValue="monthly"
            options={additionalPeriodOptions}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Далее"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Ваш основной доход</h2>
        <p className="text-sm text-muted mt-1">
          {profileType === PROFILE_TYPES.employee
            ? "Укажите зарплату — мы сразу используем её в анализе"
            : usesVariableIncome(profileType)
              ? "Укажите типичный минимум и максимум в месяц"
              : profileType === PROFILE_TYPES.retiree
                ? "Укажите размер пенсии"
                : "Укажите средний месячный доход бизнеса"}
        </p>
      </div>

      {profileType === PROFILE_TYPES.employee && (
        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
          <Input
            id="salary"
            name="salary"
            label="Зарплата (₽)"
            type="number"
            min="1"
            step="1"
            required
            placeholder="100000"
          />
          <Select
            id="frequency"
            name="frequency"
            label="Как часто приходит"
            defaultValue="monthly"
            options={frequencyOptions}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Далее"}
          </Button>
        </form>
      )}

      {usesVariableIncome(profileType) && (
        <form onSubmit={handleVariableSubmit} className="space-y-4">
          <Input
            id="badMonth"
            name="badMonth"
            label="Минимальный доход в месяц (₽)"
            type="number"
            min="0"
            required
            placeholder="50000"
          />
          <Input
            id="goodMonth"
            name="goodMonth"
            label="Максимальный доход в месяц (₽)"
            type="number"
            min="1"
            required
            placeholder="120000"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Далее"}
          </Button>
        </form>
      )}

      {profileType === PROFILE_TYPES.business_owner && (
        <form onSubmit={handleBusinessSubmit} className="space-y-4">
          <Input
            id="average"
            name="average"
            label="Средний доход в месяц (₽)"
            type="number"
            min="1"
            required
            placeholder="250000"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Далее"}
          </Button>
        </form>
      )}

      {profileType === PROFILE_TYPES.retiree && (
        <form onSubmit={handleRetireeSubmit} className="space-y-4">
          <Input
            id="pension"
            name="pension"
            label="Пенсия в месяц (₽)"
            type="number"
            min="1"
            required
            placeholder="25000"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Далее"}
          </Button>
        </form>
      )}
    </div>
  );
}
