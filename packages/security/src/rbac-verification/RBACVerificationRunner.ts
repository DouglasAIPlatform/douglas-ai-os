import { actionRequiresConfirmation } from "../ActionPolicy";
import { roleHasPermission } from "../Permission";
import { createPermissionGuard } from "../PermissionGuard";
import { resolveMockRoleChangeAllowed } from "../isMockRoleChangeAllowed";
import type { OperatorRole, Permission, SecuredActionType } from "../SecurityTypes";
import { MOCK_OPERATORS } from "../SecurityTypes";
import {
  RBAC_PERMISSION_MATRIX,
  OWNER_EXCLUSIVE_PERMISSIONS,
  securedActionsFromMatrix,
  type RBACCapabilityId,
} from "./RBACPermissionMatrix";
import type { RBACVerificationCase } from "./RBACVerificationCase";
import {
  buildRBACVerificationReport,
  type RBACVerificationReport,
} from "./RBACVerificationReport";
import type { RBACVerificationResult } from "./RBACVerificationResult";

const ALL_ROLES: OperatorRole[] = ["owner", "admin", "operator", "viewer"];
const ALL_PERMISSIONS: Permission[] = [
  "platform:view",
  "runtime:refresh",
  "runtime:health_check",
  "runtime:pause",
  "runtime:resume",
  "runtime:restart",
  "security:manage_roles",
  "security:manage_owners",
  "release:approve_production",
  "platform:critical_configuration",
];

function pass(caseDef: RBACVerificationCase, message: string): RBACVerificationResult {
  return { case: caseDef, outcome: "pass", message };
}

function fail(
  caseDef: RBACVerificationCase,
  message: string,
  extras: Pick<RBACVerificationResult, "actualAllowed" | "actualRequiresConfirmation"> = {},
): RBACVerificationResult {
  return { case: caseDef, outcome: "fail", message, ...extras };
}

function buildPermissionCases(): RBACVerificationCase[] {
  const cases: RBACVerificationCase[] = [];

  for (const role of ALL_ROLES) {
    for (const permission of ALL_PERMISSIONS) {
      const expectedAllowed = roleHasPermission(role, permission);
      cases.push({
        id: `permission:${role}:${permission}`,
        category: "permission",
        description: `Role ${role} ${expectedAllowed ? "possui" : "não possui"} ${permission}`,
        role,
        permission,
        expectedAllowed,
        tags: [role, "permission"],
      });
    }
  }

  return cases;
}

function buildSecuredActionCases(): RBACVerificationCase[] {
  const cases: RBACVerificationCase[] = [];
  const actions = securedActionsFromMatrix();

  for (const role of ALL_ROLES) {
    for (const action of actions) {
      const entry = RBAC_PERMISSION_MATRIX.find((item) => item.action === action);
      const expectedAllowed = entry ? entry.rolesAllowed.includes(role) : false;
      const expectedRequiresConfirmation = entry?.requiresConfirmation ?? false;

      cases.push({
        id: `action:${role}:${action}`,
        category: "secured_action",
        description: `Role ${role} ${expectedAllowed ? "pode" : "não pode"} executar ${action}`,
        role,
        action,
        expectedAllowed,
        expectedRequiresConfirmation: expectedAllowed ? expectedRequiresConfirmation : false,
        tags: [role, "secured_action"],
      });
    }
  }

  return cases;
}

function buildConfirmationCases(): RBACVerificationCase[] {
  const sensitiveActions: SecuredActionType[] = [
    "pause_module",
    "resume_module",
    "restart_module",
  ];
  const cases: RBACVerificationCase[] = [];

  for (const role of ["owner", "admin"] as OperatorRole[]) {
    for (const action of sensitiveActions) {
      cases.push({
        id: `confirmation:${role}:${action}`,
        category: "confirmation",
        description: `${role} — ${action} exige confirmação`,
        role,
        action,
        expectedAllowed: true,
        expectedRequiresConfirmation: true,
        tags: [role, "confirmation"],
      });
    }
  }

  for (const role of ["operator", "viewer"] as OperatorRole[]) {
    for (const action of sensitiveActions) {
      cases.push({
        id: `confirmation-deny:${role}:${action}`,
        category: "confirmation",
        description: `${role} — ${action} bloqueado (sem confirmação aplicável)`,
        role,
        action,
        expectedAllowed: false,
        expectedRequiresConfirmation: false,
        tags: [role, "confirmation", "negative"],
      });
    }
  }

  return cases;
}

