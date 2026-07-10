import type { ReleaseChannel } from "./ReleaseChannel";
import type { ReleaseMetadata } from "./ReleaseMetadata";
import type { ReleaseStatus } from "./ReleaseStatus";

/** Manifesto oficial da release — fonte única em `release/manifest.json`. */
export interface ReleaseManifest {
  version: string;
  channel: ReleaseChannel;
  platform: string;
  status: ReleaseStatus;
  metadata: ReleaseMetadata;
}

export const RELEASE_MANIFEST_PATH = "release/manifest.json";

export const OFFICIAL_PLATFORM_NAME = "Douglas AI OS";
