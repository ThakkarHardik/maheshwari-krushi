import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ImageKind } from "./image";

/**
 * Where product images live. "local" (default) writes to ./uploads and is
 * meant for development; use "cloudinary" in production (Vercel has no
 * persistent disk).
 */
export type StoredFile = { url: string; key: string };

export interface StorageProvider {
  save(bytes: Uint8Array, kind: ImageKind, folder: string): Promise<StoredFile>;
  remove(key: string): Promise<void>;
}

export const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const localStorage: StorageProvider = {
  async save(bytes, kind, folder) {
    const name = `${randomBytes(12).toString("hex")}.${kind.ext}`;
    const dir = path.join(LOCAL_UPLOAD_ROOT, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return { url: `/uploads/${folder}/${name}`, key: `local:${folder}/${name}` };
  },
  async remove(key) {
    const rel = key.replace(/^local:/, "");
    const full = path.resolve(LOCAL_UPLOAD_ROOT, rel);
    if (!full.startsWith(LOCAL_UPLOAD_ROOT + path.sep)) return;
    await unlink(full).catch(() => undefined);
  },
};

function cloudinaryConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !secret) throw new Error("Cloudinary env vars are not set");
  return { cloud, apiKey, secret };
}

function sign(params: Record<string, string>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + secret)
    .digest("hex");
}

const cloudinaryStorage: StorageProvider = {
  async save(bytes, kind, folder) {
    const { cloud, apiKey, secret } = cloudinaryConfig();
    const params = {
      folder: `maheshwari-krishi/${folder}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const body = new FormData();
    body.set("file", new Blob([Buffer.from(bytes)], { type: kind.mime }));
    body.set("api_key", apiKey);
    body.set("signature", sign(params, secret));
    for (const [k, v] of Object.entries(params)) body.set(k, v);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: "POST",
      body,
    });
    if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status})`);
    const json = (await res.json()) as { secure_url: string; public_id: string };
    return { url: json.secure_url, key: `cloudinary:${json.public_id}` };
  },
  async remove(key) {
    const { cloud, apiKey, secret } = cloudinaryConfig();
    const params = {
      public_id: key.replace(/^cloudinary:/, ""),
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const body = new FormData();
    body.set("api_key", apiKey);
    body.set("signature", sign(params, secret));
    for (const [k, v] of Object.entries(params)) body.set(k, v);
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: "POST", body }).catch(
      () => undefined,
    );
  },
};

export function getStorage(): StorageProvider {
  return process.env.STORAGE_DRIVER === "cloudinary" ? cloudinaryStorage : localStorage;
}

/** Removes a stored file by its key, whichever provider stored it. */
export async function removeStoredFile(key: string | null | undefined) {
  if (!key) return;
  if (key.startsWith("cloudinary:")) return cloudinaryStorage.remove(key);
  if (key.startsWith("local:")) return localStorage.remove(key);
}
