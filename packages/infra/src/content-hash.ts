/**
 * Content hashing for static export directories used as Pulumi Command triggers.
 *
 * When the hash changes, the web sync command re-runs and can invalidate CloudFront.
 */

import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

/**
 * Walks a directory and returns sorted file paths.
 *
 * @param root - Absolute directory to walk.
 * @returns Sorted absolute file paths, or `[]` when `root` does not exist.
 */
export function listFilesRecursive(root: string): string[] {
  if (!existsSync(root)) {
    return []
  }
  const files: string[] = []
  const entries = readdirSync(root, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }
  return files.sort()
}

/**
 * Content hash of a static export directory. Changes when files are added,
 * removed, or edited so CloudFront invalidation can re-run.
 *
 * @param root - Absolute path to the static export directory.
 * @returns Truncated SHA-256 hex digest (16 characters).
 */
export function hashDirectory(root: string): string {
  const hash = createHash("sha256")
  const files = listFilesRecursive(root)
  for (const file of files) {
    hash.update(relative(root, file))
    hash.update("\0")
    hash.update(readFileSync(file))
    hash.update("\0")
  }
  return hash.digest("hex").slice(0, 16)
}
