/** Revisão estática da migration mission_executions — Sprint 5.54 (read-only). */

export interface MissionPersistenceMigrationReviewItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface MissionPersistenceMigrationReview {
  migrationFile: string;
  passed: boolean;
  items: MissionPersistenceMigrationReviewItem[];
  checkedAt: string;
}

const REQUIRED_MARKERS: Array<{ id: string; label: string; pattern: string | RegExp }> = [
  { id: "table_executions", label: "Tabela mission_executions", pattern: "mission_executions" },
  { id: "table_events", label: "Tabela mission_execution_events", pattern: "mission_execution_events" },
  { id: "rls_enabled", label: "RLS habilitado", pattern: "ENABLE ROW LEVEL SECURITY" },
  { id: "anon_denied", label: "Anon bloqueado", pattern: "mission_executions_deny_anon" },
  { id: "viewer_read_only", label: "Viewer sem escrita", pattern: "current_operator_role() <> 'viewer'" },
  { id: "inactive_blocked", label: "Profile inativo bloqueado", pattern: "require_active_operator()" },
  { id: "operational_diagnostic", label: "operational_diagnostic permitido", pattern: "'operational_diagnostic'" },
  { id: "release_readiness_review", label: "release_readiness_review permitido", pattern: "'release_readiness_review'" },
  { id: "is_operational_mission_type", label: "is_operational_mission_type()", pattern: "is_operational_mission_type" },
  { id: "terminal_guard", label: "Terminal overwrite guard", pattern: "guard_mission_execution_terminal_overwrite" },
  { id: "progress_check", label: "Progresso 0–100", pattern: "progress >= 0 AND progress <= 100" },
  { id: "attempt_check", label: "attempt >= 1", pattern: "attempt >= 1" },
  { id: "event_unique", label: "Eventos únicos por sequence", pattern: "execution_id, sequence" },
  { id: "events_insert_only", label: "Events update negado", pattern: "mission_execution_events_update_denied" },
  { id: "delete_denied", label: "Delete negado", pattern: "mission_executions_delete_denied" },
  { id: "indexes", label: "Índices presentes", pattern: "CREATE INDEX" },
];

function markerPassed(content: string, pattern: string | RegExp): boolean {
  return typeof pattern === "string" ? content.includes(pattern) : pattern.test(content);
}

/** Revisa conteúdo SQL da migration sem conectar ao banco. */
export function reviewMissionPersistenceMigration(
  sqlContent: string,
  migrationFile = "20250710210000_mission_executions.sql",
): MissionPersistenceMigrationReview {
  const permissive = /USING\s*\(\s*true\s*\)/i.test(sqlContent)
    || /WITH CHECK\s*\(\s*true\s*\)/i.test(sqlContent);

  const items: MissionPersistenceMigrationReviewItem[] = REQUIRED_MARKERS.map((marker) => ({
    id: marker.id,
    label: marker.label,
    passed: markerPassed(sqlContent, marker.pattern),
    detail: markerPassed(sqlContent, marker.pattern) ? "Presente na migration." : "Marcador ausente.",
  }));

  items.push({
    id: "no_permissive_policies",
    label: "Sem policies permissivas (USING true)",
    passed: !permissive,
    detail: permissive ? "Policy permissiva detectada." : "Nenhuma policy USING(true).",
  });

  items.push({
    id: "owner_admin_write",
    label: "Admin/owner alinhados ao catálogo",
    passed:
      sqlContent.includes("current_operator_role() IN ('owner', 'admin')")
      && sqlContent.includes("is_operational_mission_type"),
    detail: "Escrita owner/admin + operator com missões operacionais.",
  });

  return {
    migrationFile,
    passed: items.every((item) => item.passed),
    items,
    checkedAt: new Date().toISOString(),
  };
}
