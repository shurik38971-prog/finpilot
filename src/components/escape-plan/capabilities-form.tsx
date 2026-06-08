"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ESCAPE_CONSTRAINTS,
  ESCAPE_HOURS_OPTIONS,
  ESCAPE_SKILLS,
  ESCAPE_TARGET_RESULTS,
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
  const [targetResult, setTargetResult] = useState(
    initial?.target_result ?? ESCAPE_TARGET_RESULTS[0]
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      current_work: currentWork,
      skills,
      available_hours_per_week: Number(hours),
      constraints,
      constraints_other: constraintsOther,
      target_result: targetResult,
    });
  }

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

      <Select
        id="target_result"
        label="Какой результат нужен?"
        value={targetResult}
        onChange={(e) => setTargetResult(e.target.value)}
        options={ESCAPE_TARGET_RESULTS.map((r) => ({ value: r, label: r }))}
      />

      <Button type="submit" className="w-full" disabled={loading || skills.length === 0}>
        {loading ? "Анализируем..." : "Найти варианты выхода"}
      </Button>
    </form>
  );
}
