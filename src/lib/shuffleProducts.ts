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

// Prefer alternating categories (Cat A -> Cat B -> Cat C ...). If that becomes impossible,
// we at least try to avoid the same advertiser twice in a row.
export function shuffleNoDuplicateCategories(products: Product[]): Product[] {
  if (products.length <= 1) return products;

  // Group products by category
  const byCategory = new Map<string | null, Product[]>();
  for (const product of products) {
    const catId = product.category_id;
    if (!byCategory.has(catId)) byCategory.set(catId, []);
    byCategory.get(catId)!.push(product);
  }

  // Shuffle products within each category
  for (const [catId, catProducts] of byCategory) {
    byCategory.set(catId, fisherYatesShuffle(catProducts));
  }

  const categoryIds = fisherYatesShuffle(Array.from(byCategory.keys()));
  const total = products.length;
  const result: Product[] = [];

  const pickFromCategory = (catId: string | null, lastAdvertiserId: string | null | undefined) => {
    const list = byCategory.get(catId)!;
    if (list.length === 0) return undefined;

    // Try to avoid same advertiser twice in a row if possible
    if (lastAdvertiserId !== undefined) {
      const idx = list.findIndex((p) => p.advertiser_id !== lastAdvertiserId);
      if (idx >= 0) return list.splice(idx, 1)[0];
    }

    return list.shift();
  };

  while (result.length < total) {
    const last = result[result.length - 1];
    const lastCatId = last?.category_id;
    const lastAdvertiserId = last?.advertiser_id;

    // 1) Prefer a DIFFERENT category than the last one (if available)
    const candidates = categoryIds
      .filter((id) => id !== lastCatId && (byCategory.get(id)?.length || 0) > 0)
      .sort((a, b) => (byCategory.get(b)!.length || 0) - (byCategory.get(a)!.length || 0));

    let chosenCatId: string | null | undefined = candidates[0];

    // 2) If not possible, we are forced to stay in the same category (or only 1 category exists)
    if (chosenCatId === undefined) {
      chosenCatId = categoryIds
        .filter((id) => (byCategory.get(id)?.length || 0) > 0)
        .sort((a, b) => (byCategory.get(b)!.length || 0) - (byCategory.get(a)!.length || 0))[0];
    }

    if (chosenCatId === undefined) break;

    const next = pickFromCategory(chosenCatId, lastAdvertiserId);
    if (!next) break;

    result.push(next);
  }

  return result;
}
