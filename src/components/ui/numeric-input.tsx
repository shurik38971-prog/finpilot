"use client";

import { Input } from "@/components/ui/input";
import {
  isDisplayZero,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
} from "@/lib/forms/numeric-field";
import { cn } from "@/lib/utils";
import { forwardRef, useRef } from "react";

export type NumericInputMode = "integer" | "decimal";

export interface NumericInputProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  mode?: NumericInputMode;
  value: string;
  onValueChange: (value: string) => void;
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput(
    {
      id,
      name,
      label,
      error,
      placeholder,
      required,
      disabled,
      readOnly,
      className,
      mode = "decimal",
      value,
      onValueChange,
    },
    ref
  ) {
    const userEditedRef = useRef(false);

    function handleFocus() {
      if (!userEditedRef.current && isDisplayZero(value)) {
        onValueChange("");
      }
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      userEditedRef.current = true;
      const next =
        mode === "integer"
          ? sanitizeIntegerInput(event.target.value)
          : sanitizeDecimalInput(event.target.value);
      onValueChange(next);
    }

    return (
      <Input
        ref={ref}
        id={id}
        name={name}
        label={label}
        error={error}
        type="text"
        inputMode={mode === "integer" ? "numeric" : "decimal"}
        autoComplete="off"
        enterKeyHint="done"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        className={cn(className)}
      />
    );
  }
);
