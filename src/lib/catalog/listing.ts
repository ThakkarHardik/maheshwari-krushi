export const SORTS = ["newest", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];

export const PAGE_SIZE = 12;

export type ListingParams = {
  category: string | null;
  crop: string | null;
  sort: Sort;
  q: string | null;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Normalises /products search params; anything invalid falls back to a default. */
export function parseListingParams(raw: RawParams): ListingParams {
  const category = first(raw.category)?.trim().toLowerCase() || null;
  const sortRaw = first(raw.sort);
  const sort = (SORTS as readonly string[]).includes(sortRaw ?? "") ? (sortRaw as Sort) : "newest";
  const q = first(raw.q)?.trim().slice(0, 60) || null;
  const pageNum = Number.parseInt(first(raw.page) ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum >= 1 && pageNum <= 1000 ? pageNum : 1;
  const crop = first(raw.crop)?.trim().toLowerCase() || null;
  const slug = (v: string | null) => (v && /^[a-z0-9-]{1,80}$/.test(v) ? v : null);
  return { category: slug(category), crop: slug(crop), sort, q, page };
}

/** Builds a /products URL, dropping defaults so links stay short. */
export function listingHref(params: Partial<ListingParams>): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.crop) search.set("crop", params.crop);
  if (params.q) search.set("q", params.q);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/products?${qs}` : "/products";
}
