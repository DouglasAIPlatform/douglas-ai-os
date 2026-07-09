"use client";

import { createContext } from "react";
import type {
  ActionConfirmationRequest,
  ActionConfirmationRequestInput,
  ActionConfirmationResult,
} from "./SecurityTypes";

export interface ActionConfirmationContextValue {
  pending: ActionConfirmationRequest | null;
  requestConfirmation: (
    input: ActionConfirmationRequestInput,
  ) => Promise<ActionConfirmationResult>;
}

export const ActionConfirmationContext =
  createContext<ActionConfirmationContextValue | null>(null);
