import type { AuthOperatorHandoffState, AuthRole, OperatorRoleSource } from "../AuthTypes";
import type { EffectiveOperatorResolution } from "../EffectiveOperatorResolver";

/** Snapshot estável do estado relevante para handoff idempotente. */
export interface HandoffStateSnapshot {
  handoffState: AuthOperatorHandoffState;
  userId: string | null;
  operatorId: string | null;
  effectiveRole: AuthRole;
  authProfileRole: AuthRole | null;
  operatorSource: OperatorRoleSource;
}

export function createHandoffStateSnapshot(
  resolution: Pick<
    EffectiveOperatorResolution,
    | "handoffState"
    | "effectiveRole"
    | "authProfileRole"
    | "operatorSource"
    | "operatorOverride"
  >,
  userId?: string | null,
): HandoffStateSnapshot {
  return {
    handoffState: resolution.handoffState,
    userId: userId ?? null,
    operatorId: resolution.operatorOverride?.id ?? null,
    effectiveRole: resolution.effectiveRole,
    authProfileRole: resolution.authProfileRole,
    operatorSource: resolution.operatorSource,
  };
}

export function handoffSnapshotFingerprint(snapshot: HandoffStateSnapshot): string {
  return [
    snapshot.handoffState,
    snapshot.userId ?? "",
    snapshot.operatorId ?? "",
    snapshot.effectiveRole,
    snapshot.authProfileRole ?? "",
    snapshot.operatorSource,
  ].join(":");
}

export function handoffSnapshotsEqual(
  left: HandoffStateSnapshot,
  right: HandoffStateSnapshot,
): boolean {
  return handoffSnapshotFingerprint(left) === handoffSnapshotFingerprint(right);
}
