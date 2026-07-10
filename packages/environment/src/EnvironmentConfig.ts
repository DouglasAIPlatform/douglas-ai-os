import type { EnvironmentConfig as CoreEnvironmentConfig } from "@douglas/core";
import { Environment } from "@douglas/core";
import { getEnvironmentProfile, type EnvironmentProfile } from "./EnvironmentProfile";
import type { PlatformEnvironment } from "./PlatformEnvironment";

/** Configuração resolvida da plataforma — combina core + perfil operacional. */
export interface EnvironmentConfig {
  name: PlatformEnvironment;
  profile: EnvironmentProfile;
  core: CoreEnvironmentConfig;
  /** true quando NEXT_PUBLIC_DOS_ENVIRONMENT foi definido explicitamente. */
  declaredExplicitly: boolean;
  /** Valor bruto da variável (pode ser inválido — use name para o valor efetivo). */
  rawEnvironmentValue: string | null;
}

export function buildEnvironmentConfig(input: {
  name: PlatformEnvironment;
  declaredExplicitly: boolean;
  rawEnvironmentValue: string | null;
}): EnvironmentConfig {
  const coreEnv = new Environment(input.name);
  const profile = getEnvironmentProfile(input.name);

  return {
    name: input.name,
    profile,
    core: coreEnv.getConfig(),
    declaredExplicitly: input.declaredExplicitly,
    rawEnvironmentValue: input.rawEnvironmentValue,
  };
}
