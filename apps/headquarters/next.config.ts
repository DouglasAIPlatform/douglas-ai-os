import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@douglas/ui", "@douglas/core", "@douglas/events", "@douglas/agents", "@douglas/memory", "@douglas/workflow", "@douglas/automation", "@douglas/notifications", "@douglas/analytics", "@douglas/plugins", "@douglas/dos", "@douglas/departments", "@douglas/missions", "@douglas/bootstrap", "@douglas/runtime", "@douglas/health", "@douglas/graph", "@douglas/monitor", "@douglas/platform-state", "@douglas/diagnostics", "@douglas/command-center", "@douglas/security"],
};

export default nextConfig;
