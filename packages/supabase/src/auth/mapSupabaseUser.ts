import type { User } from "@supabase/supabase-js";
import type { AuthRole, AuthUser } from "./AuthTypes";

function readAppMetadataRole(user: User): AuthRole | null {
  const role = user.app_metadata?.role;
  if (
    role === "owner" ||
    role === "admin" ||
    role === "operator" ||
    role === "viewer"
  ) {
    return role;
  }
  return null;
}

export function mapSupabaseUser(user: User): { user: AuthUser; authRole: AuthRole | null } {
  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    authRole: readAppMetadataRole(user),
  };
}
