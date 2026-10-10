import { get, list } from "@vercel/blob";
import { PHOTO_PREFIX, metaPathname } from "@/lib/paths";

export type PhotoMeta = {
  year?: number;
  location?: string;
  people?: string[];
  caption?: string;
};

export type Photo = {
  pathname: string;
  uploader: string;
  filename: string;
  uploadedAt: string;
  size: number;
  year: number;
  location: string;
  people: string[];
  caption: string;
};

async function readMeta(photoPathname: string): Promise<PhotoMeta> {
  try {
    const res = await get(metaPathname(photoPathname), {
      access: "private",
      useCache: false,
    });
    if (!res || res.statusCode !== 200) return {};
    return (await new Response(res.stream).json()) as PhotoMeta;
  } catch {
    return {};
  }
}

export async function listPhotos(): Promise<Photo[]> {
  const blobs = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PHOTO_PREFIX, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const metas = await Promise.all(blobs.map((b) => readMeta(b.pathname)));

  return blobs
    .map((b, i) => {
      const [, uploader = "Unknown", ...rest] = b.pathname
        .slice(PHOTO_PREFIX.length)
        .split("__");
      const m = metas[i];
      return {
        pathname: b.pathname,
        uploader,
        filename: rest.join("__"),
        uploadedAt: b.uploadedAt.toISOString(),
        size: b.size,
        year: m.year ?? b.uploadedAt.getFullYear(),
        location: m.location ?? "",
        people: m.people ?? [],
        caption: m.caption ?? "",
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
