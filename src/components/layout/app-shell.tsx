"use client";

import { FeedbackWidget } from "@/components/analytics/feedback-widget";
import { ProductAnalytics } from "@/components/analytics/product-analytics";
import { QuickFeedbackPrompt } from "@/components/feedback/quick-feedback-prompt";
import { useState } from "react";
import { MobileHeader } from "./mobile-header";
import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <ProductAnalytics />
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isAdmin={isAdmin}
      />
      <div className="md:ml-60">
        <MobileHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 md:p-8">{children}</main>
      </div>
      <FeedbackWidget />
      <QuickFeedbackPrompt />
    </div>
  );
}
