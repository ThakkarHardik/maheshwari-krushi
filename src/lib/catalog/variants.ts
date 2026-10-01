import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/** Recomputes Product.minPrice from its active variants. Call after any variant change. */
export async function syncMinPrice(tx: Prisma.TransactionClient, productId: string) {
  const { _min } = await tx.productVariant.aggregate({
    where: { productId, isActive: true },
    _min: { price: true },
  });
  await tx.product.update({ where: { id: productId }, data: { minPrice: _min.price } });
}
