#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runAndFormatRBACCatalogDriftCheck } from "../packages/security/src/rbac-catalog/RBACCatalogDriftRunner.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const { report, formatted } = runAndFormatRBACCatalogDriftCheck(repoRoot);

console.log(formatted);

if (report.status === "failed") {
  process.exit(1);
}

process.exit(0);
