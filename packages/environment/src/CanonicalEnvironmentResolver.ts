import {
  isPlatformEnvironment,
  PLATFORM_ENVIRONMENT_VAR,
  type PlatformEnvironment,
} from "./PlatformEnvironment";
import { SERVER_ENVIRONMENT_VAR } from "./EnvironmentSource";
import type { DetectedEnvironmentSource, EnvironmentResolution } from "./EnvironmentResolution";
import type { EnvironmentMismatch } from "./EnvironmentMismatch";
import { toReleaseChannel } from "./ReleaseChannel";
import {
  readVercelEnv,
  vercelEnvToPlatformHint,
  isVercelPreview,
  isVercelProduction,
  type VercelEnvValue,
} from "./adapters/VercelEnvAdapter";

const DEFAULT_ENVIRONMENT: PlatformEnvironment = "development";

export interface CanonicalEnvironmentResolverOptions {
  env?: NodeJS.ProcessEnv;
}

function readDosPublic(
  env: NodeJS.ProcessEnv,
): { raw: string | null; explicit: boolean; mapped: PlatformEnvironment | null } {
  const raw = env[PLATFORM_ENVIRONMENT_VAR]?.trim() || null;
  if (!raw) {
    return { raw: null, explicit: false, mapped: null };
  }
  if (isPlatformEnvironment(raw)) {
    return { raw, explicit: true, mapped: raw };
  }
  return { raw, explicit: true, mapped: null };
}

function readDosServer(
  env: NodeJS.ProcessEnv,
): { raw: string | null; mapped: PlatformEnvironment | null } {
  const raw = env[SERVER_ENVIRONMENT_VAR]?.trim() || null;
  if (!raw || !isPlatformEnvironment(raw)) {
    return { raw, mapped: null };
  }
  return { raw, mapped: raw };
}

function detectMismatches(input: {
  canonical: PlatformEnvironment;
  dosPublic: ReturnType<typeof readDosPublic>;
  dosServer: ReturnType<typeof readDosServer>;
  vercelRaw: string | null;
  vercelParsed: VercelEnvValue | null;
  vercelHint: PlatformEnvironment | null;
}): EnvironmentMismatch[] {
  const mismatches: EnvironmentMismatch[] = [];
  const { canonical, dosPublic, dosServer, vercelRaw, vercelParsed, vercelHint } = input;

  if (isVercelProduction(vercelParsed) && canonical !== "production") {
    mismatches.push({
      severity: "critical",
      code: "vercel_production_dos_mismatch",
      message:
        "VERCEL_ENV=production, mas ambiente canônico não é production — políticas de dev/staging aplicadas.",
      involvedSources: {
        dos_public: dosPublic.raw,
        vercel_env: vercelRaw,
      },
    });
  }

  if (isVercelPreview(vercelParsed) && canonical === "production") {
    mismatches.push({
      severity: "critical",
      code: "vercel_preview_dos_production",
      message:
        "VERCEL_ENV=preview não pode ser interpretado como production — DOS declara production.",
      involvedSources: {
        dos_public: dosPublic.raw,
        vercel_env: vercelRaw,
      },
    });
  }

  if (
    vercelHint &&
    vercelHint !== canonical &&
    !(isVercelPreview(vercelParsed) && canonical === "staging")
  ) {
    mismatches.push({
      severity: "warning",
      code: "vercel_hint_canonical_divergence",
      message: `VERCEL_ENV sugere ${vercelHint}, canônico é ${canonical}.`,
      involvedSources: {
        dos_public: dosPublic.raw,
        vercel_env: vercelRaw,
      },
    });
  }

  if (
    dosServer.mapped &&
    dosPublic.mapped &&
    dosServer.mapped !== dosPublic.mapped
  ) {
    mismatches.push({
      severity: "warning",
      code: "dos_server_public_mismatch",
      message: "DOS_ENVIRONMENT difere de NEXT_PUBLIC_DOS_ENVIRONMENT.",
      involvedSources: {
        dos_public: dosPublic.raw,
        dos_server: dosServer.raw,
      },
    });
  }

  if (dosPublic.raw && !dosPublic.mapped) {
    mismatches.push({
      severity: "warning",
      code: "invalid_dos_public_value",
      message: `Valor inválido em ${PLATFORM_ENVIRONMENT_VAR} — usando development.`,
      involvedSources: {
        dos_public: dosPublic.raw,
      },
    });
  }

  return mismatches;
}

