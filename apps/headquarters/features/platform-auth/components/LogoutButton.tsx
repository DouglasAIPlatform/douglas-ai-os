"use client";

import { Button } from "@douglas/ui";
import { useAuthSession } from "@douglas/supabase";

export interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const { signOut, isSigningOut, status } = useAuthSession();

  if (status !== "authenticated") {
    return null;
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className={className}
      disabled={isSigningOut}
      onClick={() => void signOut()}
    >
      {isSigningOut ? "Saindo…" : "Sair"}
    </Button>
  );
}
