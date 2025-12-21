import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductFilters } from '@/types/database';

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          advertiser:advertisers(*)
        `)
        .eq('is_active', true);

      // Search filter
      if (filters.search) {
        query = query.or(`seo_title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
      }

      // Category filter
      if (filters.categorySlug) {
        query = query.eq('category.slug', filters.categorySlug);
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
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 24;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        products: data as Product[],
        totalCount: count || 0,
        page,
        limit,
      };
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          advertiser:advertisers(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return data as Product;
    },
    enabled: !!slug,
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ['featured-products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          advertiser:advertisers(*)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as Product[];
    },
  });
}

export function useTopDeals(limit = 12) {
  return useQuery({
    queryKey: ['top-deals', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          advertiser:advertisers(*)
        `)
        .eq('is_active', true)
        .not('discount_percentage', 'is', null)
        .order('discount_percentage', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as Product[];
    },
  });
}

export function useRecentProducts(limit = 12) {
  return useQuery({
    queryKey: ['recent-products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          advertiser:advertisers(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as Product[];
    },
  });
}