/**
 * Resolve ambiente operacional canônico.
 *
 * Precedência:
 * 1. NEXT_PUBLIC_DOS_ENVIRONMENT (canônico)
 * 2. DOS_ENVIRONMENT (server/deploy — informativo; não promove production sozinho)
 * 3. VERCEL_ENV (hint secundário — nunca promove para production)
 * 4. default development
 */
export function resolveCanonicalEnvironment(
  options: CanonicalEnvironmentResolverOptions = {},
): EnvironmentResolution {
  const env = options.env ?? process.env;
  const warnings: string[] = [];
  const sources: DetectedEnvironmentSource[] = [];

  const dosPublic = readDosPublic(env);
  const dosServer = readDosServer(env);
  const vercelRaw = env.VERCEL_ENV?.trim() || null;
  const vercelParsed = readVercelEnv(env);
  const vercelHint = vercelEnvToPlatformHint(vercelParsed);

  sources.push({
    source: "dos_public",
    role: "canonical",
    rawValue: dosPublic.raw,
    mappedHint: dosPublic.mapped,
    explicit: dosPublic.explicit,
  });

  if (dosServer.raw) {
    sources.push({
      source: "dos_server",
      role: "secondary",
      rawValue: dosServer.raw,
      mappedHint: dosServer.mapped,
      explicit: true,
    });
  }

  if (vercelRaw) {
    sources.push({
      source: "vercel_env",
      role: "hint",
      rawValue: vercelRaw,
      mappedHint: vercelHint,
      explicit: true,
    });
  }

  const nodeEnv = env.NODE_ENV?.trim() || null;
  if (nodeEnv) {
    sources.push({
      source: "node_env",
      role: "hint",
      rawValue: nodeEnv,
      mappedHint: nodeEnv === "development" ? "development" : null,
      explicit: false,
    });
  }

  let canonical: PlatformEnvironment = DEFAULT_ENVIRONMENT;

  if (dosPublic.mapped) {
    canonical = dosPublic.mapped;
  } else if (dosPublic.raw) {
    warnings.push(`Valor inválido em ${PLATFORM_ENVIRONMENT_VAR} — default development.`);
    canonical = DEFAULT_ENVIRONMENT;
  } else {
    sources.push({
      source: "default",
      role: "canonical",
      rawValue: DEFAULT_ENVIRONMENT,
      mappedHint: DEFAULT_ENVIRONMENT,
      explicit: false,
    });
    canonical = DEFAULT_ENVIRONMENT;
  }

  const mismatches = detectMismatches({
    canonical,
    dosPublic,
    dosServer,
    vercelRaw,
    vercelParsed,
    vercelHint,
  });

  const hasCriticalMismatch = mismatches.some((m) => m.severity === "critical");

  const productionExplicitlyDeclared =
    canonical === "production" &&
    dosPublic.explicit &&
    dosPublic.mapped === "production";

  if (canonical === "production" && !productionExplicitlyDeclared) {
    warnings.push("Production nunca é inferido automaticamente — requer DOS explícito.");
  }

  return {
    canonical,
    releaseChannel: toReleaseChannel(canonical),
    effectiveEnvironment: canonical,
    declaredExplicitly: dosPublic.explicit && dosPublic.mapped !== null,
    productionExplicitlyDeclared,
    sources,
    mismatches,
    hasCriticalMismatch,
    warnings,
  };
}

/** Alias público conforme spec Sprint 5.41. */
export const CanonicalEnvironmentResolver = {
  resolve: resolveCanonicalEnvironment,
};
