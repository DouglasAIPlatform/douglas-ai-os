-- Douglas AI Platform — operational_audit_entries
-- Persistência do Operational Audit Log (@douglas/audit)

CREATE TABLE IF NOT EXISTS public.operational_audit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  actor_id text,
  actor_name text NOT NULL DEFAULT 'unknown',
  actor_role text NOT NULL DEFAULT 'viewer',
  source text NOT NULL,
  action text NOT NULL,
  target text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info',
  message text NOT NULL DEFAULT '',
  correlation_id text,
  request_id text,
  audit_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_audit_entries_severity_check
    CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

CREATE INDEX IF NOT EXISTS operational_audit_entries_timestamp_idx
  ON public.operational_audit_entries (timestamp DESC);

CREATE INDEX IF NOT EXISTS operational_audit_entries_actor_id_idx
  ON public.operational_audit_entries (actor_id);

CREATE INDEX IF NOT EXISTS operational_audit_entries_audit_id_idx
  ON public.operational_audit_entries (audit_id)
  WHERE audit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS operational_audit_entries_correlation_id_idx
  ON public.operational_audit_entries (correlation_id)
  WHERE correlation_id IS NOT NULL;

COMMENT ON TABLE public.operational_audit_entries IS
  'Operational Audit Log — espelho persistido de AuditEntry (@douglas/audit).';

COMMENT ON COLUMN public.operational_audit_entries.audit_id IS
  'ID estável da aplicação (ex: op-audit-123). id uuid é gerado pelo banco.';

COMMENT ON COLUMN public.operational_audit_entries.actor_id IS
  'Identificador do ator (futuro: auth.uid()::text ou operator id).';

ALTER TABLE public.operational_audit_entries ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- SELECT policies — dependem de auth.uid() via current_operator_role()
-- ---------------------------------------------------------------------------

-- Owner/admin: leitura completa
CREATE POLICY "audit_entries_select_owner_admin"
  ON public.operational_audit_entries
  FOR SELECT
  TO authenticated
  USING (public.can_read_full_audit_log());

-- Operator: leitura dos próprios logs (actor_id = auth.uid()::text)
-- Expansão futura: logs do departamento/time
CREATE POLICY "audit_entries_select_operator_own"
  ON public.operational_audit_entries
  FOR SELECT
  TO authenticated
  USING (
    public.current_operator_role() = 'operator'
    AND actor_id = auth.uid()::text
  );

-- Viewer: leitura limitada — severidade info/warning apenas (ajustável futuramente)
CREATE POLICY "audit_entries_select_viewer_limited"
  ON public.operational_audit_entries
  FOR SELECT
  TO authenticated
  USING (
    public.current_operator_role() = 'viewer'
    AND severity IN ('info', 'warning')
  );

-- ---------------------------------------------------------------------------
-- INSERT — preparado para service_role / Edge Function / server futuro
-- Client browser (anon/authenticated) NÃO insere diretamente nesta fase.
-- service_role bypassa RLS automaticamente no Supabase.
-- ---------------------------------------------------------------------------

-- Policy explícita negando INSERT via JWT autenticado (defense in depth)
CREATE POLICY "audit_entries_insert_denied_authenticated"
  ON public.operational_audit_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "audit_entries_insert_denied_anon"
  ON public.operational_audit_entries
  FOR INSERT
  TO anon
  WITH CHECK (false);

-- UPDATE/DELETE negados — audit log append-only
CREATE POLICY "audit_entries_update_denied"
  ON public.operational_audit_entries
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "audit_entries_delete_denied"
  ON public.operational_audit_entries
  FOR DELETE
  TO authenticated
  USING (false);