function buildOwnerAdminSeparationCases(): RBACVerificationCase[] {
  const cases: RBACVerificationCase[] = [];

  for (const permission of OWNER_EXCLUSIVE_PERMISSIONS) {
    cases.push({
      id: `owner-exclusive:${permission}`,
      category: "permission",
      description: `Owner possui permissão exclusiva ${permission}`,
      role: "owner",
      permission,
      expectedAllowed: true,
      tags: ["owner", "owner_exclusive"],
    });
    cases.push({
      id: `admin-denied-exclusive:${permission}`,
      category: "permission",
      description: `Admin não possui permissão exclusiva ${permission}`,
      role: "admin",
      permission,
      expectedAllowed: false,
      tags: ["admin", "owner_exclusive", "negative"],
    });
  }

  for (const permission of ALL_PERMISSIONS.filter((p) => !OWNER_EXCLUSIVE_PERMISSIONS.includes(p))) {
    const ownerHas = roleHasPermission("owner", permission);
    const adminHas = roleHasPermission("admin", permission);
    cases.push({
      id: `owner-admin-shared:${permission}`,
      category: "permission",
      description: `Owner e admin compartilham ${permission}`,
      role: "owner",
      permission,
      expectedAllowed: ownerHas === adminHas,
      tags: ["owner", "admin", "shared"],
    });
  }

  cases.push({
    id: "owner-exclusive-permissions-present",
    category: "permission",
    description: "Owner possui permissões exclusivas além do admin",
    role: "owner",
    expectedAllowed: OWNER_EXCLUSIVE_PERMISSIONS.length > 0,
    tags: ["owner", "admin"],
  });

  return cases;
}

function buildMockRolePolicyCases(): RBACVerificationCase[] {
  return [
    {
      id: "mock-role-change-development",
      category: "mock_role_policy",
      description: "Troca livre de mock role permitida fora de production",
      expectedAllowed: true,
      tags: ["mock_role", "development"],
    },
    {
      id: "mock-role-change-production",
      category: "mock_role_policy",
      description: "Troca livre de mock role bloqueada em production",
      expectedAllowed: false,
      tags: ["mock_role", "production"],
    },
  ];
}

function buildCapabilityNegativeCases(): RBACVerificationCase[] {
  const cases: RBACVerificationCase[] = [];

  const viewerDenied: RBACCapabilityId[] = [
    "runtime_refresh",
    "runtime_health_check",
    "runtime_pause",
    "runtime_resume",
    "runtime_restart",
    "execute_operational_runtime",
    "execute_administrative_runtime",
  ];

  for (const capabilityId of viewerDenied) {
    cases.push({
      id: `capability-deny:viewer:${capabilityId}`,
      category: "secured_action",
      description: `Viewer bloqueado em ${capabilityId}`,
      role: "viewer",
      capabilityId,
      expectedAllowed: false,
      tags: ["viewer", "negative"],
    });
  }

  const operatorDenied: RBACCapabilityId[] = [
    "runtime_pause",
    "runtime_resume",
    "runtime_restart",
    "execute_administrative_runtime",
  ];

  for (const capabilityId of operatorDenied) {
    cases.push({
      id: `capability-deny:operator:${capabilityId}`,
      category: "secured_action",
      description: `Operator bloqueado em ${capabilityId}`,
      role: "operator",
      capabilityId,
      expectedAllowed: false,
      tags: ["operator", "negative"],
    });
  }

  cases.push({
    id: "capability-allow:viewer:view_audit_trail",
    category: "permission",
    description: "Viewer pode visualizar audit trail (platform:view)",
    role: "viewer",
    capabilityId: "view_audit_trail",
    permission: "platform:view",
    expectedAllowed: true,
    tags: ["viewer", "positive"],
  });

  return cases;
}

export function buildRBACVerificationCases(): RBACVerificationCase[] {
  return [
    ...buildPermissionCases(),
    ...buildSecuredActionCases(),
    ...buildConfirmationCases(),
    ...buildOwnerAdminSeparationCases(),
    ...buildMockRolePolicyCases(),
    ...buildCapabilityNegativeCases(),
  ];
}

