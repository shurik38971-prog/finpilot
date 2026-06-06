"use client";

import {
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

export function IncomeStep({
  profileType,
  onComplete,
}: {
  profileType: ProfileType;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      onComplete();
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
        average: Number(form.get("average")),
        badMonth: Number(form.get("badMonth")),
        goodMonth: Number(form.get("goodMonth")),
      });
      onComplete();
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
      onComplete();
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
      onComplete();
    } catch {
      setError("Не удалось сохранить доход");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Расскажите о доходах</h2>
        <p className="text-sm text-muted mt-1">
          {profileType === PROFILE_TYPES.employee
            ? "Укажите зарплату и как часто приходят выплаты"
            : usesVariableIncome(profileType)
              ? "Оцените средний доход и разброс по месяцам"
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
            placeholder="80000"
          />
          <Select
            id="frequency"
            name="frequency"
            label="Периодичность выплат"
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
            id="average"
            name="average"
            label="Средний доход в месяц (₽)"
            type="number"
            min="1"
            required
            placeholder="120000"
          />
          <Input
            id="badMonth"
            name="badMonth"
            label="Плохой месяц (₽)"
            type="number"
            min="0"
            required
            placeholder="60000"
          />
          <Input
            id="goodMonth"
            name="goodMonth"
            label="Хороший месяц (₽)"
            type="number"
            min="1"
            required
            placeholder="180000"
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
