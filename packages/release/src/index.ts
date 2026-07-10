export type { ReleaseChannel } from "./ReleaseChannel";
export {
  RELEASE_CHANNELS,
  RELEASE_CHANNEL_LABELS,
  isReleaseChannel,
} from "./ReleaseChannel";

export type { ReleaseVersion } from "./ReleaseVersion";
export {
  SEMVER_PATTERN,
  parseReleaseVersion,
  isValidSemVer,
  compareReleaseVersions,
  isVersionGreaterThan,
} from "./ReleaseVersion";

export type { ReleaseStatus } from "./ReleaseStatus";
export { RELEASE_STATUS_LABELS, isReleaseStatus } from "./ReleaseStatus";

export type { ReleaseMetadata, ReleaseMetadataSnapshot, ReleaseChangelogEntry } from "./ReleaseMetadata";

export type { ReleaseChange, ReleaseChangeCategory } from "./ReleaseChange";
export { RELEASE_CHANGE_CATEGORIES } from "./ReleaseChange";

export type { ReleaseManifest } from "./ReleaseManifest";
export {
  RELEASE_MANIFEST_PATH,
  OFFICIAL_PLATFORM_NAME,
} from "./ReleaseManifest";

export type {
  ReleaseValidationSeverity,
  ReleaseValidationIssue,
  ReleaseValidationResult,
  VersionConsistencyTarget,
  VersionConsistencyReport,
  ReleaseStatusSnapshot,
} from "./ReleaseValidationResult";
export { buildReleaseValidationResult } from "./ReleaseValidationResult";

export {
  EMBEDDED_RELEASE_MANIFEST,
  OFFICIAL_PLATFORM_VERSION,
  resolveEmbeddedReleaseManifest,
  validateReleaseManifestShape,
} from "./ReleaseManifestResolver";

export {
  buildReleaseStatusSnapshot,
  type BuildReleaseStatusSnapshotOptions,
} from "./ReleaseStatusSnapshot";

export {
  changelogHasVersionEntry,
  changelogHasRequiredStructure,
} from "./ChangelogValidation";
