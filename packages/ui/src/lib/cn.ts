import { type ClassValue,clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges conditional class names with Tailwind conflict resolution.
 *
 * Combines `clsx` for conditional lists and `tailwind-merge` so later utilities
 * override earlier conflicting ones (for example `p-2` vs `p-4`).
 *
 * @param inputs - Class values accepted by `clsx` (strings, arrays, objects).
 * @returns A single space-separated class string safe for NativeWind / Tailwind.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
