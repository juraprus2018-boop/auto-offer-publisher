import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AwinSettings, SyncLog } from '@/types/database';
import { useState, useCallback, useRef } from 'react';

export function useAwinSettings() {
  return useQuery({
    queryKey: ['awin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('awin_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as AwinSettings | null;
    },
  });
}

export function useUpdateFeedUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedUrl: string) => {
      const { error } = await supabase
        .from('awin_settings')
        .update({ feed_url: feedUrl })
        .not('id', 'is', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awin-settings'] });
    },
  });
}

export function useSyncLogs(limit = 10) {
  return useQuery({
    queryKey: ['sync-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as SyncLog[];
    },
  });
}

export function useActiveSyncLog() {
  return useQuery({
    queryKey: ['active-sync-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('status', 'started')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as SyncLog | null;
    },
    refetchInterval: 2000, // Poll every 2 seconds when active
  });
}

interface SyncProgress {
  isRunning: boolean;
  totalProducts: number;
  processedProducts: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: string;
  status: string;
}

interface RawProduct {
  aw_product_id: string;
  product_name: string;
  description?: string;
  merchant_name: string;
  aw_deep_link: string;
  merchant_deep_link: string;
  aw_image_url?: string;
  merchant_image_url?: string;
  search_price: string;
  store_price?: string;
  currency: string;
  merchant_category?: string;
  category_name?: string;
  brand_name?: string;
}

interface ProcessedProduct {
  awin_product_id: string;
  original_title: string;
  description?: string;
  image_url?: string;
  product_url: string;
  affiliate_link: string;
  seo_title: string;
  seo_description?: string;
  slug: string;
  original_price?: number;
  sale_price: number;
  discount_percentage?: number;
  currency: string;
  brand?: string;
  merchant_category?: string;
  category_id?: string;
  variant_value?: string;
}

function generateSlug(title: string, productId: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  return `${slug}-${productId.substring(0, 8)}`;
}

