import type { RBACVerificationCase } from "./RBACVerificationCase";

export type RBACVerificationOutcome = "pass" | "fail";

export interface RBACVerificationResult {
  case: RBACVerificationCase;
  outcome: RBACVerificationOutcome;
  message: string;
  actualAllowed?: boolean;
  actualRequiresConfirmation?: boolean;
}
