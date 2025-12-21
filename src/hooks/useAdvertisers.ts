import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Advertiser } from '@/types/database';

export function useAdvertisers() {
  return useQuery({
    queryKey: ['advertisers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data as Advertiser[];
    },
  });
}
