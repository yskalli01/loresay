import { getSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { downloadCollectionImage } from "@/infrastructure/supabase/collection-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return new Response(null, { status: 401 });
  }

  const { collectionId } = await params;
  const detail = await knowledgeRepository.getCollectionDetail({
    collectionId,
    owner: { userId: user.id },
  });
  const path = detail?.collection.image_url;

  if (!path || /^https?:\/\//i.test(path)) {
    return new Response(null, { status: 404 });
  }

  const image = await downloadCollectionImage(path);

  if (!image) {
    return new Response(null, { status: 404 });
  }

  return new Response(image, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": image.type || "application/octet-stream",
    },
  });
}
