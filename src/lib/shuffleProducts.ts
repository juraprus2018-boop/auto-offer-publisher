import type { Product } from '@/types/database';

// Fisher-Yates shuffle
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function brandKey(p: Product): string | null {
  const b = (p.brand || '').trim().toLowerCase();
  if (b) return b;
  if (p.advertiser_id) return `adv:${p.advertiser_id}`;
  return null;
}

// Shuffle products with a strong preference for:
// 1) different category than previous
// 2) different brand/advertiser than previous
// Note: if the fetched list is dominated by one category/brand, it can be mathematically
// impossible to avoid repeats. To mitigate this, fetch a larger pool and then slice.
export function shuffleNoDuplicateCategories(products: Product[]): Product[] {
  if (products.length <= 1) return products;

  const remaining = fisherYatesShuffle(products);
  const result: Product[] = [];

  let lastCategoryId: string | null | undefined = undefined;
  let lastBrand: string | null | undefined = undefined;

  while (remaining.length > 0) {
    let idx = -1;

    // Best: different category AND different brand
    idx = remaining.findIndex(
      (p) => p.category_id !== lastCategoryId && brandKey(p) !== lastBrand
    );

    // Next: different category
    if (idx === -1) {
      idx = remaining.findIndex((p) => p.category_id !== lastCategoryId);
    }

    // Next: different brand
    if (idx === -1) {
      idx = remaining.findIndex((p) => brandKey(p) !== lastBrand);
    }

    // Fallback
    if (idx === -1) idx = 0;

    const next = remaining.splice(idx, 1)[0];
    result.push(next);

    lastCategoryId = next.category_id;
    lastBrand = brandKey(next);
  }

  return result;
}
