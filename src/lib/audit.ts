import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type AuditEntry = {
  adminUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Prisma.InputJsonValue;
};

export async function writeAudit(entry: AuditEntry) {
  await db.auditLog.create({ data: entry });
}
