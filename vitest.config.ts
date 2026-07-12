import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/security/src/**/*.rbac.test.ts",
      "packages/supabase/src/**/*.rbac.test.ts",
      "packages/environment/src/**/*.rbac.test.ts",
      "packages/missions/src/**/*.test.ts",
      "packages/missions/src/mission-status-transition.test.ts",
      "packages/agents/src/**/*.test.ts",
    ],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      "@douglas/core": path.join(repoRoot, "packages/core/src/index.ts"),
      "@douglas/events": path.join(repoRoot, "packages/events/src/index.ts"),
      "@douglas/environment": path.join(repoRoot, "packages/environment/src/index.ts"),
      "@douglas/release": path.join(repoRoot, "packages/release/src/index.ts"),
      "@douglas/security": path.join(repoRoot, "packages/security/src/index.ts"),
      "@douglas/missions": path.join(repoRoot, "packages/missions/src/index.ts"),
      "@douglas/agents": path.join(repoRoot, "packages/agents/src/index.ts"),
      "@douglas/audit": path.join(repoRoot, "packages/audit/src/index.ts"),
    },
  },
});
