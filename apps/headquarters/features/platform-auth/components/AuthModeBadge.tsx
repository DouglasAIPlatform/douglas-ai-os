"use client";

import { AUTH_MODE_LABELS, AUTH_STATUS_LABELS, useAuthSession } from "@douglas/supabase";
import { StatusBadge, type StatusBadgeVariant } from "@douglas/ui";

function modeVariant(mode: ReturnType<typeof useAuthSession>["mode"]): StatusBadgeVariant {
  switch (mode) {
    case "authenticated":
      return "available";
    case "supabase_ready":
      return "development";
    default:
      return "neutral";
  }
}

export function AuthModeBadge() {
  const authSession = useAuthSession();

  return (
    <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
      <StatusBadge
        label={AUTH_STATUS_LABELS[authSession.status]}
        variant={authSession.status === "authenticated" ? "available" : "neutral"}
      />
      <StatusBadge
        label={AUTH_MODE_LABELS[authSession.mode]}
        variant={modeVariant(authSession.mode)}
      />
    </div>
  );
}