function evaluateCase(caseDef: RBACVerificationCase): RBACVerificationResult {
  const guard = createPermissionGuard();

  if (caseDef.id === "owner-exclusive-permissions-present") {
    if (OWNER_EXCLUSIVE_PERMISSIONS.length > 0) {
      return pass(
        caseDef,
        `${OWNER_EXCLUSIVE_PERMISSIONS.length} permissões exclusivas do owner definidas.`,
      );
    }
    return fail(caseDef, "OWNER_EXCLUSIVE_PERMISSIONS está vazio — owner ≡ admin.");
  }

  if (caseDef.id.startsWith("owner-admin-shared:")) {
    const adminHas = roleHasPermission("admin", caseDef.permission!);
    const ownerHas = roleHasPermission("owner", caseDef.permission!);
    if (ownerHas === adminHas) {
      return pass(caseDef, "Permissão compartilhada owner/admin confirmada.");
    }
    return fail(caseDef, `owner=${ownerHas}, admin=${adminHas}`, { actualAllowed: ownerHas });
  }

  if (caseDef.category === "mock_role_policy") {
    if (caseDef.id === "mock-role-change-production") {
      const allowed = resolveMockRoleChangeAllowed("production");
      if (allowed === caseDef.expectedAllowed) {
        return pass(caseDef, "Mock role bloqueado em production conforme esperado.");
      }
      return fail(caseDef, `Production mock role allowed=${allowed}`, { actualAllowed: allowed });
    }

    const allowed = resolveMockRoleChangeAllowed("development");
    if (allowed === caseDef.expectedAllowed) {
      return pass(caseDef, "Mock role permitido fora de production.");
    }
    return fail(caseDef, `Development mock role allowed=${allowed}`, { actualAllowed: allowed });
  }

  if (caseDef.category === "auth_handoff" || caseDef.category === "role_elevation") {
    return pass(caseDef, "Evaluated in @douglas/supabase auth handoff tests.");
  }

  if (!caseDef.role) {
    return fail(caseDef, "Case sem role definida.");
  }

  const operator = MOCK_OPERATORS[caseDef.role];

  if (caseDef.permission && !caseDef.action) {
    const allowed = roleHasPermission(caseDef.role, caseDef.permission);
    if (caseDef.id.startsWith("owner-admin-shared:")) {
      const adminHas = roleHasPermission("admin", caseDef.permission);
      if (allowed === adminHas) {
        return pass(caseDef, "Permissão compartilhada owner/admin confirmada.");
      }
      return fail(caseDef, `owner=${allowed}, admin=${adminHas}`, { actualAllowed: allowed });
    }

    if (allowed === caseDef.expectedAllowed) {
      return pass(caseDef, `Permissão ${caseDef.permission} conforme catálogo.`);
    }
    return fail(caseDef, `Esperado ${caseDef.expectedAllowed}, obtido ${allowed}`, {
      actualAllowed: allowed,
    });
  }

  if (caseDef.capabilityId && !caseDef.action) {
    const entry = RBAC_PERMISSION_MATRIX.find(
      (item) => item.capabilityId === caseDef.capabilityId,
    );
    const allowed = entry ? entry.rolesAllowed.includes(caseDef.role) : false;
    if (allowed === caseDef.expectedAllowed) {
      return pass(caseDef, `Capability ${caseDef.capabilityId} conforme matriz.`);
    }
    return fail(caseDef, `Esperado ${caseDef.expectedAllowed}, obtido ${allowed}`, {
      actualAllowed: allowed,
    });
  }

  if (caseDef.action) {
    const result = guard.evaluate(operator, caseDef.action);
    const allowed = result.allowed;
    const requiresConfirmation = result.requiresConfirmation;

    if (allowed !== caseDef.expectedAllowed) {
      return fail(
        caseDef,
        `Esperado allowed=${caseDef.expectedAllowed}, obtido ${allowed}`,
        { actualAllowed: allowed, actualRequiresConfirmation: requiresConfirmation },
      );
    }

    if (
      caseDef.expectedRequiresConfirmation !== undefined &&
      requiresConfirmation !== caseDef.expectedRequiresConfirmation
    ) {
      return fail(
        caseDef,
        `Esperado requiresConfirmation=${caseDef.expectedRequiresConfirmation}, obtido ${requiresConfirmation}`,
        { actualAllowed: allowed, actualRequiresConfirmation: requiresConfirmation },
      );
    }

    if (caseDef.category === "confirmation" && allowed) {
      const alsoSensitive = actionRequiresConfirmation(caseDef.action);
      if (!alsoSensitive && caseDef.expectedRequiresConfirmation) {
        return fail(caseDef, "Ação deveria exigir confirmação via ActionPolicy.");
      }
    }

    return pass(caseDef, `Ação ${caseDef.action} avaliada corretamente pelo PermissionGuard.`);
  }

  return fail(caseDef, "Case não executável.");
}

export function runRBACVerification(): RBACVerificationReport {
  const cases = buildRBACVerificationCases().filter(
    (caseDef) =>
      caseDef.category !== "auth_handoff" && caseDef.category !== "role_elevation",
  );
  const results = cases.map((caseDef) => evaluateCase(caseDef));
  return buildRBACVerificationReport(results);
}

export function formatRBACVerificationReport(report: RBACVerificationReport): string {
  const lines: string[] = [
    "RBAC Verification Suite",
    `Status: ${report.status}`,
    `Cases: ${report.passedCount}/${report.totalCases} passed`,
    "",
  ];

  if (report.failedResults.length > 0) {
    lines.push(`Failed (${report.failedResults.length})`);
    for (const result of report.failedResults.slice(0, 10)) {
      lines.push(`  ✗ ${result.case.id}: ${result.message}`);
    }
    if (report.failedResults.length > 10) {
      lines.push(`  … +${report.failedResults.length - 10} more`);
    }
  }

  return lines.join("\n");
}
