import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { gunzip } from "https://deno.land/x/compress@v0.4.5/gzip/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse CSV text to array of objects
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // First line is headers
  const headers = parseCSVLine(lines[0]);
  const products: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const product: Record<string, string> = {};
      headers.forEach((header, idx) => {
        product[header] = values[idx];
      });
      products.push(product);
    }
  }
  
  return products;
}

// Parse a single CSV line handling quoted values
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
  in_stock?: string;
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

function generateSeoTitle(product: AwinProduct, template: string): string {
  const storePrice = parseFloat(product.store_price || '0');
  const searchPrice = parseFloat(product.search_price);
  const discountPercent = calculateDiscount(storePrice, searchPrice);

  let seoTitle = template
    .replace('[brand]', product.brand_name || product.merchant_name || '')
    .replace('[title]', product.product_name)
    .replace('[discount]', discountPercent.toString())
    .replace('[merchant]', product.merchant_name);

  // Clean up empty brackets and extra spaces
  seoTitle = seoTitle
    .replace(/\[\w+\]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*-\s*/, '')
    .replace(/\s*-\s*$/, '')
    .trim();

  return seoTitle.substring(0, 150);
}

function generateSeoDescription(product: AwinProduct): string {
  const storePrice = parseFloat(product.store_price || '0');
  const searchPrice = parseFloat(product.search_price);
  const discount = calculateDiscount(storePrice, searchPrice);

  let desc = product.description || product.product_name;
  
  if (discount > 0) {
    desc = `Bespaar ${discount}% op ${product.product_name}. ${desc}`;
  }

  return desc.substring(0, 160);
}

