import type { AuthProfile, AuthRole, AuthUser } from "./AuthTypes";

export interface AuthSignInCredentials {
  email: string;
  password: string;
}

export interface AuthSignInResult {
  success: boolean;
  error?: string;
}

export interface AuthSignOutResult {
  success: boolean;
  error?: string;
}

export interface AuthAdapterSessionResult {
  user: AuthUser | null;
  authRole: AuthRole | null;
  error?: string;
}

export interface AuthAdapter {
  readonly provider: "supabase";
  getInitialSession(): Promise<AuthAdapterSessionResult>;
  subscribe(onChange: (result: AuthAdapterSessionResult) => void): () => void;
  loadProfile(userId: string): Promise<AuthProfile | null>;
  signInWithPassword(credentials: AuthSignInCredentials): Promise<AuthSignInResult>;
  signOut(): Promise<AuthSignOutResult>;
}
