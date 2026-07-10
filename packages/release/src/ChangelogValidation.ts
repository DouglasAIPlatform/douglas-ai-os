import { RELEASE_CHANGE_CATEGORIES, type ReleaseChangeCategory } from "./ReleaseChange";

const VERSION_HEADER_PATTERN = /^## \[([^\]]+)\]/;

export function changelogHasVersionEntry(
  changelogContent: string,
  version: string,
): boolean {
  const lines = changelogContent.split("\n");
  for (const line of lines) {
    const match = VERSION_HEADER_PATTERN.exec(line.trim());
    if (match && match[1] === version) {
      return true;
    }
  }
  return false;
}

export function changelogHasRequiredStructure(changelogContent: string): boolean {
  if (!changelogContent.includes("# Changelog")) {
    return false;
  }

  return RELEASE_CHANGE_CATEGORIES.some((category: ReleaseChangeCategory) =>
    changelogContent.includes(`### ${category}`),
  );
}
