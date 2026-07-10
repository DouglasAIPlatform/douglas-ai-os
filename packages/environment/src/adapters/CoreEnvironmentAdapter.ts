import type { CoreEnvironmentName } from "@douglas/core";
import type { PlatformEnvironment } from "../PlatformEnvironment";

/** Adapter @douglas/core Environment → PlatformEnvironment (nomes 1:1). */
export function coreEnvironmentToPlatform(name: CoreEnvironmentName): PlatformEnvironment {
  return name;
}

export function platformToCoreEnvironment(name: PlatformEnvironment): CoreEnvironmentName {
  return name;
}

export function isCoreEnvironmentName(value: string): value is CoreEnvironmentName {
  return value === "development" || value === "staging" || value === "production";
}
