-- Douglas AI Platform — operator_sessions (futuro)
-- Rastreamento de sessões operacionais além do JWT Supabase Auth.
-- NÃO armazena tokens em plain text — apenas hash + metadados.

CREATE TABLE IF NOT EXISTS public.operator_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  status public.platform_session_status NOT NULL DEFAULT 'active',
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operator_sessions_user_id_idx
  ON public.operator_sessions (user_id);

CREATE INDEX IF NOT EXISTS operator_sessions_status_idx
  ON public.operator_sessions (status);

CREATE INDEX IF NOT EXISTS operator_sessions_expires_at_idx
  ON public.operator_sessions (expires_at);

COMMENT ON TABLE public.operator_sessions IS
  'Sessões operacionais futuras. Complementa supabase.auth.sessions — não substitui JWT Auth.';

COMMENT ON COLUMN public.operator_sessions.session_token_hash IS
  'Hash do token de sessão (sha256). Nunca persistir token raw.';

ALTER TABLE public.operator_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê apenas suas sessões; owner/admin veem todas (suporte)
CREATE POLICY "operator_sessions_select_own"
  ON public.operator_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "operator_sessions_select_admin"
  ON public.operator_sessions
  FOR SELECT
  TO authenticated
  USING (public.has_platform_role(ARRAY['owner', 'admin']));

-- INSERT/UPDATE/DELETE: negado no client — futuro via Edge Function / service_role
CREATE POLICY "operator_sessions_insert_denied_authenticated"
  ON public.operator_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "operator_sessions_update_denied_authenticated"
  ON public.operator_sessions
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "operator_sessions_delete_denied_authenticated"
  ON public.operator_sessions
  FOR DELETE
  TO authenticated
  USING (false);
