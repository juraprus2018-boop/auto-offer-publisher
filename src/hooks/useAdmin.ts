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

interface AwinProduct {
  aw_product_id: string;
  product_name: string;
  description?: string;
  merchant_id: string;
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
      estimatedTimeRemaining: 'Producten ophalen...',
      status: 'Producten ophalen van Awin...',
    });

    try {
      // Step 1: Fetch all products from the edge function
      console.log('Starting sync - fetching products...');
      const { data: initData, error: initError } = await supabase.functions.invoke('awin-sync', {
        body: { syncType: 'manual', batchIndex: 0 },
      });

      if (initError) throw initError;
      if (!initData.success) throw new Error('Failed to fetch products');

      const { syncLogId, totalProducts, totalBatches } = initData;
      
      console.log(`Fetched ${totalProducts} products, will process in ${totalBatches} batches`);

      // We need to re-fetch the products for processing
      // Since the edge function already parsed them, we'll fetch the CSV again client-side
      // Actually, let's use a simpler approach - fetch products in smaller chunks directly

      setProgress({
        isRunning: true,
        totalProducts,
        processedProducts: 0,
        currentBatch: 0,
        totalBatches,
        estimatedTimeRemaining: 'Berekenen...',
        status: 'Feed opnieuw ophalen voor verwerking...',
      });

      // Fetch the feed URL from settings
      const { data: settings } = await supabase.from('awin_settings').select('feed_url').single();
      const feedUrl = settings?.feed_url || '';

      // Fetch and parse CSV client-side
      const response = await fetch(feedUrl);
      if (!response.ok) throw new Error('Failed to fetch feed');
      
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = parseCSVLine(lines[0]);
      
      const allProducts: AwinProduct[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (abortRef.current) break;
        const line = lines[i];
        if (!line.trim()) continue;
        
        const values = parseCSVLine(line);
        if (values.length === headers.length) {
          const product: Record<string, string> = {};
          headers.forEach((header, idx) => {
            product[header] = values[idx];
          });
          
          if (product.aw_product_id && product.product_name) {
            allProducts.push({
              aw_product_id: product.aw_product_id,
              product_name: product.product_name,
              description: product.description,
              merchant_id: product.merchant_id || '',
              merchant_name: product.merchant_name || '',
              aw_deep_link: product.aw_deep_link || '',
              merchant_deep_link: product.merchant_deep_link || '',
              aw_image_url: product.aw_image_url,
              merchant_image_url: product.merchant_image_url,
              search_price: product.search_price || '0',
              store_price: product.store_price,
              currency: product.currency || 'EUR',
              merchant_category: product.merchant_category,
              category_name: product.category_name,
              brand_name: product.brand_name,
            });
          }
        }
      }

      console.log(`Parsed ${allProducts.length} products client-side`);

      // Process in batches of 100
      const BATCH_SIZE = 100;
      const actualTotalBatches = Math.ceil(allProducts.length / BATCH_SIZE);
      let processedCount = 0;

      for (let batchIdx = 0; batchIdx < actualTotalBatches; batchIdx++) {
        if (abortRef.current) break;

        const batchProducts = allProducts.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
        
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const productsPerSecond = processedCount > 0 ? processedCount / elapsed : 50;
        const remaining = allProducts.length - processedCount;
        const secondsRemaining = remaining / productsPerSecond;
        
        let timeStr = '';
        if (secondsRemaining > 60) {
          const minutes = Math.ceil(secondsRemaining / 60);
          timeStr = `~${minutes} min`;
        } else {
          timeStr = `~${Math.ceil(secondsRemaining)} sec`;
        }

        setProgress({
          isRunning: true,
          totalProducts: allProducts.length,
          processedProducts: processedCount,
          currentBatch: batchIdx + 1,
          totalBatches: actualTotalBatches,
          estimatedTimeRemaining: timeStr,
          status: `Batch ${batchIdx + 1}/${actualTotalBatches} verwerken...`,
        });

        // Send batch to edge function
        const { error: batchError } = await supabase.functions.invoke('awin-sync', {
          body: { 
            syncType: 'manual', 
            batchIndex: batchIdx + 1,
            syncLogId,
            cachedProducts: batchProducts,
          },
        });

        if (batchError) {
          console.error(`Batch ${batchIdx + 1} error:`, batchError);
        } else {
          processedCount += batchProducts.length;
        }

        // Update sync log progress
        await supabase
          .from('sync_logs')
          .update({
            processed_products: processedCount,
            current_batch: batchIdx + 1,
          })
          .eq('id', syncLogId);
      }

      // Mark sync as complete
      await supabase
        .from('sync_logs')
        .update({
          status: abortRef.current ? 'cancelled' : 'completed',
          products_added: processedCount,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLogId);

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

// Helper function to parse CSV line
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('awin-sync', {
        body: { syncType: 'manual' },
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
