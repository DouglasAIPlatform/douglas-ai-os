import { createContext } from "react";
import type { AuthSignInCredentials, AuthSignInResult, AuthSignOutResult } from "./AuthAdapter";
import type { AuthSessionState } from "./AuthTypes";

export interface AuthSessionContextValue extends AuthSessionState {
  isLoading: boolean;
  isSigningIn: boolean;
  isSigningOut: boolean;
  refreshSession: () => Promise<void>;
  signIn: (credentials: AuthSignInCredentials) => Promise<AuthSignInResult>;
  signOut: () => Promise<AuthSignOutResult>;
}

export const DEFAULT_AUTH_SESSION_STATE: AuthSessionState = {
  status: "not_configured",
  mode: "mock",
  provider: "none",
  user: null,
  profile: null,
  authRole: null,
  error: null,
};

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(
  null,
);

export async function noopAuthSignIn(): Promise<AuthSignInResult> {
  return { success: false, error: "Auth não configurado" };
}

export async function noopAuthSignOut(): Promise<AuthSignOutResult> {
  return { success: false, error: "Auth não configurado" };
}
