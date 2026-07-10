import type { EnvironmentMismatch } from "./EnvironmentMismatch";
import type { EnvironmentSource, EnvironmentSourceRole } from "./EnvironmentSource";
import type { PlatformEnvironment } from "./PlatformEnvironment";
import type { ReleaseChannel } from "./ReleaseChannel";

export interface DetectedEnvironmentSource {
  source: EnvironmentSource;
  role: EnvironmentSourceRole;
  rawValue: string | null;
  /** Mapeamento sugerido — hint secundário, não substitui canônico. */
  mappedHint: PlatformEnvironment | null;
  explicit: boolean;
}

/** Resultado da resolução canônica — fonte única operacional. */
export interface EnvironmentResolution {
  /** Ambiente canônico (políticas aplicadas). */
  canonical: PlatformEnvironment;
  releaseChannel: ReleaseChannel;
  /** Ambiente efetivo — sempre igual ao canônico; nunca promovido automaticamente. */
  effectiveEnvironment: PlatformEnvironment;
  declaredExplicitly: boolean;
  productionExplicitlyDeclared: boolean;
  sources: DetectedEnvironmentSource[];
  mismatches: EnvironmentMismatch[];
  hasCriticalMismatch: boolean;
  warnings: string[];
}
