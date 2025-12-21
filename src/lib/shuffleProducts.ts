import type { Product } from '@/types/database';

// Shuffle products so no two consecutive products are from the same category
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

  // Shuffle each category's products randomly
  for (const [, catProducts] of byCategory) {
    for (let i = catProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [catProducts[i], catProducts[j]] = [catProducts[j], catProducts[i]];
    }
  }

  // Interleave products, avoiding consecutive same-category
  const result: Product[] = [];
  const categories = Array.from(byCategory.keys());
  let lastCategoryId: string | null | undefined = undefined;

  while (result.length < products.length) {
    let added = false;

    // Try to find a category different from the last one
    for (let i = 0; i < categories.length; i++) {
      const catId = categories[i];
      const catProducts = byCategory.get(catId)!;

      if (catProducts.length > 0 && catId !== lastCategoryId) {
        result.push(catProducts.shift()!);
        lastCategoryId = catId;
        added = true;
        break;
      }
    }

    // If no different category available, take any available product
    if (!added) {
      for (let i = 0; i < categories.length; i++) {
        const catId = categories[i];
        const catProducts = byCategory.get(catId)!;
        if (catProducts.length > 0) {
          result.push(catProducts.shift()!);
          lastCategoryId = catId;
          break;
        }
      }
    }
  }

  return result;
}
