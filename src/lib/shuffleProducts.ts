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

// Round-robin by category: Cat A 1 product, Cat B 1 product, Cat C 1 product, then repeat
export function shuffleNoDuplicateCategories(products: Product[]): Product[] {
  if (products.length <= 1) return products;

  // Group products by category
  const byCategory = new Map<string | null, Product[]>();
  for (const product of products) {
    const catId = product.category_id;
    if (!byCategory.has(catId)) {
      byCategory.set(catId, []);
    }
    byCategory.get(catId)!.push(product);
  }

  // Shuffle products within each category
  for (const [, catProducts] of byCategory) {
    const shuffled = fisherYatesShuffle(catProducts);
    catProducts.length = 0;
    catProducts.push(...shuffled);
  }

  // Shuffle the category order itself
  const categoryIds = fisherYatesShuffle(Array.from(byCategory.keys()));
  
  // Round-robin: take 1 from each category in order, repeat until all done
  const result: Product[] = [];
  let hasMore = true;
  
  while (hasMore) {
    hasMore = false;
    for (const catId of categoryIds) {
      const catProducts = byCategory.get(catId)!;
      if (catProducts.length > 0) {
        result.push(catProducts.shift()!);
        hasMore = true;
      }
    }
  }

  return result;
}
