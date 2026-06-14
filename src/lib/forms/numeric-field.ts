export function sanitizeDecimalInput(raw: string): string {
  let result = "";
  let hasSeparator = false;

  for (const char of raw) {
    if (char >= "0" && char <= "9") {
      result += char;
      continue;
    }
    if ((char === "." || char === ",") && !hasSeparator) {
      result += char;
      hasSeparator = true;
    }
  }

  return result;
}

export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isDisplayZero(value: string): boolean {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return false;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed === 0;
}

/** Empty in UI for null/undefined/0 unless explicitly showing zero. */
export function numberToFieldValue(
  value: number | null | undefined,
  options?: { showZero?: boolean }
): string {
  if (value == null) return "";
  if (value === 0 && !options?.showZero) return "";
  return String(value);
}

export function rateToFieldValue(value: number | null | undefined): string {
  if (value == null || value === 0) return "";
  return String(value).replace(".", ",");
}

export function parseOptionalNumber(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseNumberForCalc(raw: string): number {
  return parseOptionalNumber(raw) ?? 0;
}

export function parseOptionalInteger(raw: string): number | null {
  const normalized = raw.trim();
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
