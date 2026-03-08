import { getCollection } from "astro:content";
import { cleanContentId } from "@lib/content-paths";

export async function getStaticPaths() {
  const notes = await getCollection("notes", ({ data }) => !data.draft);
  return notes.map((entry) => ({
    params: { id: cleanContentId(entry.id) },
  }));
}

export async function GET({ params }: { params: { id?: string } }): Promise<Response> {
  const notes = await getCollection("notes", ({ data }) => !data.draft);
  const targetId = params.id ?? "";
  const note = notes.find((entry) => cleanContentId(entry.id) === targetId);

  if (!note) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(note.body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${cleanContentId(note.id).replace(/\//g, "-")}.md\"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
