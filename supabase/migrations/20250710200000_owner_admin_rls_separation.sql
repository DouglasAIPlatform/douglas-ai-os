-- Douglas AI Platform — Owner/Admin RLS separation
-- Sprint 5.45 — diferencia owner e admin em policies de operator_profiles
-- NÃO aplicar automaticamente em remoto.
--
-- Depende de: platform_helpers, server_rbac_enforcement, owner_permission_seed

-- ---------------------------------------------------------------------------
-- Helpers — owner-exclusive via operator_has_permission (auth.uid() indireto)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_promote_to_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.require_active_operator()
    AND public.operator_has_permission('security:manage_owners');
$$;

COMMENT ON FUNCTION public.can_promote_to_owner IS
  'True quando profile ativo possui security:manage_owners — promover/conceder owner.';

CREATE OR REPLACE FUNCTION public.can_manage_operational_roles()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.require_active_operator()
    AND public.operator_has_permission('security:manage_roles');
$$;

COMMENT ON FUNCTION public.can_manage_operational_roles IS
  'True quando profile ativo possui security:manage_roles — gestão operacional de roles.';

CREATE OR REPLACE FUNCTION public.is_active_admin_operator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.require_active_operator()
    AND public.current_operator_role() = 'admin'
    AND public.operator_has_permission('platform:view');
$$;

COMMENT ON FUNCTION public.is_active_admin_operator IS
  'Admin com profile active — sem permissões owner-exclusive.';

-- Audit read: owner e admin compartilham leitura completa (não owner-exclusive)
CREATE OR REPLACE FUNCTION public.can_read_full_audit_log()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.require_active_operator()
    AND public.operator_has_permission('platform:view')
    AND public.current_operator_role() = ANY (ARRAY['owner', 'admin']::text[]);
$$;

COMMENT ON FUNCTION public.can_read_full_audit_log IS
  'Leitura completa de audit — profile active + platform:view + owner/admin. Sprint 5.45.';

-- ---------------------------------------------------------------------------
-- operator_profiles — substituir policies owner≡admin perigosas
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "operator_profiles_select_admin" ON public.operator_profiles;

CREATE POLICY "operator_profiles_select_owner_managed"
  ON public.operator_profiles
  FOR SELECT
  TO authenticated
  USING (
    public.can_manage_operational_roles()
    AND public.operator_has_permission('platform:view')
  );

CREATE POLICY "operator_profiles_select_admin_managed"
  ON public.operator_profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_active_admin_operator()
    AND operator_profiles.role IN ('operator', 'viewer')
  );

DROP POLICY IF EXISTS "operator_profiles_insert_admin" ON public.operator_profiles;

CREATE POLICY "operator_profiles_insert_owner"
  ON public.operator_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.require_active_operator()
    AND (
      (
        role = 'owner'::public.platform_operator_role
        AND public.can_promote_to_owner()
      )
      OR (
        role <> 'owner'::public.platform_operator_role
        AND public.can_manage_operational_roles()
      )
    )
  );

CREATE POLICY "operator_profiles_insert_admin"
  ON public.operator_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_active_admin_operator()
    AND role IN ('operator'::public.platform_operator_role, 'viewer'::public.platform_operator_role)
  );

DROP POLICY IF EXISTS "operator_profiles_update_admin" ON public.operator_profiles;

CREATE POLICY "operator_profiles_update_owner"
  ON public.operator_profiles
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_operational_roles())
  WITH CHECK (
    public.require_active_operator()
    AND public.can_manage_operational_roles()
    AND (
      role <> 'owner'::public.platform_operator_role
      OR public.can_promote_to_owner()
    )
  );

CREATE POLICY "operator_profiles_update_admin"
  ON public.operator_profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_active_admin_operator()
    AND operator_profiles.role IN ('operator'::public.platform_operator_role, 'viewer'::public.platform_operator_role)
  )
  WITH CHECK (
    public.is_active_admin_operator()
    AND role IN ('operator'::public.platform_operator_role, 'viewer'::public.platform_operator_role)
  );

DROP POLICY IF EXISTS "operator_profiles_delete_owner" ON public.operator_profiles;

CREATE POLICY "operator_profiles_delete_owner"
  ON public.operator_profiles
  FOR DELETE
  TO authenticated
  USING (
    public.require_active_operator()
    AND (
      (
        operator_profiles.role = 'owner'::public.platform_operator_role
        AND public.can_promote_to_owner()
      )
      OR (
        operator_profiles.role <> 'owner'::public.platform_operator_role
        AND public.can_manage_operational_roles()
      )
    )
  );

-- operator_profiles_update_own_limited e operator_profiles_select_own — inalterados (5.42)
-- operator_role_permissions — deny anon preservado (5.42)
-- operational_audit_entries — INSERT negado; SELECT via can_read_full_audit_log() atualizado

-- ---------------------------------------------------------------------------
-- Grants — funções invocáveis por authenticated
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.can_promote_to_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_operational_roles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_admin_operator() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_promote_to_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_operational_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_admin_operator() TO authenticated;
