import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductFilters } from '@/types/database';

const ITEMS_PER_PAGE = 24;

// Shuffle products so no two consecutive products are from the same category
function shuffleNoDuplicateCategories(products: Product[]): Product[] {
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

export function useInfiniteProducts(filters: ProductFilters = {}, categoryId?: string) {
  return useInfiniteQuery({
    queryKey: ['infinite-products', filters, categoryId],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          advertiser:advertisers(*)
        `, { count: 'exact' })
        .eq('is_active', true)
        .is('parent_product_id', null)
        .is('variant_value', null);

      // Search filter
      if (filters.search) {
        query = query.or(`seo_title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
      }

      // Category filter
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Price filters
      if (filters.minPrice !== undefined) {
        query = query.gte('sale_price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('sale_price', filters.maxPrice);
      }

      // Discount filter
      if (filters.minDiscount !== undefined) {
        query = query.gte('discount_percentage', filters.minDiscount);
      }

      // Advertiser filter
      if (filters.advertiserIds && filters.advertiserIds.length > 0) {
        query = query.in('advertiser_id', filters.advertiserIds);
      }

      // Sorting - for category mixing, we fetch more and shuffle client-side when no specific sort
      switch (filters.sortBy) {
        case 'price_low':
          query = query.order('sale_price', { ascending: true, nullsFirst: false });
          break;
        case 'price_high':
          query = query.order('sale_price', { ascending: false, nullsFirst: false });
          break;
        case 'discount':
          query = query.order('discount_percentage', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          // Random-ish order for better category distribution
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Shuffle to avoid consecutive same-category products (only when not filtering by category)
      const shuffledProducts = categoryId ? data : shuffleNoDuplicateCategories(data as Product[]);

      return {
        products: shuffledProducts as Product[],
        totalCount: count || 0,
        nextPage: data && data.length === ITEMS_PER_PAGE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
