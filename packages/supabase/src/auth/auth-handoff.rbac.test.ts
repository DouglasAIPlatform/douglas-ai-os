import { describe, expect, it } from "vitest";
import type { AuthProfile, AuthSessionState, AuthUser } from "./AuthTypes";
import { resolveEffectiveOperator } from "./EffectiveOperatorResolver";
import {
  resolveHandoffState,
  resolveOperatorRoleSource,
  shouldUseMockOperator,
} from "./OperatorFallbackPolicy";
import { mapAuthProfileToOperator } from "./OperatorProfileMapper";
import { createPermissionGuard } from "../../../security/src/PermissionGuard";
import { MOCK_OPERATORS } from "../../../security/src/SecurityTypes";

function sessionFixture(
  overrides: Partial<AuthSessionState> = {},
): AuthSessionState {
  return {
    status: "not_configured",
    mode: "mock",
    provider: "none",
    user: null,
    profile: null,
    authRole: null,
    error: null,
    ...overrides,
  };
}

function userFixture(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-001",
    email: "owner@example.com",
    ...overrides,
  };
}

function profileFixture(overrides: Partial<AuthProfile> = {}): AuthProfile {
  return {
    id: "profile-001",
    userId: "user-001",
    displayName: "Auth Owner",
    role: "owner",
    status: "active",
    ...overrides,
  };
}

describe("Auth → Operator Handoff RBAC (@douglas/supabase)", () => {
  const guard = createPermissionGuard();

  it("auth profile owner → effective operator owner", () => {
    const session = sessionFixture({
      status: "authenticated",
      provider: "supabase",
      mode: "authenticated",
      user: userFixture(),
      profile: profileFixture({ role: "owner" }),
    });

    const resolution = resolveEffectiveOperator(session, "viewer");
    expect(resolution.handoffState).toBe("authenticated_with_profile");
    expect(resolution.effectiveRole).toBe("owner");
    expect(resolution.isUsingMockOperator).toBe(false);
    expect(resolution.operatorSource).toBe("auth_profile");
    expect(resolution.operatorOverride?.role).toBe("owner");

    const operator = resolution.operatorOverride ?? MOCK_OPERATORS.viewer;
    expect(guard.evaluate(operator, "pause_module").allowed).toBe(true);
  });

  it("auth profile admin → effective operator admin", () => {
    const session = sessionFixture({
      status: "authenticated",
      provider: "supabase",
      mode: "authenticated",
      user: userFixture(),
      profile: profileFixture({ role: "admin", displayName: "Auth Admin" }),
    });

    const resolution = resolveEffectiveOperator(session, "viewer");
    expect(resolution.effectiveRole).toBe("admin");
    expect(resolution.operatorOverride?.role).toBe("admin");
    expect(guard.evaluate(resolution.operatorOverride!, "restart_module").allowed).toBe(true);
  });

  it("profile absent → mock fallback with viewer mock role", () => {
    const session = sessionFixture({
      status: "authenticated",
      provider: "supabase",
      mode: "authenticated",
      user: userFixture(),
      profile: null,
    });

    const resolution = resolveEffectiveOperator(session, "viewer");
    expect(resolution.handoffState).toBe("authenticated_without_profile");
    expect(resolution.isUsingMockOperator).toBe(true);
    expect(resolution.operatorSource).toBe("fallback");
    expect(resolution.effectiveRole).toBe("viewer");
    expect(resolution.showAuthMockWarning).toBe(true);
  });

  it("profile error → fallback to mock role", () => {
    const session = sessionFixture({
      status: "error",
      provider: "supabase",
      mode: "supabase_ready",
      user: userFixture(),
      profile: null,
      error: "profile_load_failed",
    });

    const handoff = resolveHandoffState(session);
    expect(handoff).toBe("profile_error");
    expect(shouldUseMockOperator(handoff)).toBe(true);
    expect(resolveOperatorRoleSource(handoff)).toBe("fallback");

    const resolution = resolveEffectiveOperator(session, "admin");
    expect(resolution.isUsingMockOperator).toBe(true);
    expect(resolution.effectiveRole).toBe("admin");
  });

  it("inactive profile still resolves auth profile on client (documented limitation)", () => {
    const session = sessionFixture({
      status: "authenticated",
      provider: "supabase",
      mode: "authenticated",
      user: userFixture(),
      profile: profileFixture({ role: "admin", status: "suspended" }),
    });

    const resolution = resolveEffectiveOperator(session, "viewer");
    expect(resolution.handoffState).toBe("authenticated_with_profile");
    expect(resolution.operatorOverride?.role).toBe("admin");
    expect(resolution.isUsingMockOperator).toBe(false);
  });

  it("mock role does not override active auth profile", () => {
    const session = sessionFixture({
      status: "authenticated",
      provider: "supabase",
      mode: "authenticated",
      user: userFixture(),
      profile: profileFixture({ role: "operator" }),
    });

    const resolution = resolveEffectiveOperator(session, "owner");
    expect(resolution.effectiveRole).toBe("operator");
    expect(resolution.operatorOverride).toEqual(
      mapAuthProfileToOperator(session.profile!, session.user!),
    );
    expect(resolution.operatorSource).toBe("auth_profile");

    const effective = resolution.operatorOverride!;
    expect(guard.evaluate(effective, "pause_module").allowed).toBe(false);
    expect(guard.evaluate(MOCK_OPERATORS.owner, "pause_module").allowed).toBe(true);
  });

  it("not configured supabase → mock operator source", () => {
    const session = sessionFixture({
      status: "not_configured",
      provider: "none",
    });

    const resolution = resolveEffectiveOperator(session, "admin");
    expect(resolution.handoffState).toBe("not_configured");
    expect(resolution.operatorSource).toBe("mock");
    expect(resolution.isUsingMockOperator).toBe(true);
  });

  it("viewer auth profile cannot execute operational runtime actions", () => {
    const session = sessionFixture({
      status: "authenticated",
      provider: "supabase",
      mode: "authenticated",
      user: userFixture(),
      profile: profileFixture({ role: "viewer" }),
    });

    const operator = resolveEffectiveOperator(session, "admin").operatorOverride!;
    expect(guard.evaluate(operator, "refresh_module").allowed).toBe(false);
    expect(guard.canView(operator)).toBe(true);
  });
});