function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (!originalPrice || originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

function mapCategory(merchantCategory: string | undefined): string {
  if (!merchantCategory) return 'overig';

  const categoryMap: Record<string, string> = {
    'electronics': 'elektronica',
    'computers': 'elektronica',
    'phones': 'elektronica',
    'fashion': 'mode',
    'clothing': 'mode',
    'shoes': 'mode',
    'home': 'huis-tuin',
    'garden': 'huis-tuin',
    'furniture': 'huis-tuin',
    'sports': 'sport-vrije-tijd',
    'fitness': 'sport-vrije-tijd',
    'outdoor': 'sport-vrije-tijd',
    'beauty': 'beauty-gezondheid',
    'health': 'beauty-gezondheid',
    'cosmetics': 'beauty-gezondheid',
    'toys': 'speelgoed-games',
    'games': 'speelgoed-games',
    'gaming': 'speelgoed-games',
    'food': 'eten-drinken',
    'drinks': 'eten-drinken',
    'groceries': 'eten-drinken',
    'automotive': 'auto-motor',
    'car': 'auto-motor',
    'motorcycle': 'auto-motor',
    'travel': 'reizen',
    'holidays': 'reizen',
    'flights': 'reizen',
  };

  const lowerCategory = merchantCategory.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }

  return 'overig';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const awinApiKey = Deno.env.get('AWIN_API_KEY');
  const awinPublisherId = Deno.env.get('AWIN_PUBLISHER_ID');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { syncType = 'manual' } = await req.json().catch(() => ({}));

    console.log(`Starting ${syncType} sync...`);

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('sync_logs')
      .insert({
        sync_type: syncType,
        status: 'started',
      })
      .select()
      .single();

    if (syncLogError) {
      console.error('Failed to create sync log:', syncLogError);
      throw new Error('Failed to create sync log');
    }

    // Check API configuration
    if (!awinApiKey || !awinPublisherId) {
      console.error('AWIN API credentials not configured');
      
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: 'AWIN API credentials not configured. Stel AWIN_API_KEY en AWIN_PUBLISHER_ID in.',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      return new Response(
        JSON.stringify({ error: 'AWIN API credentials not configured. Stel AWIN_API_KEY en AWIN_PUBLISHER_ID in.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`API Key length: ${awinApiKey.length}, Publisher ID: ${awinPublisherId}`);

    // Update awin_settings to mark API as configured
    await supabase
      .from('awin_settings')
      .update({ 
        api_key_configured: true,
        publisher_id: awinPublisherId,
      })
      .not('id', 'is', null);

    // Get SEO title template
    const { data: settings } = await supabase
      .from('awin_settings')
      .select('seo_title_template')
      .single();

    const seoTemplate = settings?.seo_title_template || '[brand] [title] - [discount]% Korting | KortingDeal.nl';

    // Fetch products from Awin Product Feed API using direct datafeed URL
    // Using CSV format with gzip compression (what Awin datafeeds provide)
    console.log('Fetching products from Awin datafeed...');

    const awinUrl = 'https://productdata.awin.com/datafeed/download/apikey/cc2ecfcc47d7f52eb73791bc24cafe28/language/nl/cid/97,98,142,144,146,129,595,539,147,149,613,626,135,163,159,161,170,137,171,548,174,183,178,179,175,172,623,139,614,189,194,141,205,198,206,203,208,199,204,201,61,62,72,73,71,74,75,76,77,78,63,80,64,83,84,85,65,86,88,90,89,91,67,94,33,53,52,603,66,128,130,133,212,209,210,211,68,69,213,220,221,70,224,225,226,227,228,229,4,5,10,537,13,19,15,14,6,22,24,25,7,30,29,32,619,8,35,618,42,43,9,50,634,230,538,235,241,242,521,576,575,577,579,281,283,285,286,282,290,287,288,627,173,193,637,177,196,379,648,181,645,384,387,646,598,611,391,393,647,395,631,602,570,600,405,187,411,412,414,415,416,417,649,418,419,420,99,100,101,107,110,111,113,114,115,116,118,121,122,127,581,624,123,594,125,421,605,604,599,422,433,434,436,532,428,474,475,476,477,423,608,437,438,441,444,445,446,424,451,448,453,449,452,450,425,455,457,459,460,456,458,426,616,463,464,465,466,427,625,597,473,469,617,470,429,430,481,615,483,484,485,488,529,596,431,432,490,361,633,362,366,367,371,369,363,372,374,377,375,536,535,364,378,380,381,365,383,390,402,404,406,407,540,542,544,546,547,246,247,252,559,255,248,256,258,259,632,260,261,262,557,249,266,267,268,269,612,251,277,250,272,271,561,560,347,348,354,350,351,349,357,358,360,586,588,328,629,333,336,338,493,635,495,507,563,564,566,567,569,568/columns/aw_deep_link,product_name,aw_product_id,merchant_image_url,description,merchant_category,search_price,merchant_name,aw_image_url,currency,store_price,merchant_deep_link,category_name,brand_name/format/csv/delimiter/%2C/compression/gzip/';
    
    let products: AwinProduct[] = [];
    let lastError: string | null = null;
    
    try {
      console.log('Fetching gzipped CSV from Awin...');
      
      const response = await fetch(awinUrl, {
        headers: {
          'Accept-Encoding': 'gzip',
          'User-Agent': 'KortingDeal-Sync/1.0',
        },
      });

      console.log(`Awin response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Awin error response: ${errorText.substring(0, 500)}`);
        lastError = `Awin API fout (${response.status}): ${errorText.substring(0, 200)}`;
      } else {
        const contentType = response.headers.get('content-type') || '';
        const contentEncoding = response.headers.get('content-encoding') || '';
        console.log(`Content-Type: ${contentType}, Content-Encoding: ${contentEncoding}`);
        
        // Get response as arrayBuffer and decompress
        const compressedData = new Uint8Array(await response.arrayBuffer());
        console.log(`Received ${compressedData.length} bytes of compressed data`);
        
        let csvText: string;
        try {
          // Try to decompress
          const decompressed = gunzip(compressedData);
          csvText = new TextDecoder().decode(decompressed);
          console.log(`Decompressed to ${csvText.length} characters`);
        } catch (decompressError) {
          // Maybe it's not compressed, try reading directly
          console.log('Decompression failed, trying to read as plain text');
          csvText = new TextDecoder().decode(compressedData);
        }
        
        // Parse CSV
        const parsedProducts = parseCSV(csvText);
        console.log(`Parsed ${parsedProducts.length} products from CSV`);
        
        // Map to AwinProduct interface
        products = parsedProducts.map(p => ({
          aw_product_id: p.aw_product_id || '',
          product_name: p.product_name || '',
          description: p.description,
          merchant_id: p.merchant_id || '',
          merchant_name: p.merchant_name || '',
          aw_deep_link: p.aw_deep_link || '',
          merchant_deep_link: p.merchant_deep_link || '',
          aw_image_url: p.aw_image_url,
          merchant_image_url: p.merchant_image_url,
          search_price: p.search_price || '0',
          store_price: p.store_price,
          currency: p.currency || 'EUR',
          merchant_category: p.merchant_category,
          category_name: p.category_name,
          brand_name: p.brand_name,
        })).filter(p => p.aw_product_id && p.product_name);
        
        console.log(`Filtered to ${products.length} valid products`);
      }
    } catch (fetchError) {
      console.error('Error fetching from Awin:', fetchError);
      lastError = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
    }

    // If no products fetched, update sync log with detailed error
    if (products.length === 0 && lastError) {
      console.log(`No products fetched. Last error: ${lastError}`);
      
      await supabase
        .from('sync_logs')
        .update({
          status: 'completed',
          error_message: `Geen producten opgehaald: ${lastError}. Controleer of je de juiste Feed ID (fid) hebt ingesteld als AWIN_PUBLISHER_ID. Je kunt je feed IDs vinden in Awin dashboard onder Product Feeds.`,
          products_added: 0,
          products_updated: 0,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Geen producten opgehaald: ${lastError}`,
          hint: 'Controleer of AWIN_API_KEY correct is en AWIN_PUBLISHER_ID de juiste Feed ID is uit je Awin dashboard (Product Feeds sectie).',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get category mappings
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug');

    const categoryMap = new Map(categories?.map(c => [c.slug, c.id]) || []);

    let productsAdded = 0;
    let productsUpdated = 0;

    // Limit products to process (to stay within CPU limits)
    // We prioritize products with discounts
    const MAX_PRODUCTS = 500;
    const sortedProducts = products
      .map(p => ({
        ...p,
        discount: calculateDiscount(parseFloat(p.store_price || '0'), parseFloat(p.search_price))
      }))
      .sort((a, b) => b.discount - a.discount)
      .slice(0, MAX_PRODUCTS);

    console.log(`Processing ${sortedProducts.length} products (limited from ${products.length}, sorted by discount)`);

    // Process products in batches with bulk upsert
    const batchSize = 100;
    for (let i = 0; i < sortedProducts.length; i += batchSize) {
      const batch = sortedProducts.slice(i, i + batchSize);
      
      const productDataBatch = batch.map(product => {
        const categorySlug = mapCategory(product.merchant_category || product.category_name);
        const categoryId = categoryMap.get(categorySlug) || categoryMap.get('overig');

        const storePrice = parseFloat(product.store_price || '0');
        const salePrice = parseFloat(product.search_price);
        const discountPercentage = product.discount;

        return {
          awin_product_id: product.aw_product_id,
          original_title: product.product_name,
          description: product.description?.substring(0, 5000),
          image_url: product.aw_image_url || product.merchant_image_url,
          product_url: product.merchant_deep_link,
          affiliate_link: product.aw_deep_link,
          seo_title: generateSeoTitle(product, seoTemplate),
          seo_description: generateSeoDescription(product),
          slug: generateSlug(product.product_name, product.aw_product_id),
          original_price: storePrice > 0 ? storePrice : null,
          sale_price: salePrice,
          discount_percentage: discountPercentage > 0 ? discountPercentage : null,
          currency: product.currency || 'EUR',
          brand: product.brand_name || product.merchant_name,
          merchant_category: product.merchant_category || product.category_name,
          availability: 'in_stock',
          category_id: categoryId,
          is_active: true,
          is_featured: discountPercentage >= 50,
          last_synced_at: new Date().toISOString(),
        };
      });

      // Bulk upsert batch
      const { error } = await supabase
        .from('products')
        .upsert(productDataBatch, {
          onConflict: 'awin_product_id',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`Error upserting batch:`, error);
      } else {
        productsAdded += batch.length;
      }

      console.log(`Processed ${Math.min(i + batchSize, sortedProducts.length)} of ${sortedProducts.length} products`);
    }

    // Update sync log
    await supabase
      .from('sync_logs')
      .update({
        status: 'completed',
        products_added: productsAdded,
        products_updated: productsUpdated,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLog.id);

    // Update last sync time
    await supabase
      .from('awin_settings')
      .update({ last_sync_at: new Date().toISOString() })
      .not('id', 'is', null);

    console.log(`Sync completed. Added: ${productsAdded}, Updated: ${productsUpdated}`);

    return new Response(
      JSON.stringify({
        success: true,
        productsAdded,
        productsUpdated,
        totalProcessed: products.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
