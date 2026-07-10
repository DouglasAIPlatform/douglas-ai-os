import { spawnSync } from "node:child_process";

export interface GitStateSnapshot {
  available: boolean;
  commit: string | null;
  shortCommit: string | null;
  branch: string | null;
  workingTreeClean: boolean | null;
  dirtyFiles: string[];
}

function runGit(repoRoot: string, args: string[]): string | null {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    return null;
  }

  return (result.stdout ?? "").trim() || null;
}

export function readGitState(repoRoot: string): GitStateSnapshot {
  const commit = runGit(repoRoot, ["rev-parse", "HEAD"]);
  const shortCommit = runGit(repoRoot, ["rev-parse", "--short", "HEAD"]);
  const branch = runGit(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const status = runGit(repoRoot, ["status", "--porcelain"]);

  if (commit === null && status === null) {
    return {
      available: false,
      commit: null,
      shortCommit: null,
      branch: null,
      workingTreeClean: null,
      dirtyFiles: [],
    };
  }

  const dirtyFiles =
    status
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^\?\?\s+/, "").replace(/^..\s+/, "")) ?? [];

  return {
    available: true,
    commit,
    shortCommit,
    branch,
    workingTreeClean: status !== null ? status.length === 0 : null,
    dirtyFiles,
  };
}
