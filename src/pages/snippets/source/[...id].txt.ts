import { getCollection } from "astro:content";
import { cleanContentId } from "@lib/content-paths";

export async function getStaticPaths() {
  const snippets = await getCollection("snippets", ({ data }) => !data.draft);
  return snippets.map((entry) => ({
    params: { id: cleanContentId(entry.id) },
  }));
}

export async function GET({ params }: { params: { id?: string } }): Promise<Response> {
  const snippets = await getCollection("snippets", ({ data }) => !data.draft);
  const targetId = params.id ?? "";
  const snippet = snippets.find((entry) => cleanContentId(entry.id) === targetId);

  if (!snippet) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(snippet.body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${cleanContentId(snippet.id).replace(/\//g, "-")}.md\"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
