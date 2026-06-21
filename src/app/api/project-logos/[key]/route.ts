import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { projectLogoAssets } from "@/server/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const logoKeyPattern = /^[0-9a-f-]{36}\.(?:jpg|png|webp)$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  if (!logoKeyPattern.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const edgeCache = getDefaultCache();
  const cachedResponse = await edgeCache?.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const db = getDb();

  if (!db) {
    return new Response("Logo storage is unavailable", { status: 503 });
  }

  const [object] = await db
    .select({
      bytes: projectLogoAssets.bytes,
      contentType: projectLogoAssets.contentType,
    })
    .from(projectLogoAssets)
    .where(eq(projectLogoAssets.key, key))
    .limit(1);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const objectEtag = `"${key}"`;
  const etag = request.headers.get("if-none-match");

  if (etag === objectEtag) {
    return new Response(null, { status: 304 });
  }

  const response = new Response(new Uint8Array(object.bytes), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": object.contentType,
      ETag: objectEtag,
      "X-Content-Type-Options": "nosniff",
    },
  });

  if (edgeCache) {
    try {
      const { ctx } = getCloudflareContext();
      ctx.waitUntil(edgeCache.put(request, response.clone()));
    } catch {
      // Cache API is unavailable in the plain Next.js development runtime.
    }
  }

  return response;
}

function getDefaultCache() {
  return (globalThis.caches as CacheStorage & { default?: Cache }).default;
}
