-- Douglas AI Platform — mission_executions + mission_execution_events
-- Sprint 5.50 — persistência de execuções de missão com RLS
-- NÃO aplicar automaticamente em remoto.
--
-- Depende de: platform_helpers, operator_profiles, server_rbac_enforcement

-- ---------------------------------------------------------------------------
-- Helpers — leitura/escrita alinhados a @douglas/missions MissionExecutionAccessPolicy
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_operational_mission_type(mission_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT mission_type IN (
    'operational_diagnostic',
    'release_readiness_review'
  );
$$;

COMMENT ON FUNCTION public.is_operational_mission_type IS
  'Missões operacionais persistíveis para role operator — alinhado a @douglas/missions PERSISTABLE_MISSION_TYPES.';

CREATE OR REPLACE FUNCTION public.can_read_mission_execution_row(
  p_mission_type text,
  p_created_by_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.require_active_operator()
    AND public.operator_has_permission('platform:view')
    AND (
      public.current_operator_role() IN ('owner', 'admin')
      OR (
        public.current_operator_role() = 'viewer'
      )
      OR (
        public.current_operator_role() = 'operator'
        AND (
          p_created_by_user_id = auth.uid()
          OR public.is_operational_mission_type(p_mission_type)
        )
      )
    );
$$;

COMMENT ON FUNCTION public.can_read_mission_execution_row IS
  'Leitura de execução — profile active, platform:view, regras por role. Sprint 5.50.';

CREATE OR REPLACE FUNCTION public.can_write_mission_execution_row(
  p_mission_type text,
  p_created_by_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.require_active_operator()
    AND public.current_operator_role() <> 'viewer'
    AND (
      public.current_operator_role() IN ('owner', 'admin')
      OR (
        public.current_operator_role() = 'operator'
        AND p_created_by_user_id = auth.uid()
        AND public.is_operational_mission_type(p_mission_type)
      )
    );
$$;

COMMENT ON FUNCTION public.can_write_mission_execution_row IS
  'Escrita de execução — operator apenas missões operacionais próprias; admin/owner ampliado.';

-- ---------------------------------------------------------------------------
-- mission_executions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mission_executions (
  execution_id text PRIMARY KEY,
  mission_id text NOT NULL,
  mission_type text NOT NULL,
  attempt integer NOT NULL DEFAULT 1,
  status text NOT NULL,
  board_status text,
  progress integer NOT NULL DEFAULT 0,
  assigned_agent_id text,
  created_by text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  operator_profile_id uuid REFERENCES public.operator_profiles (id) ON DELETE SET NULL,
  correlation_id text,
  request_id text,
  result_summary text,
  sanitized_error_code text,
  sanitized_error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mission_executions_attempt_check CHECK (attempt >= 1),
  CONSTRAINT mission_executions_progress_check CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT mission_executions_status_check CHECK (
    status IN (
      'created', 'validated', 'planned', 'assigned', 'running',
      'completed', 'failed', 'cancelled', 'interrupted', 'recovery_required'
    )
  )
);

CREATE INDEX IF NOT EXISTS mission_executions_mission_id_idx
  ON public.mission_executions (mission_id);

CREATE INDEX IF NOT EXISTS mission_executions_assigned_agent_id_idx
  ON public.mission_executions (assigned_agent_id)
  WHERE assigned_agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS mission_executions_status_idx
  ON public.mission_executions (status);

CREATE INDEX IF NOT EXISTS mission_executions_created_at_idx
  ON public.mission_executions (created_at DESC);

CREATE INDEX IF NOT EXISTS mission_executions_created_by_user_id_idx
  ON public.mission_executions (created_by_user_id);

COMMENT ON TABLE public.mission_executions IS
  'Execuções de missão persistidas — resumo sanitizado, sem payload completo nem secrets.';

COMMENT ON COLUMN public.mission_executions.created_by IS
  'Identificador sanitizado do operador (não e-mail).';

COMMENT ON COLUMN public.mission_executions.created_by_user_id IS
  'auth.uid() no momento da criação — usado por RLS, não enviado pelo browser como role.';

-- ---------------------------------------------------------------------------
-- mission_execution_events (timeline)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mission_execution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id text NOT NULL REFERENCES public.mission_executions (execution_id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  event_type text NOT NULL,
  status text,
  progress integer,
  step text,
  summary text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mission_execution_events_sequence_check CHECK (sequence >= 1),
  CONSTRAINT mission_execution_events_progress_check CHECK (
    progress IS NULL OR (progress >= 0 AND progress <= 100)
  ),
  CONSTRAINT mission_execution_events_execution_sequence_unique UNIQUE (execution_id, sequence)
);

CREATE INDEX IF NOT EXISTS mission_execution_events_execution_id_idx
  ON public.mission_execution_events (execution_id, sequence ASC);

COMMENT ON TABLE public.mission_execution_events IS
  'Timeline ordenada de execução — summaries sanitizados, sem stack trace.';

-- ---------------------------------------------------------------------------
-- Guard — resultado terminal não sobrescrito silenciosamente
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_mission_execution_terminal_overwrite()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('completed', 'failed', 'cancelled') THEN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'mission_execution_terminal_immutable: status % cannot change to %',
          OLD.status, NEW.status
          USING ERRCODE = '23514';
      END IF;
      IF OLD.result_summary IS NOT NULL
         AND NEW.result_summary IS DISTINCT FROM OLD.result_summary THEN
        RAISE EXCEPTION 'mission_execution_result_immutable'
          USING ERRCODE = '23514';
      END IF;
    END IF;
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mission_executions_terminal_guard ON public.mission_executions;

CREATE TRIGGER mission_executions_terminal_guard
  BEFORE UPDATE ON public.mission_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_mission_execution_terminal_overwrite();

-- ---------------------------------------------------------------------------
-- RLS — mission_executions
-- ---------------------------------------------------------------------------

ALTER TABLE public.mission_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_executions_deny_anon"
  ON public.mission_executions
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "mission_executions_select_authenticated"
  ON public.mission_executions
  FOR SELECT
  TO authenticated
  USING (
    public.can_read_mission_execution_row(mission_type, created_by_user_id)
  );

CREATE POLICY "mission_executions_insert_authenticated"
  ON public.mission_executions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND public.can_write_mission_execution_row(mission_type, created_by_user_id)
    AND (
      operator_profile_id IS NULL
      OR operator_profile_id = (SELECT cp.id FROM public.current_operator_profile() cp)
    )
  );

CREATE POLICY "mission_executions_update_authenticated"
  ON public.mission_executions
  FOR UPDATE
  TO authenticated
  USING (
    created_by_user_id = auth.uid()
    AND public.can_write_mission_execution_row(mission_type, created_by_user_id)
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND public.can_write_mission_execution_row(mission_type, created_by_user_id)
  );

CREATE POLICY "mission_executions_delete_denied"
  ON public.mission_executions
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- RLS — mission_execution_events
-- ---------------------------------------------------------------------------

ALTER TABLE public.mission_execution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_execution_events_deny_anon"
  ON public.mission_execution_events
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "mission_execution_events_select_authenticated"
  ON public.mission_execution_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.mission_executions me
      WHERE me.execution_id = mission_execution_events.execution_id
        AND public.can_read_mission_execution_row(me.mission_type, me.created_by_user_id)
    )
  );

CREATE POLICY "mission_execution_events_insert_authenticated"
  ON public.mission_execution_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.mission_executions me
      WHERE me.execution_id = mission_execution_events.execution_id
        AND me.created_by_user_id = auth.uid()
        AND public.can_write_mission_execution_row(me.mission_type, me.created_by_user_id)
    )
  );

CREATE POLICY "mission_execution_events_update_denied"
  ON public.mission_execution_events
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "mission_execution_events_delete_denied"
  ON public.mission_execution_events
  FOR DELETE
  TO authenticated
  USING (false);
