import type { DouglasSupabaseClient } from "../SupabaseClientFactory";
import { SUPABASE_TABLES } from "../schema";
import type { OperatorProfileRow } from "../schema";
import type { AuthAdapter, AuthAdapterSessionResult } from "./AuthAdapter";
import { mapOperatorProfileRow } from "./mapOperatorProfile";
import { mapSupabaseUser } from "./mapSupabaseUser";

export function createSupabaseAuthAdapter(
  client: DouglasSupabaseClient,
): AuthAdapter {
  return {
    provider: "supabase",

    async getInitialSession(): Promise<AuthAdapterSessionResult> {
      try {
        const { data, error } = await client.auth.getSession();

        if (error) {
          return { user: null, authRole: null, error: error.message };
        }

        const sessionUser = data.session?.user;
        if (!sessionUser) {
          return { user: null, authRole: null };
        }

        const mapped = mapSupabaseUser(sessionUser);
        return { user: mapped.user, authRole: mapped.authRole };
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Falha ao ler sessão Supabase";
        return { user: null, authRole: null, error: message };
      }
    },

    subscribe(onChange) {
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          onChange({ user: null, authRole: null });
          return;
        }

        const mapped = mapSupabaseUser(session.user);
        onChange({ user: mapped.user, authRole: mapped.authRole });
      });

      return () => {
        subscription.unsubscribe();
      };
    },

    async loadProfile(userId) {
      try {
        const { data, error } = await client
          .from(SUPABASE_TABLES.operatorProfiles)
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error || !data) {
          return null;
        }

        return mapOperatorProfileRow(data as OperatorProfileRow);
      } catch {
        return null;
      }
    },

    async signInWithPassword({ email, password }) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data.session?.user) {
          return { success: false, error: "Sessão não criada após login" };
        }

        return { success: true };
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Falha ao autenticar";
        return { success: false, error: message };
      }
    },

    async signOut() {
      try {
        const { error } = await client.auth.signOut();
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Falha ao encerrar sessão";
        return { success: false, error: message };
      }
    },
  };
}
