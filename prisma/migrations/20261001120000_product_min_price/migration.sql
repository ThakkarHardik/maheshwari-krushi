-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "minPrice" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Product_minPrice_idx" ON "Product"("minPrice");

