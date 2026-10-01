import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_FILE_PATTERN } from "@/lib/storage/image";
import { LOCAL_UPLOAD_ROOT } from "@/lib/storage";

const FOLDERS = new Set(["products"]);
const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

// Serves images saved by the "local" storage driver (development only).
export async function GET(_req: Request, { params }: { params: Promise<{ folder: string; file: string }> }) {
  const { folder, file } = await params;
  if (!FOLDERS.has(folder) || !LOCAL_FILE_PATTERN.test(file)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const bytes = await readFile(path.join(LOCAL_UPLOAD_ROOT, folder, file));
    const ext = file.split(".").pop() as keyof typeof MIME;
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": MIME[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
