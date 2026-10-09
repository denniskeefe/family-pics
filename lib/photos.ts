import { list } from "@vercel/blob";
import { PHOTO_PREFIX } from "@/lib/paths";

export type Photo = {
  pathname: string;
  uploader: string;
  filename: string;
  uploadedAt: string;
  size: number;
};

export async function listPhotos(): Promise<Photo[]> {
  const photos: Photo[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PHOTO_PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const [, uploader = "Unknown", ...rest] = b.pathname
        .slice(PHOTO_PREFIX.length)
        .split("__");
      photos.push({
        pathname: b.pathname,
        uploader,
        filename: rest.join("__"),
        uploadedAt: b.uploadedAt.toISOString(),
        size: b.size,
      });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return photos.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
