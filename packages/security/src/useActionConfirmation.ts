"use client";

import { useContext } from "react";
import { ActionConfirmationContext } from "./ActionConfirmationContext";

export function useActionConfirmation() {
  const context = useContext(ActionConfirmationContext);
  if (!context) {
    throw new Error("useActionConfirmation must be used within ActionConfirmationProvider");
  }
  return context;
}
