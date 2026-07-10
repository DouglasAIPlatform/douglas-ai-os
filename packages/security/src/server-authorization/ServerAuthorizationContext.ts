import type { OperatorRole } from "../SecurityTypes";

/** Contexto de autorização server-side — identidade derivada do servidor, não do payload. */
export interface ServerAuthorizationContext {
  userId: string | null;
  profileId: string | null;
  role: OperatorRole | null;
  status: "active" | "invited" | "suspended" | null;
  /** true quando role/status vieram de operator_profiles (não payload/JWT metadata). */
  resolvedFromProfile: boolean;
  permission?: string;
  action?: string;
}
