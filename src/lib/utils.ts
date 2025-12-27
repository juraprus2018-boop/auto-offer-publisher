import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ensures we request a sufficiently large product image from feed proxy URLs
 * (e.g. images2.productserve.com with `w`/`h` query params).
 */
export function withImageSize(
  url: string | null | undefined,
  width: number,
  height: number = width
): string | undefined {
  if (!url) return undefined;

  try {
    const u = new URL(url);

    // Only touch URLs that already use explicit sizing params.
    if (u.searchParams.has("w") || u.searchParams.has("h")) {
      u.searchParams.set("w", String(width));
      u.searchParams.set("h", String(height));
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}

