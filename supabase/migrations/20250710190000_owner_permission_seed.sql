-- Douglas AI Platform — Owner-exclusive permission seed
-- Sprint 5.44 — sincroniza operator_role_permissions com OWNER_EXCLUSIVE_PERMISSIONS
--
-- Catálogo TypeScript: packages/security/src/Permission.ts
-- Schema: operator_role_permissions (role platform_operator_role, permission text, PK role+permission)
-- NÃO aplicar automaticamente em remoto.

-- ---------------------------------------------------------------------------
-- Remover grants incorretos — owner-exclusive somente para role owner
-- (não remove permissões compartilhadas existentes)
-- ---------------------------------------------------------------------------

DELETE FROM public.operator_role_permissions
WHERE permission IN (
  'security:manage_roles',
  'security:manage_owners',
  'release:approve_production',
  'platform:critical_configuration'
)
AND role <> 'owner';

-- ---------------------------------------------------------------------------
-- Seed idempotente — owner exclusivo
-- ---------------------------------------------------------------------------

INSERT INTO public.operator_role_permissions (role, permission, description) VALUES
  ('owner', 'security:manage_roles', 'Gerenciar roles operacionais'),
  ('owner', 'security:manage_owners', 'Gerenciar owners'),
  ('owner', 'release:approve_production', 'Aprovar release em produção'),
  ('owner', 'platform:critical_configuration', 'Configuração crítica da plataforma')
ON CONFLICT (role, permission) DO UPDATE
  SET description = EXCLUDED.description;

COMMENT ON TABLE public.operator_role_permissions IS
  'Mapa estático role → permission. Sprint 5.44 — owner-exclusive permissions seeded.';
