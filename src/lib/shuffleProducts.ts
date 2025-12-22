import type { Product } from '@/types/database';

// Generate a unique key combining category and advertiser
function getGroupKey(product: Product): string {
  return `${product.category_id || 'no-cat'}_${product.advertiser_id || 'no-adv'}`;
}

// Fisher-Yates shuffle
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Shuffle products ensuring no consecutive products from same category OR same advertiser
export function shuffleNoDuplicateCategories(products: Product[]): Product[] {
  if (products.length <= 1) return products;

  // First, do a random shuffle of all products
  const shuffled = fisherYatesShuffle(products);
  
  // Now reorder to avoid consecutive same-category or same-advertiser
  const result: Product[] = [];
  const remaining = [...shuffled];
  
  while (remaining.length > 0) {
    const lastProduct = result[result.length - 1];
    
    // Find best candidate: different category AND different advertiser
    let bestIndex = -1;
    
    if (lastProduct) {
      // First priority: different category AND different advertiser
      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        if (candidate.category_id !== lastProduct.category_id && 
            candidate.advertiser_id !== lastProduct.advertiser_id) {
          bestIndex = i;
          break;
        }
      }
      
      // Second priority: at least different advertiser
      if (bestIndex === -1) {
        for (let i = 0; i < remaining.length; i++) {
          const candidate = remaining[i];
          if (candidate.advertiser_id !== lastProduct.advertiser_id) {
            bestIndex = i;
            break;
          }
        }
      }
      
      // Third priority: at least different category
      if (bestIndex === -1) {
        for (let i = 0; i < remaining.length; i++) {
          const candidate = remaining[i];
          if (candidate.category_id !== lastProduct.category_id) {
            bestIndex = i;
            break;
          }
        }
      }
    }
    
    // Fallback: just take the first one
    if (bestIndex === -1) {
      bestIndex = 0;
    }
    
    result.push(remaining.splice(bestIndex, 1)[0]);
  }

  return result;
}
