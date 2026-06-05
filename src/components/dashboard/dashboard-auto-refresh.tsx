"use client";

import { FINPILOT_DATA_CHANGED } from "@/lib/finance-events";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Перезагружает серверные данные дашборда после CRUD на других страницах. */
export function DashboardAutoRefresh({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleDataChanged() {
      router.refresh();
    }

    window.addEventListener(FINPILOT_DATA_CHANGED, handleDataChanged);
    return () =>
      window.removeEventListener(FINPILOT_DATA_CHANGED, handleDataChanged);
  }, [router]);

  return children;
}