function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (!originalPrice || originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

function mapCategory(merchantCategory: string | undefined, categoryName: string | undefined): string {
  const text = `${merchantCategory || ''} ${categoryName || ''}`.toLowerCase();
  
  if (text.match(/electr|comput|phone|laptop|tablet|tv|audio|camera|gaming|console|smartphone|telefoon|pc|monitor/)) {
    return 'elektronica';
  }
  if (text.match(/fashion|cloth|shoe|dress|shirt|pants|jacket|underwear|lingerie|bikini|swim|jeans|kleding|schoenen|mode|accessoir/)) {
    return 'mode';
  }
  if (text.match(/home|garden|furniture|kitchen|bathroom|bedroom|decor|lighting|tuin|huis|meubel|woon|interieur/)) {
    return 'huis-tuin';
  }
  if (text.match(/sport|fitness|outdoor|camping|cycling|running|gym|fiets|hardloop/)) {
    return 'sport-vrije-tijd';
  }
  if (text.match(/beauty|health|cosmetic|makeup|skincare|parfum|wellness|gezondheid|verzorging/)) {
    return 'beauty-gezondheid';
  }
  if (text.match(/toy|game|lego|puzzle|kids|children|baby|speelgoed|spel/)) {
    return 'speelgoed-games';
  }
  if (text.match(/food|drink|grocery|wine|beer|coffee|tea|chocolate|eten|drinken|voeding/)) {
    return 'eten-drinken';
  }
  if (text.match(/auto|car|motor|bike|vehicle|tire|accessoir.*auto|onderdel/)) {
    return 'auto-motor';
  }
  if (text.match(/travel|hotel|flight|holiday|vacation|reis|vakantie|vlieg/)) {
    return 'reizen';
  }

  return 'overig';
}

function processProduct(
  raw: RawProduct,
  categoryMap: Map<string, string>,
  seoTemplate: string
): ProcessedProduct {
  const storePrice = parseFloat(raw.store_price || '0');
  const salePrice = parseFloat(raw.search_price);
  const discountPercentage = calculateDiscount(storePrice, salePrice);
  const categorySlug = mapCategory(raw.merchant_category, raw.category_name);
  const categoryId = categoryMap.get(categorySlug) || categoryMap.get('overig');

  // Extract variant
  const sizeMatch = raw.product_name.match(/\s*,?\s*Maat\s+((?:string\s+)?[XXXSML]+(?:\s*,\s*top\s+[XXXSML]+)?)\s*$/i);
  const variant = sizeMatch ? sizeMatch[1].trim() : null;

  // Generate SEO title
  let seoTitle = seoTemplate
    .replace('[brand]', raw.brand_name || raw.merchant_name || '')
    .replace('[title]', raw.product_name)
    .replace('[discount]', discountPercentage.toString())
    .replace('[merchant]', raw.merchant_name)
    .replace(/\[\w+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 150);

  return {
    awin_product_id: raw.aw_product_id,
    original_title: raw.product_name,
    description: raw.description,
    image_url: raw.aw_image_url || raw.merchant_image_url,
    product_url: raw.merchant_deep_link,
    affiliate_link: raw.aw_deep_link,
    seo_title: seoTitle,
    seo_description: `${discountPercentage > 0 ? `Bespaar ${discountPercentage}% op ` : ''}${raw.product_name}`.substring(0, 160),
    slug: generateSlug(raw.product_name, raw.aw_product_id),
    original_price: storePrice > 0 ? storePrice : undefined,
    sale_price: salePrice,
    discount_percentage: discountPercentage > 0 ? discountPercentage : undefined,
    currency: raw.currency || 'EUR',
    brand: raw.brand_name || raw.merchant_name,
    merchant_category: raw.merchant_category || raw.category_name,
    category_id: categoryId,
    variant_value: variant,
  };
}

export function useBatchSync() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<SyncProgress>({
    isRunning: false,
    totalProducts: 0,
    processedProducts: 0,
    currentBatch: 0,
    totalBatches: 0,
    estimatedTimeRemaining: '',
    status: '',
  });
  const abortRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  const startSync = useCallback(async () => {
    abortRef.current = false;
    startTimeRef.current = Date.now();
    setProgress({
      isRunning: true,
      totalProducts: 0,
      processedProducts: 0,
      currentBatch: 0,
      totalBatches: 0,
      estimatedTimeRemaining: 'Voorbereiden...',
      status: 'Settings ophalen...',
    });

    try {
      // Step 1: Get settings and categories
      console.log('Fetching settings...');
      const { data: settingsData, error: settingsError } = await supabase.functions.invoke('awin-sync', {
        body: { action: 'get-settings' },
      });

      if (settingsError) throw settingsError;

      const seoTemplate = settingsData.settings?.seo_title_template || '[brand] [title] - [discount]% Korting | KortingDeal.nl';
      const categoryMap = new Map<string, string>(
        settingsData.categories.map((c: { id: string; slug: string }) => [c.slug, c.id])
      );

      // Step 2: Fetch products in chunks from edge function
      const allProducts: RawProduct[] = [];
      let chunkIndex = 0;
      let hasMore = true;
      const CHUNK_SIZE = 3000;

      setProgress(prev => ({ ...prev, status: 'Feed ophalen van Awin...' }));

      while (hasMore && !abortRef.current) {
        console.log(`Fetching chunk ${chunkIndex}...`);

        const { data: chunkData, error: chunkError } = await supabase.functions.invoke('fetch-feed', {
          body: { chunkIndex, chunkSize: CHUNK_SIZE },
        });

        if (chunkError) throw chunkError;

        allProducts.push(...chunkData.products);
        hasMore = chunkData.hasMore;
        chunkIndex++;

        setProgress(prev => ({
          ...prev,
          status: `Feed ophalen... ${allProducts.length} producten`,
          totalProducts: chunkData.totalProducts,
        }));
      }

      if (abortRef.current) {
        setProgress(prev => ({ ...prev, isRunning: false, status: 'Geannuleerd' }));
        return;
      }

      console.log(`Total products fetched: ${allProducts.length}`);

      // Step 3: Create sync log
      const { data: syncLogData, error: syncLogError } = await supabase.functions.invoke('awin-sync', {
        body: { action: 'create-sync-log', totalProducts: allProducts.length },
      });

      if (syncLogError) throw syncLogError;
      const syncLogId = syncLogData.syncLogId;

      // Step 4: Process and upsert in batches
      const BATCH_SIZE = 100;
      const totalBatches = Math.ceil(allProducts.length / BATCH_SIZE);
      let processedCount = 0;

      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        if (abortRef.current) break;

        const batchProducts = allProducts.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
        const processedBatch = batchProducts.map(p => processProduct(p, categoryMap, seoTemplate));

        // Calculate time remaining
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const productsPerSecond = processedCount > 0 ? processedCount / elapsed : 50;
        const remaining = allProducts.length - processedCount;
        const secondsRemaining = remaining / productsPerSecond;

        let timeStr = '';
        if (secondsRemaining > 60) {
          timeStr = `~${Math.ceil(secondsRemaining / 60)} min`;
        } else {
          timeStr = `~${Math.ceil(secondsRemaining)} sec`;
        }

        setProgress({
          isRunning: true,
          totalProducts: allProducts.length,
          processedProducts: processedCount,
          currentBatch: batchIdx + 1,
          totalBatches,
          estimatedTimeRemaining: timeStr,
          status: `Batch ${batchIdx + 1}/${totalBatches} importeren...`,
        });

        // Send batch to edge function
        const { error: batchError } = await supabase.functions.invoke('awin-sync', {
          body: {
            action: 'upsert-batch',
            products: processedBatch,
            syncLogId,
          },
        });

        if (batchError) {
          console.error(`Batch ${batchIdx + 1} error:`, batchError);
        } else {
          processedCount += batchProducts.length;
        }

        // Update progress every 5 batches
        if (batchIdx % 5 === 0) {
          await supabase.functions.invoke('awin-sync', {
            body: {
              action: 'update-progress',
              syncLogId,
              processedProducts: processedCount,
              currentBatch: batchIdx + 1,
            },
          });
        }
      }

      // Step 5: Complete sync
      await supabase.functions.invoke('awin-sync', {
        body: {
          action: 'complete-sync',
          syncLogId,
          productsAdded: processedCount,
          status: abortRef.current ? 'cancelled' : 'completed',
        },
      });

      setProgress(prev => ({
        ...prev,
        isRunning: false,
        processedProducts: processedCount,
        status: abortRef.current ? 'Geannuleerd' : 'Voltooid!',
      }));

      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['awin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-products'] });

      return { success: true, processedCount };
    } catch (error) {
      console.error('Sync error:', error);
      setProgress(prev => ({ ...prev, isRunning: false, status: 'Fout opgetreden' }));
      throw error;
    }
  }, [queryClient]);

  const stopSync = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { startSync, stopSync, progress };
}

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('awin-sync', {
        body: { action: 'get-settings' },
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['awin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: ['product-stats'],
    queryFn: async () => {
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: featuredProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_featured', true);

      const { count: advertisersCount } = await supabase
        .from('advertisers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      return {
        totalProducts: totalProducts || 0,
        featuredProducts: featuredProducts || 0,
        advertisersCount: advertisersCount || 0,
      };
    },
  });
}
