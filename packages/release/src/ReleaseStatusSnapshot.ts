import type { ReleaseManifest } from "./ReleaseManifest";
import { OFFICIAL_PLATFORM_VERSION } from "./ReleaseManifestResolver";
import type { ReleaseStatusSnapshot } from "./ReleaseValidationResult";
import type { ReleaseChannel } from "./ReleaseChannel";

export interface BuildReleaseStatusSnapshotOptions {
  manifest?: ReleaseManifest;
  runtimePlatformVersion?: string;
  environment?: ReleaseChannel;
  environmentLabel?: string;
  environmentValid?: boolean;
}

export function buildReleaseStatusSnapshot(
  options: BuildReleaseStatusSnapshotOptions = {},
): ReleaseStatusSnapshot {
  const manifest = options.manifest ?? {
    version: OFFICIAL_PLATFORM_VERSION,
    channel: "development" as const,
    platform: "Douglas AI OS",
    status: "draft" as const,
    metadata: {},
  };

  const runtimeVersion = options.runtimePlatformVersion ?? OFFICIAL_PLATFORM_VERSION;
  const versionConsistent = runtimeVersion === manifest.version;
  const environment = options.environment ?? manifest.channel;
  const environmentLabel = options.environmentLabel ?? environment;

  const alerts: string[] = [];

  if (!versionConsistent) {
    alerts.push(
      `Versão runtime (${runtimeVersion}) difere do manifest (${manifest.version}).`,
    );
  }

  if (manifest.channel !== environment) {
    alerts.push(
      `Release channel do manifest (${manifest.channel}) difere do ambiente (${environment}).`,
    );
  }

  if (options.environmentValid === false) {
    alerts.push("Perfil de ambiente incompatível com políticas atuais.");
  }

  const staticReadinessValid =
    versionConsistent &&
    manifest.channel === environment &&
    options.environmentValid !== false;

  return {
    version: manifest.version,
    channel: manifest.channel,
    platform: manifest.platform,
    releaseStatus: manifest.status,
    environment,
    environmentLabel,
    versionConsistent,
    staticReadinessValid,
    runtimeReadinessHint:
      "Use Production Safety Gate e pnpm release:check para readiness runtime completo.",
    workingCopyHint:
      "Status da working copy disponível via pnpm release:status (CLI) — não exposto no browser.",
    manualReleaseNotice:
      "Release, tag Git, GitHub Release e deploy continuam manuais nesta fase.",
    alerts,
    metadataSummary: manifest.metadata.notes ?? manifest.metadata.codename ?? null,
  };
}
