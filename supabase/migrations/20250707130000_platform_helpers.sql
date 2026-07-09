-- Douglas AI Platform — helpers compartilhados (RLS, roles)
-- Sprint 5.20 — Schema & RLS foundation
-- Requer: Supabase Postgres + auth schema

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums / domínios de plataforma
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_operator_role') THEN
    CREATE TYPE public.platform_operator_role AS ENUM (
      'owner',
      'admin',
      'operator',
      'viewer'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_operator_status') THEN
    CREATE TYPE public.platform_operator_status AS ENUM (
      'active',
      'invited',
      'suspended'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_session_status') THEN
    CREATE TYPE public.platform_session_status AS ENUM (
      'active',
      'revoked',
      'expired'
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Role helpers — dependem de auth.uid() quando JWT presente
-- Prioridade: operator_profiles.role → app_metadata.role (documentado)
-- NUNCA usar raw_user_meta_data para autorização (Supabase security guidance)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_auth_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

COMMENT ON FUNCTION public.current_auth_user_id IS
  'Retorna auth.uid() da sessão JWT. NULL quando anônimo ou sem auth.';

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

  -- Fallback documentado: role em app_metadata (setado server-side no signup/admin)
  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';

  IF jwt_role IN ('owner', 'admin', 'operator', 'viewer') THEN
    RETURN jwt_role;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.current_operator_role IS
  'Resolve role operacional. Usa operator_profiles primeiro; fallback app_metadata.role. Requer auth.uid().';

CREATE OR REPLACE FUNCTION public.has_platform_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_operator_role() = ANY (allowed_roles);
$$;

COMMENT ON FUNCTION public.has_platform_role IS
  'True quando current_operator_role() está em allowed_roles. Depende de auth.uid().';

CREATE OR REPLACE FUNCTION public.can_read_full_audit_log()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.has_platform_role(ARRAY['owner', 'admin']);
$$;

COMMENT ON FUNCTION public.can_read_full_audit_log IS
  'Owner/admin leem audit log completo. Depende de auth.uid() + role.';

CREATE OR REPLACE FUNCTION public.can_read_limited_audit_log()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.has_platform_role(ARRAY['operator', 'viewer']);
$$;

COMMENT ON FUNCTION public.can_read_limited_audit_log IS
  'Operator/viewer — leitura limitada (policies futuras). Depende de auth.uid().';

-- ---------------------------------------------------------------------------
-- Permissões de referência (roles → permissions) — espelho de @douglas/security
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operator_role_permissions (
  role public.platform_operator_role NOT NULL,
  permission text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission)
);

COMMENT ON TABLE public.operator_role_permissions IS
  'Mapa estático role → permission. Somente leitura via client; escrita via migrations/service.';

ALTER TABLE public.operator_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_role_permissions_select_authenticated"
  ON public.operator_role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Sem INSERT/UPDATE/DELETE para authenticated — mutações via service_role / migrations

INSERT INTO public.operator_role_permissions (role, permission, description) VALUES
  ('owner', 'platform:view', 'Visualizar plataforma'),
  ('owner', 'runtime:refresh', 'Refresh de módulo'),
  ('owner', 'runtime:health_check', 'Health check'),
  ('owner', 'runtime:pause', 'Pausar módulo'),
  ('owner', 'runtime:resume', 'Retomar módulo'),
  ('owner', 'runtime:restart', 'Reiniciar módulo'),
  ('admin', 'platform:view', 'Visualizar plataforma'),
  ('admin', 'runtime:refresh', 'Refresh de módulo'),
  ('admin', 'runtime:health_check', 'Health check'),
  ('admin', 'runtime:pause', 'Pausar módulo'),
  ('admin', 'runtime:resume', 'Retomar módulo'),
  ('admin', 'runtime:restart', 'Reiniciar módulo'),
  ('operator', 'platform:view', 'Visualizar plataforma'),
  ('operator', 'runtime:refresh', 'Refresh de módulo'),
  ('operator', 'runtime:health_check', 'Health check'),
  ('viewer', 'platform:view', 'Visualizar plataforma')
ON CONFLICT (role, permission) DO NOTHING;
