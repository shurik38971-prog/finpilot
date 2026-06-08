"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ESCAPE_CONSTRAINTS,
  ESCAPE_GOALS,
  ESCAPE_HOURS_OPTIONS,
  ESCAPE_SKILLS,
  MAX_SECONDARY_GOALS,
  resolvePrimaryGoal,
  resolveSecondaryGoals,
  type CapabilitiesFormInput,
  type UserCapabilities,
} from "@/types/escape-plan";
import { useState } from "react";

interface CapabilitiesFormProps {
  initial?: UserCapabilities | null;
  loading?: boolean;
  onSubmit: (input: CapabilitiesFormInput) => Promise<void>;
}

export function CapabilitiesForm({
  initial,
  loading = false,
  onSubmit,
}: CapabilitiesFormProps) {
  const [currentWork, setCurrentWork] = useState(initial?.current_work ?? "");
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [hours, setHours] = useState(
    initial?.available_hours_per_week
      ? String(initial.available_hours_per_week)
      : "5"
  );
  const [constraints, setConstraints] = useState<string[]>(
    initial?.constraints?.filter((c) =>
      (ESCAPE_CONSTRAINTS as readonly string[]).includes(c)
    ) ?? []
  );
  const [constraintsOther, setConstraintsOther] = useState(
    initial?.constraints?.find(
      (c) => !(ESCAPE_CONSTRAINTS as readonly string[]).includes(c)
    ) ?? ""
  );
  const [primaryGoal, setPrimaryGoal] = useState(
    resolvePrimaryGoal(initial ?? null)
  );
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>(
    resolveSecondaryGoals(initial ?? null)
  );

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function toggleConstraint(constraint: string) {
    setConstraints((prev) =>
      prev.includes(constraint)
        ? prev.filter((c) => c !== constraint)
        : [...prev, constraint]
    );
  }

  function handlePrimaryChange(value: string) {
    setPrimaryGoal(value);
    setSecondaryGoals((prev) => prev.filter((goal) => goal !== value));
  }

  function toggleSecondaryGoal(goal: string) {
    if (goal === primaryGoal) return;

    setSecondaryGoals((prev) => {
      if (prev.includes(goal)) {
        return prev.filter((g) => g !== goal);
      }
      if (prev.length >= MAX_SECONDARY_GOALS) return prev;
      return [...prev, goal];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      current_work: currentWork,
      skills,
      available_hours_per_week: Number(hours),
      constraints,
      constraints_other: constraintsOther,
      primary_goal: primaryGoal,
      secondary_goals: secondaryGoals,
    });
  }

  const secondaryOptions = ESCAPE_GOALS.filter((goal) => goal !== primaryGoal);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="current_work"
        label="Чем вы сейчас занимаетесь?"
        value={currentWork}
        onChange={(e) => setCurrentWork(e.target.value)}
        placeholder="Например: работаю в магазине, в декрете, ищу работу"
        required
      />

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">Какие навыки у вас есть?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ESCAPE_SKILLS.map((skill) => (
            <label
              key={skill}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm cursor-pointer hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={skills.includes(skill)}
                onChange={() => toggleSkill(skill)}
                className="rounded border-border"
              />
              {skill}
            </label>
          ))}
        </div>
      </fieldset>

      <Select
        id="primary_goal"
        label="Главная цель"
        value={primaryGoal}
        onChange={(e) => handlePrimaryChange(e.target.value)}
        options={ESCAPE_GOALS.map((goal) => ({ value: goal, label: goal }))}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">
          Что ещё важно?{" "}
          <span className="text-xs">до {MAX_SECONDARY_GOALS}, по желанию</span>
        </legend>
        <div className="grid grid-cols-1 gap-2">
          {secondaryOptions.map((goal) => (
            <label
              key={goal}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm cursor-pointer hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={secondaryGoals.includes(goal)}
                onChange={() => toggleSecondaryGoal(goal)}
                disabled={
                  !secondaryGoals.includes(goal) &&
                  secondaryGoals.length >= MAX_SECONDARY_GOALS
                }
                className="rounded border-border"
              />
              {goal}
            </label>
          ))}
        </div>
      </fieldset>

      <Select
        id="hours"
        label="Сколько времени в неделю готовы выделить?"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        options={ESCAPE_HOURS_OPTIONS.map((o) => ({
          value: String(o.value),
          label: o.label,
        }))}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted">Есть ли ограничения?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ESCAPE_CONSTRAINTS.map((constraint) => (
            <label
              key={constraint}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm cursor-pointer hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={constraints.includes(constraint)}
                onChange={() => toggleConstraint(constraint)}
                className="rounded border-border"
              />
              {constraint}
            </label>
          ))}
        </div>
        {constraints.includes("Другое") && (
          <Input
            id="constraints_other"
            label="Уточните ограничение"
            value={constraintsOther}
            onChange={(e) => setConstraintsOther(e.target.value)}
            placeholder="Например: только утром до 12:00"
          />
        )}
      </fieldset>

      <Button type="submit" className="w-full" disabled={loading || skills.length === 0}>
        {loading ? "Анализируем..." : "Найти варианты выхода"}
      </Button>
    </form>
  );
}
