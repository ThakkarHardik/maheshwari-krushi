import "server-only";
import { db } from "@/lib/db";

export function getProductFormOptions() {
  return Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameHi: true } }),
    db.crop.findMany({ orderBy: { nameHi: "asc" }, select: { id: true, nameHi: true } }),
  ]);
}
