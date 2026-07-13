#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runAndFormatStagingAcceptanceCheck } from "../packages/environment/src/staging-bootstrap/StagingAcceptanceStaticCheck.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const { report, formatted } = runAndFormatStagingAcceptanceCheck(repoRoot);

console.log(formatted);

if (report.status === "failed") {
  process.exit(1);
}

process.exit(0);
