export const PHOTO_PREFIX = "photos/";

export const sanitize = (s: string) => s.replace(/[^\w.\- ]+/g, "_").slice(0, 80);

// Pathname format: photos/<timestamp>__<uploader>__<filename>
export function buildPathname(uploader: string, filename: string) {
  return `${PHOTO_PREFIX}${Date.now()}__${sanitize(uploader)}__${sanitize(filename)}`;
}

export const META_PREFIX = "meta/";

// Info file that sits beside each photo: meta/<photo name>.json
export const metaPathname = (photoPathname: string) =>
  `${META_PREFIX}${photoPathname.slice(PHOTO_PREFIX.length)}.json`;
