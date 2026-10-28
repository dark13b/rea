import { isAbsolute, posix, win32 } from "node:path";
import {
  absoluteCallerPath,
  appendCallerPath,
} from "../filesystem/callerPath.js";

/** Per-user cache directory that REA owns for Kuna on this host. */
export const defaultKunaCacheDirectory = (
  home: string,
  environment: Readonly<NodeJS.ProcessEnv>,
  platform: NodeJS.Platform,
): string => {
  if (platform === "darwin")
    return appendCallerPath(home, "Library/Caches/rea/kuna", platform);
  const xdg = environment.XDG_CACHE_HOME;
  const root =
    xdg !== undefined && isAbsolute(xdg)
      ? xdg
      : appendCallerPath(home, ".cache", platform);
  return appendCallerPath(root, "rea/kuna", platform);
};

/**
 * Lexical directory identity. Keeps POSIX parent traversal distinct because
 * collapsing it can change directory identity across symbolic links.
 * On Darwin and Linux, `\` is a filename character, so only `/` is removed.
 */
export const sameLexicalDirectory = (
  left: string,
  right: string,
  platform: NodeJS.Platform,
): boolean =>
  lexicalDirectory(left, platform) === lexicalDirectory(right, platform);

/**
 * True when `child` lies below `parent` once `.` and `..` are collapsed, so a
 * selection spelled through `..` is judged by where it points, not by prefix.
 */
export const nestedLexicalDirectory = (
  child: string,
  parent: string,
  platform: NodeJS.Platform,
): boolean => {
  const pathApi = platform === "win32" ? win32 : posix;
  const base = lexicalDirectory(parent, platform);
  return pathApi
    .normalize(lexicalDirectory(child, platform))
    .startsWith(base.endsWith(pathApi.sep) ? base : base + pathApi.sep);
};

const lexicalDirectory = (value: string, platform: NodeJS.Platform): string => {
  const pathApi = platform === "win32" ? win32 : posix;
  const normalized = absoluteCallerPath(value, { platform });
  const root = pathApi.parse(normalized).root;
  let end = normalized.length;
  while (
    end > root.length &&
    normalized.charCodeAt(end - 1) === pathApi.sep.charCodeAt(0)
  )
    end -= 1;
  return normalized.slice(0, end);
};
