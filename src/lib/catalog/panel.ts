import { sellableQuantity } from "./stock";

export type PanelVariant = {
  id: string;
  label: string;
  price: string;
  mrp: string;
  stock: number;
  lowStock: boolean;
};

type VariantRow = {
  id: string;
  label: string;
  price: { toString(): string };
  mrp: { toString(): string };
  lowStockThreshold: number;
  batches: { qtyAvailable: number; expiryDate: Date | null }[];
};

/** Pack sizes with live sellable stock, for the buy panel (product page and home spotlight). */
export function toPanelVariants(variants: VariantRow[]): PanelVariant[] {
  return variants.map((v) => {
    const stock = sellableQuantity(v.batches);
    return {
      id: v.id,
      label: v.label,
      price: v.price.toString(),
      mrp: v.mrp.toString(),
      stock,
      lowStock: stock > 0 && stock <= v.lowStockThreshold,
    };
  });
}
