import { getUserFinancialProfile } from "@/lib/actions/profile";
import { DEFAULT_PROFILE_TYPE } from "@/types/profile";
import { SettingsPageClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getUserFinancialProfile();

  return (
    <SettingsPageClient
      profileType={profile.profileType ?? DEFAULT_PROFILE_TYPE}
    />
  );
}
