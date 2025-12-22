import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductFilters } from '@/types/database';
import { shuffleNoDuplicateCategories } from '@/lib/shuffleProducts';

const ITEMS_PER_PAGE = 24;

export function useInfiniteProducts(
  filters: ProductFilters = {},
  categoryId?: string,
  shuffleKey?: string | number
) {
  return useInfiniteQuery({
    queryKey: ['infinite-products', filters, categoryId, shuffleKey],
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
          // Random-ish order for better category distribution (UUID order gives a good spread)
          query = query.order('id', { ascending: false });
      }

      // Pagination
      const useVarietyPool =
        !!shuffleKey &&
        !categoryId &&
        !filters.search &&
        filters.minPrice === undefined &&
        filters.maxPrice === undefined &&
        filters.minDiscount === undefined &&
        (!filters.advertiserIds || filters.advertiserIds.length === 0);

      // Fetch a larger pool for better category/brand mixing, then slice to the visible page size.
      // This prevents the "24 meest recente" (vaak dezelfde brand/categorie) effect.
      const poolSize = useVarietyPool ? ITEMS_PER_PAGE * 6 : ITEMS_PER_PAGE;

      const from = pageParam * poolSize;
      const to = from + poolSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const safeData = (data || []) as Product[];
      const mixed = categoryId ? safeData : shuffleNoDuplicateCategories(safeData);
      const pageProducts = useVarietyPool ? mixed.slice(0, ITEMS_PER_PAGE) : mixed;

      return {
        products: pageProducts as Product[],
        totalCount: count || 0,
        nextPage: safeData.length === poolSize ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
