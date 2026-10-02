import { z } from "zod";

/**
 * Checks the environment once at server start-up (see src/instrumentation.ts),
 * so a missing or unsafe production setting fails loudly instead of misbehaving.
 */
const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url("DATABASE_URL must be a postgres:// URL"),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    STORAGE_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    VERCEL: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER === "cloudinary") {
      for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const) {
        if (!env[key])
          ctx.addIssue({ code: "custom", path: [key], message: `${key} is required for Cloudinary storage` });
      }
    }
    if (env.NODE_ENV === "production") {
      if (!env.NEXT_PUBLIC_SITE_URL) {
        ctx.addIssue({
          code: "custom",
          path: ["NEXT_PUBLIC_SITE_URL"],
          message: "Set NEXT_PUBLIC_SITE_URL to the site address",
        });
      } else if (env.VERCEL && !env.NEXT_PUBLIC_SITE_URL.startsWith("https://")) {
        ctx.addIssue({
          code: "custom",
          path: ["NEXT_PUBLIC_SITE_URL"],
          message: "Use an https:// address in production",
        });
      }
      // Hosts like Vercel have no persistent disk: local uploads would vanish.
      if (env.VERCEL && env.STORAGE_DRIVER !== "cloudinary") {
        ctx.addIssue({
          code: "custom",
          path: ["STORAGE_DRIVER"],
          message: "Use STORAGE_DRIVER=cloudinary on Vercel",
        });
      }
    }
  });

export type Env = z.infer<typeof schema>;

export function validateEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  • ${String(i.path[0])}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}

/** Public base URL for links, sitemap and social previews. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
