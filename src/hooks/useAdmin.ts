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
      estimatedTimeRemaining: 'Berekenen...',
    });

    let batchStart = 0;
    let isComplete = false;

    try {
      while (!isComplete && !abortRef.current) {
        const { data, error } = await supabase.functions.invoke('awin-sync', {
          body: { syncType: 'manual', batchStart },
        });

        if (error) throw error;

        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const productsPerSecond = data.processedProducts / elapsed;
        const remaining = data.totalProducts - data.processedProducts;
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
          totalProducts: data.totalProducts,
          processedProducts: data.processedProducts,
          currentBatch: data.currentBatch,
          totalBatches: data.totalBatches,
          estimatedTimeRemaining: timeStr,
        });

        isComplete = data.isComplete;
        if (!isComplete) {
          batchStart = data.nextBatchStart;
        }
      }

      setProgress(prev => ({ ...prev, isRunning: false }));
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['awin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });

      return { success: true };
    } catch (error) {
      setProgress(prev => ({ ...prev, isRunning: false }));
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
