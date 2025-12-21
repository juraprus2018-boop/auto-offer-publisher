import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AwinSettings, SyncLog } from '@/types/database';

export function useAwinSettings() {
  return useQuery({
    queryKey: ['awin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('awin_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      return data as AwinSettings;
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
