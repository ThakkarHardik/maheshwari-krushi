/**
 * One-off data update: the store's spotlight product is "Super Tatkal Power"
 * (a third-party brand the shop resells). Renames the old sample product in
 * place, so its existing orders and reviews stay linked, and sets its photo.
 *
 *   npx tsx prisma/scripts/super-tatkal-power.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { superTatkalPower } from "../products";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const product = await db.product.findFirst({
    where: { slug: { in: ["tarvarth-power-plant-tonic", superTatkalPower.slug] } },
  });
  if (!product) throw new Error("Spotlight product not found");

  const { image, ...data } = superTatkalPower;
  await db.product.update({ where: { id: product.id }, data });

  const hasImage = await db.productImage.findFirst({ where: { productId: product.id, url: image.url } });
  if (!hasImage) {
    await db.productImage.updateMany({
      where: { productId: product.id },
      data: { sortOrder: { increment: 1 } },
    });
    await db.productImage.create({
      data: { productId: product.id, url: image.url, alt: image.alt, sortOrder: 0 },
    });
  }
  console.log(`✓ Updated ${product.id} → /products/${superTatkalPower.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
