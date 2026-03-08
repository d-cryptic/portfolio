import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const cache = new Map<string, Date | null>();

export const getGitLastModified = (absolutePath: string): Date | null => {
  if (cache.has(absolutePath)) {
    return cache.get(absolutePath) ?? null;
  }

  if (!existsSync(absolutePath)) {
    cache.set(absolutePath, null);
    return null;
  }

  try {
    const command = `git log -1 --format=%cI -- "${absolutePath.replace(/"/g, '\\"')}"`;
    const output = execSync(command, { encoding: "utf-8" }).trim();
    const parsed = output ? new Date(output) : null;
    const value = parsed && !Number.isNaN(parsed.valueOf()) ? parsed : null;
    cache.set(absolutePath, value);
    return value;
  } catch {
    cache.set(absolutePath, null);
    return null;
  }
};
