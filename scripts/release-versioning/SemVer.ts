export const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function isValidSemVer(raw: string): boolean {
  return SEMVER_PATTERN.test(raw.trim());
}

export function parseSemVer(raw: string): { major: number; minor: number; patch: number } | null {
  const match = SEMVER_PATTERN.exec(raw.trim());
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isVersionGreaterThan(candidate: string, current: string): boolean {
  const left = parseSemVer(candidate);
  const right = parseSemVer(current);
  if (!left || !right) {
    return false;
  }
  if (left.major !== right.major) {
    return left.major > right.major;
  }
  if (left.minor !== right.minor) {
    return left.minor > right.minor;
  }
  return left.patch > right.patch;
}
