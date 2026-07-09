const SYSTEM_ACTOR_LABELS: Record<string, string> = {
  runtime: "Runtime Engine",
  diagnostics: "Boot Diagnostics",
  "platform-state": "Platform State",
};

export interface ResolvedAuditActor {
  actor: string;
  role: string;
  actorId?: string;
}

export function resolveAuditActor(
  actorId: string | undefined,
  role: string,
  operatorName?: string,
): ResolvedAuditActor {
  if (actorId && operatorName) {
    return { actor: operatorName, role, actorId };
  }

  if (actorId && SYSTEM_ACTOR_LABELS[actorId]) {
    return { actor: SYSTEM_ACTOR_LABELS[actorId], role, actorId };
  }

  if (actorId) {
    return { actor: actorId, role, actorId };
  }

  return { actor: "system", role };
}
