import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  OWNER_EXCLUSIVE_PERMISSIONS,
  ROLE_PERMISSIONS,
  roleHasOwnerExclusivePermission,
} from "../../packages/security/src/Permission.ts";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

function check(
  id: keyof typeof RELEASE_READINESS_CHECK_LABELS,
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
  options: { blocking?: boolean; docPath?: string } = {},
): ReleaseReadinessCheck {
  return {
    id,
    label: RELEASE_READINESS_CHECK_LABELS[id],
    outcome,
    message,
    blocking: options.blocking ?? true,
    docPath: options.docPath,
  };
}

export function checkOwnerAdminSeparation(repoRoot: string): ReleaseReadinessCheck {
  const docPath = "docs/security/owner-admin-separation.md";

  if (OWNER_EXCLUSIVE_PERMISSIONS.length === 0) {
    return check(
      "owner_admin_separation_verified",
      "fail",
      "OWNER_EXCLUSIVE_PERMISSIONS está vazio — owner ≡ admin.",
      { docPath },
    );
  }

  if (ROLE_PERMISSIONS.owner.length <= ROLE_PERMISSIONS.admin.length) {
    return check(
      "owner_admin_separation_verified",
      "fail",
      "Owner não possui mais permissões que admin no catálogo.",
      { docPath },
    );
  }

  for (const permission of OWNER_EXCLUSIVE_PERMISSIONS) {
    if (ROLE_PERMISSIONS.admin.includes(permission)) {
      return check(
        "owner_admin_separation_verified",
        "fail",
        `Admin possui permissão exclusiva do owner: ${permission}.`,
        { docPath },
      );
    }
  }

  if (roleHasOwnerExclusivePermission("admin")) {
    return check(
      "owner_admin_separation_verified",
      "fail",
      "Admin reporta permissões owner-exclusive.",
      { docPath },
    );
  }

  return check(
    "owner_admin_separation_verified",
    "pass",
    `${OWNER_EXCLUSIVE_PERMISSIONS.length} permissões exclusivas do owner definidas.`,
    { docPath },
  );
}

export function checkInactiveProfileGuardPresent(repoRoot: string): ReleaseReadinessCheck {
  const policyPath = join(repoRoot, "packages/supabase/src/auth/OperatorFallbackPolicy.ts");
  const resolverPath = join(repoRoot, "packages/supabase/src/auth/EffectiveOperatorResolver.ts");
  const docPath = "docs/security/inactive-profile-guard.md";

  if (!existsSync(policyPath) || !existsSync(resolverPath)) {
    return check(
      "inactive_profile_guard_present",
      "fail",
      "Arquivos de handoff ausentes.",
      { docPath },
    );
  }

  const policySource = readFileSync(policyPath, "utf8");
  const resolverSource = readFileSync(resolverPath, "utf8");

  const requiredMarkers = [
    "authenticated_with_active_profile",
    "authenticated_with_inactive_profile",
    "blocked_by_profile_status",
    "isActiveOperatorProfile",
  ];

  const missing = requiredMarkers.filter((marker) => !policySource.includes(marker));
  if (missing.length > 0) {
    return check(
      "inactive_profile_guard_present",
      "fail",
      `OperatorFallbackPolicy incompleto: ${missing.join(", ")}.`,
      { docPath },
    );
  }

  if (!resolverSource.includes("authenticated_with_active_profile")) {
    return check(
      "inactive_profile_guard_present",
      "fail",
      "EffectiveOperatorResolver não usa profile ativo.",
      { docPath },
    );
  }

  return check(
    "inactive_profile_guard_present",
    "pass",
    "Guard de profile inativo presente no handoff client-side.",
    { docPath },
  );
}

export function runOwnerAdminHandoffTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    ["exec", "vitest", "run", "packages/supabase/src/auth/auth-handoff.rbac.test.ts"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.status === 0) {
    return check(
      "owner_admin_handoff_tests_passing",
      "pass",
      "Testes owner/admin separation e inactive profile guard passaram.",
      { docPath: "docs/security/inactive-profile-guard.md" },
    );
  }

  const hint =
    (result.stderr ?? "").split("\n").slice(-6).join("\n").trim() ||
    (result.stdout ?? "").split("\n").slice(-6).join("\n").trim();

  return check(
    "owner_admin_handoff_tests_passing",
    "fail",
    `Testes auth-handoff falharam. ${hint}`,
    { docPath: "docs/security/inactive-profile-guard.md" },
  );
}
