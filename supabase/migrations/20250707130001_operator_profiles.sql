-- Douglas AI Platform — operator_profiles
-- Perfil operacional vinculado a auth.users (Supabase Auth)

CREATE TABLE IF NOT EXISTS public.operator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role public.platform_operator_role NOT NULL DEFAULT 'viewer',
  status public.platform_operator_status NOT NULL DEFAULT 'invited',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operator_profiles_user_id_idx
  ON public.operator_profiles (user_id);

CREATE INDEX IF NOT EXISTS operator_profiles_role_idx
  ON public.operator_profiles (role);

COMMENT ON TABLE public.operator_profiles IS
  'Perfil operacional da plataforma. Substitui MOCK_OPERATORS quando auth estiver ativo.';

COMMENT ON COLUMN public.operator_profiles.user_id IS
  'FK para auth.users.id — requer auth.uid() na sessão.';

COMMENT ON COLUMN public.operator_profiles.role IS
  'Role operacional: owner | admin | operator | viewer — alinhado a @douglas/security.';

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS operator_profiles_set_updated_at ON public.operator_profiles;

CREATE TRIGGER operator_profiles_set_updated_at
  BEFORE UPDATE ON public.operator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.operator_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário lê o próprio perfil; owner/admin leem todos
CREATE POLICY "operator_profiles_select_own"
  ON public.operator_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "operator_profiles_select_admin"
  ON public.operator_profiles
  FOR SELECT
  TO authenticated
  USING (public.has_platform_role(ARRAY['owner', 'admin']));

-- UPDATE: usuário atualiza display_name/metadata próprios; owner/admin gerenciam roles
CREATE POLICY "operator_profiles_update_own_limited"
  ON public.operator_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND role = (SELECT op.role FROM public.operator_profiles op WHERE op.id = operator_profiles.id)
    AND status = (SELECT op.status FROM public.operator_profiles op WHERE op.id = operator_profiles.id)
  );

CREATE POLICY "operator_profiles_update_admin"
  ON public.operator_profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_platform_role(ARRAY['owner', 'admin']))
  WITH CHECK (public.has_platform_role(ARRAY['owner', 'admin']));

-- INSERT: apenas owner/admin (convite de operadores) — futuro fluxo de onboarding
CREATE POLICY "operator_profiles_insert_admin"
  ON public.operator_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_platform_role(ARRAY['owner', 'admin']));

-- DELETE: apenas owner
CREATE POLICY "operator_profiles_delete_owner"
  ON public.operator_profiles
  FOR DELETE
  TO authenticated
  USING (public.has_platform_role(ARRAY['owner']));

-- Sem policies para anon — acesso negado por padrão com RLS enabled
