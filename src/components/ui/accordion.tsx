"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

type AccordionContextValue = {
  open: string | null;
  toggle: (id: string) => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <AccordionContext.Provider
      value={{
        open,
        toggle: (id) => setOpen((prev) => (prev === id ? null : id)),
      }}
    >
      <div className={cn("space-y-3", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  id,
  question,
  answer,
}: {
  id: string;
  question: string;
  answer: string;
}) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used within Accordion");

  const isOpen = ctx.open === id;

  return (
    <div className="glass overflow-hidden transition-colors hover:border-white/[0.12]">
      <button
        type="button"
        onClick={() => ctx.toggle(id)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium">{question}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
