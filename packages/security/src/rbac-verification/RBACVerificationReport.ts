import type { RBACVerificationResult } from "./RBACVerificationResult";

export type RBACVerificationStatus = "passed" | "failed";

export interface RBACVerificationReport {
  status: RBACVerificationStatus;
  checkedAt: string;
  totalCases: number;
  passedCount: number;
  failedCount: number;
  results: RBACVerificationResult[];
  failedResults: RBACVerificationResult[];
  passedResults: RBACVerificationResult[];
}

export function buildRBACVerificationReport(
  results: RBACVerificationResult[],
): RBACVerificationReport {
  const failedResults = results.filter((result) => result.outcome === "fail");
  const passedResults = results.filter((result) => result.outcome === "pass");

  return {
    status: failedResults.length > 0 ? "failed" : "passed",
    checkedAt: new Date().toISOString(),
    totalCases: results.length,
    passedCount: passedResults.length,
    failedCount: failedResults.length,
    results,
    failedResults,
    passedResults,
  };
}
