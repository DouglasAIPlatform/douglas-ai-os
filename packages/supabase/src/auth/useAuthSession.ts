"use client";

import { useContext } from "react";
import {
  AuthSessionContext,
  DEFAULT_AUTH_SESSION_STATE,
  noopAuthSignIn,
  noopAuthSignOut,
  type AuthSessionContextValue,
} from "./AuthSessionContext";

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    return {
      ...DEFAULT_AUTH_SESSION_STATE,
      isLoading: false,
      isSigningIn: false,
      isSigningOut: false,
      refreshSession: async () => {},
      signIn: noopAuthSignIn,
      signOut: noopAuthSignOut,
    };
  }

  return context;
}
