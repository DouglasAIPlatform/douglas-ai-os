/** Versão SemVer MAJOR.MINOR.PATCH */
export interface ReleaseVersion {
  major: number;
  minor: number;
  patch: number;
  /** Representação canônica `MAJOR.MINOR.PATCH`. */
  raw: string;
}

export const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseReleaseVersion(raw: string): ReleaseVersion | null {
  const trimmed = raw.trim();
  const match = SEMVER_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: trimmed,
  };
}

export function isValidSemVer(raw: string): boolean {
  return parseReleaseVersion(raw) !== null;
}

export function compareReleaseVersions(
  left: ReleaseVersion,
  right: ReleaseVersion,
): number {
  if (left.major !== right.major) {
    return left.major - right.major;
  }
  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }
  return left.patch - right.patch;
}

export function isVersionGreaterThan(
  candidate: string,
  current: string,
): boolean {
  const parsedCandidate = parseReleaseVersion(candidate);
  const parsedCurrent = parseReleaseVersion(current);
  if (!parsedCandidate || !parsedCurrent) {
    return false;
  }
  return compareReleaseVersions(parsedCandidate, parsedCurrent) > 0;
}
