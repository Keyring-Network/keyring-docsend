/**
 * Helpers for the "images" content mode. Pure so the file-selection rules are
 * tested; the page does the actual directory read and calls in here.
 */
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"];

export function isImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * The ordered image list to show. An explicit configured list wins; otherwise
 * every image in the directory, sorted by name.
 */
export function resolveImageList(configured: string[], dirEntries: string[]): string[] {
  if (configured.length > 0) return configured;
  return dirEntries.filter(isImageFile).sort((a, b) => a.localeCompare(b));
}
