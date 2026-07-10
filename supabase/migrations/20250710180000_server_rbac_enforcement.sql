-- Douglas AI Platform — Server-side RBAC enforcement foundation
-- Sprint 5.42 — helpers + políticas (NÃO aplicar automaticamente em remoto)
--
-- Alinhado a @douglas/security ROLE_PERMISSIONS e operator_role_permissions.
-- Requer migrations anteriores (platform_helpers, operator_profiles, audit entries).

-- ---------------------------------------------------------------------------
-- Helpers — auth.uid() + operator_profiles ativos
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_operator_profile()
RETURNS public.operator_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT op.*
  FROM public.operator_profiles op
  WHERE op.user_id = auth.uid()
    AND op.status = 'active'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.current_operator_profile IS
  'Retorna row de operator_profiles ativo para auth.uid(). NULL se ausente/inativo.';

CREATE OR REPLACE FUNCTION public.require_active_operator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.operator_profiles op
    WHERE op.user_id = auth.uid()
      AND op.status = 'active'
  );
$$;

COMMENT ON FUNCTION public.require_active_operator IS
  'True quando auth.uid() possui operator_profiles com status active.';

CREATE OR REPLACE FUNCTION public.operator_has_permission(permission_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.operator_profiles op
    INNER JOIN public.operator_role_permissions orp
      ON orp.role = op.role
    WHERE op.user_id = auth.uid()
      AND op.status = 'active'
      AND orp.permission = permission_name
  );
$$;

COMMENT ON FUNCTION public.operator_has_permission IS
  'Verifica permissão via operator_profiles ativo + operator_role_permissions. Ignora payload do client.';

-- Endurece current_operator_role: prioriza profile ativo (comportamento existente preservado)
CREATE OR REPLACE FUNCTION public.current_operator_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_role text;
  jwt_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT op.role::text
  INTO profile_role
  FROM public.operator_profiles op
  WHERE op.user_id = auth.uid()
    AND op.status = 'active'
  LIMIT 1;

  IF profile_role IS NOT NULL THEN
    RETURN profile_role;
  END IF;

  -- Profile inativo/ausente: sem role operacional (não promover via JWT para RLS)
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.current_operator_role IS
  'Role operacional de operator_profiles ativo. NULL se inativo/ausente — Sprint 5.42.';

-- ---------------------------------------------------------------------------
-- operator_role_permissions — defense in depth (anon negado explicitamente)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operator_role_permissions'
      AND policyname = 'operator_role_permissions_deny_anon'
  ) THEN
    CREATE POLICY "operator_role_permissions_deny_anon"
      ON public.operator_role_permissions
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- operator_profiles — leitura admin exige profile ativo + permissão platform:view
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "operator_profiles_select_admin" ON public.operator_profiles;

CREATE POLICY "operator_profiles_select_admin"
  ON public.operator_profiles
  FOR SELECT
  TO authenticated
  USING (
    public.require_active_operator()
    AND public.operator_has_permission('platform:view')
    AND public.has_platform_role(ARRAY['owner', 'admin'])
  );

-- SELECT own: permite ver perfil próprio (inclusive invited/suspended para UI)
-- UPDATE/INSERT/DELETE inalterados — exigem has_platform_role existente

DROP POLICY IF EXISTS "operator_profiles_update_own_limited" ON public.operator_profiles;

CREATE POLICY "operator_profiles_update_own_limited"
  ON public.operator_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'active'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'active'
    AND role = (SELECT op.role FROM public.operator_profiles op WHERE op.id = operator_profiles.id)
  );

-- ---------------------------------------------------------------------------
-- operational_audit_entries — SELECT exige profile ativo + platform:view
-- INSERT continua negado para authenticated/anon (Edge Function via service_role)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "audit_entries_select_owner_admin" ON public.operational_audit_entries;

CREATE POLICY "audit_entries_select_owner_admin"
  ON public.operational_audit_entries
  FOR SELECT
  TO authenticated
  USING (
    public.require_active_operator()
    AND public.operator_has_permission('platform:view')
    AND public.can_read_full_audit_log()
  );

DROP POLICY IF EXISTS "audit_entries_select_operator_own" ON public.operational_audit_entries;

CREATE POLICY "audit_entries_select_operator_own"
  ON public.operational_audit_entries
  FOR SELECT
  TO authenticated
  USING (
    public.require_active_operator()
    AND public.current_operator_role() = 'operator'
    AND public.operator_has_permission('platform:view')
    AND actor_id = auth.uid()::text
  );

DROP POLICY IF EXISTS "audit_entries_select_viewer_limited" ON public.operational_audit_entries;

CREATE POLICY "audit_entries_select_viewer_limited"
  ON public.operational_audit_entries
  FOR SELECT
  TO authenticated
  USING (
    public.require_active_operator()
    AND public.current_operator_role() = 'viewer'
    AND public.operator_has_permission('platform:view')
    AND severity IN ('info', 'warning')
  );

-- Viewer write administrativo: negado via INSERT policies existentes (WITH CHECK false)

-- ---------------------------------------------------------------------------
-- Grants — funções invocáveis por authenticated (RLS usa SECURITY DEFINER)
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.current_operator_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.require_active_operator() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.operator_has_permission(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_operator_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.require_active_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.operator_has_permission(text) TO authenticated;
