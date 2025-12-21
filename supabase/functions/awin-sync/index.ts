import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action, products, syncLogId } = body;

    console.log(`Action: ${action}, Products count: ${products?.length || 0}`);

    // Action: create-sync-log - Create a new sync log entry
    if (action === 'create-sync-log') {
      const { totalProducts } = body;
      
      const { data: syncLog, error } = await supabase
        .from('sync_logs')
        .insert({
          sync_type: 'manual',
          status: 'started',
          total_products: totalProducts,
          processed_products: 0,
          current_batch: 0,
          total_batches: Math.ceil(totalProducts / 100),
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Created sync log: ${syncLog.id}`);

      return new Response(
        JSON.stringify({ success: true, syncLogId: syncLog.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: upsert-batch - Upsert a batch of products
    if (action === 'upsert-batch') {
      if (!products || !Array.isArray(products)) {
        throw new Error('Products array is required');
      }

      const productData = products.map((p: ProductData) => {
        // Ensure slug is unique by appending awin_product_id
        const uniqueSlug = `${p.slug}-${p.awin_product_id}`;
        return {
          awin_product_id: p.awin_product_id,
          original_title: p.original_title,
          description: p.description?.substring(0, 5000),
          image_url: p.image_url,
          product_url: p.product_url,
          affiliate_link: p.affiliate_link,
          seo_title: p.seo_title,
          seo_description: p.seo_description,
          slug: uniqueSlug,
        original_price: p.original_price,
        sale_price: p.sale_price,
        discount_percentage: p.discount_percentage,
          currency: p.currency || 'EUR',
          brand: p.brand,
          merchant_category: p.merchant_category,
          category_id: p.category_id,
          availability: 'in_stock',
          is_active: true,
          is_featured: (p.discount_percentage || 0) >= 50,
          last_synced_at: new Date().toISOString(),
          variant_value: p.variant_value,
        };
      });

      const { error } = await supabase
        .from('products')
        .upsert(productData, {
          onConflict: 'awin_product_id',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }

      console.log(`Upserted ${products.length} products`);

      return new Response(
        JSON.stringify({ success: true, count: products.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: update-progress - Update sync log progress
    if (action === 'update-progress') {
      const { processedProducts, currentBatch } = body;

      await supabase
        .from('sync_logs')
        .update({
          processed_products: processedProducts,
          current_batch: currentBatch,
        })
        .eq('id', syncLogId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: complete-sync - Mark sync as complete
    if (action === 'complete-sync') {
      const { productsAdded, status = 'completed' } = body;

      await supabase
        .from('sync_logs')
        .update({
          status,
          products_added: productsAdded,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLogId);

      await supabase
        .from('awin_settings')
        .update({ last_sync_at: new Date().toISOString() })
        .not('id', 'is', null);

      console.log(`Sync ${status}: ${productsAdded} products`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: get-settings - Get feed URL and settings
    if (action === 'get-settings') {
      const { data: settings } = await supabase
        .from('awin_settings')
        .select('*')
        .single();

      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug');

      return new Response(
        JSON.stringify({ 
          success: true, 
          settings,
          categories: categories || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
