"use client";

import { SiteCopyProvider } from "@/components/copy/site-copy-provider";
import { FeedbackWidget } from "@/components/analytics/feedback-widget";
import { ProductAnalytics } from "@/components/analytics/product-analytics";
import { ValueFeedbackPrompt } from "@/components/feedback/value-feedback-prompt";
import type { ResolvedSiteCopy } from "@/lib/copy/resolve-site-copy";
import { useState } from "react";
import { MobileHeader } from "./mobile-header";
import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  showAdminNav = false,
  siteCopy,
}: {
  children: React.ReactNode;
  showAdminNav?: boolean;
  siteCopy: ResolvedSiteCopy;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SiteCopyProvider copy={siteCopy}>
    <div className="min-h-screen">
      <ProductAnalytics />
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        showAdminNav={showAdminNav}
      />
      <div className="md:ml-60">
        <MobileHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 pb-28 sm:p-6 sm:pb-28 md:p-8 md:pb-8">
          {children}
        </main>
      </div>
      <FeedbackWidget hidden={mobileOpen} />
      <ValueFeedbackPrompt />
    </div>
    </SiteCopyProvider>
  );
}
