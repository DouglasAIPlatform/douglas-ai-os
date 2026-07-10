import type { PlatformEnvironment } from "./PlatformEnvironment";

/** Canal de release — alinhado a PlatformEnvironment (Sprint 5.41). */
export type ReleaseChannel = PlatformEnvironment;

export const RELEASE_CHANNELS = [
  "development",
  "staging",
  "production",
] as const satisfies readonly ReleaseChannel[];

export const RELEASE_CHANNEL_LABELS: Record<ReleaseChannel, string> = {
  development: "Development",
  staging: "Staging",
  production: "Production",
};

export function isReleaseChannel(value: string): value is ReleaseChannel {
  return (RELEASE_CHANNELS as readonly string[]).includes(value);
}

export function toReleaseChannel(environment: PlatformEnvironment): ReleaseChannel {
  return environment;
}
