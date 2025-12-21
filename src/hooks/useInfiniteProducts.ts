import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductFilters } from '@/types/database';

const ITEMS_PER_PAGE = 24;

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
        .is('parent_product_id', null);

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

      // Sorting
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
          query = query.order('id');
      }

      // Pagination
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        products: data as Product[],
        totalCount: count || 0,
        nextPage: data && data.length === ITEMS_PER_PAGE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
