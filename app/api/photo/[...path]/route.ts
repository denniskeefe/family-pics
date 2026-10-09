import { get } from "@vercel/blob";
import { getSession } from "@/lib/session";
import { PHOTO_PREFIX } from "@/lib/paths";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });

  const { path } = await ctx.params;
  const pathname = path.map(decodeURIComponent).join("/");
  if (!pathname.startsWith(PHOTO_PREFIX)) {
    return new Response("Not found", { status: 404 });
  }

  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
