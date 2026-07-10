import type { AuthorizedOperator } from "./AuthorizedOperator.ts";

/** Identidade do ator definida server-side — não confia no payload do browser. */
export interface AuditActorResolution {
  actorId: string;
  actorName: string;
  actorRole: string;
}

export function resolveAuditActorFromOperator(
  operator: AuthorizedOperator,
): AuditActorResolution {
  return {
    actorId: operator.profileId,
    actorName: operator.displayName,
    actorRole: operator.role,
  };
}

/** Fallback dev (modo disabled/optional sem JWT) — usa payload, mas não eleva privilégios. */
export function resolveAuditActorFromPayload(payload: {
  actor: string;
  role: string;
  metadata: Record<string, unknown>;
}): AuditActorResolution {
  const operatorId =
    typeof payload.metadata.operatorId === "string" ? payload.metadata.operatorId : null;

  return {
    actorId: operatorId ?? payload.actor,
    actorName: payload.actor,
    actorRole: payload.role,
  };
}
