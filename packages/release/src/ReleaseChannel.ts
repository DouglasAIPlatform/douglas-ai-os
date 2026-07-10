/** Canal de distribuição da release — alinhado a `@douglas/environment`. */
export type ReleaseChannel = "development" | "staging" | "production";

export const RELEASE_CHANNELS: readonly ReleaseChannel[] = [
  "development",
  "staging",
  "production",
] as const;

export const RELEASE_CHANNEL_LABELS: Record<ReleaseChannel, string> = {
  development: "Development",
  staging: "Staging",
  production: "Production",
};

export function isReleaseChannel(value: string): value is ReleaseChannel {
  return (RELEASE_CHANNELS as readonly string[]).includes(value);
}
