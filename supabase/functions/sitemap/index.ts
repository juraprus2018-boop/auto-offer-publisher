import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://kortingdeal.nl';
const FUNCTION_URL = 'https://ugzhiztkzeyhpybnsgnj.supabase.co/functions/v1/sitemap';
const PRODUCTS_PER_SITEMAP = 10000;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'index';
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    console.log(`Generating sitemap: type=${type}, page=${page}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let xml = '';

    switch (type) {
      case 'index':
        xml = await generateSitemapIndex(supabase);
        break;
      case 'static':
        xml = generateStaticSitemap();
        break;
      case 'categories':
        xml = await generateCategoriesSitemap(supabase);
        break;
      case 'products':
        xml = await generateProductsSitemap(supabase, page);
        break;
      default:
        throw new Error('Invalid sitemap type');
    }

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sitemap generation error:', errorMessage);
    return new Response(`Error generating sitemap: ${errorMessage}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function generateSitemapIndex(supabase: any): Promise<string> {
  // Get total product count to calculate number of product sitemaps
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('parent_product_id', null)
    .is('variant_value', null);

  if (error) {
    console.error('Error getting product count:', error);
    throw error;
  }

  const totalProducts = count || 0;
  const productSitemapCount = Math.ceil(totalProducts / PRODUCTS_PER_SITEMAP);
  const now = new Date().toISOString().split('T')[0];

  console.log(`Total products: ${totalProducts}, Product sitemaps needed: ${productSitemapCount}`);

  let sitemaps = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${FUNCTION_URL}?type=static</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${FUNCTION_URL}?type=categories</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`;

  // Add product sitemaps
  for (let i = 1; i <= productSitemapCount; i++) {
    sitemaps += `
  <sitemap>
    <loc>${FUNCTION_URL}?type=products&amp;page=${i}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`;
  }

  sitemaps += `
</sitemapindex>`;

  return sitemaps;
}

function generateStaticSitemap(): string {
  const now = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/deals</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/categorien</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
}

async function generateCategoriesSitemap(supabase: any): Promise<string> {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  console.log(`Generating categories sitemap with ${categories?.length || 0} categories`);

  let urls = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const category of categories || []) {
    const lastmod = category.updated_at 
      ? new Date(category.updated_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    urls += `
  <url>
    <loc>${SITE_URL}/categorie/${escapeXml(category.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  urls += `
</urlset>`;

  return urls;
}

async function generateProductsSitemap(supabase: any, page: number): Promise<string> {
  const offset = (page - 1) * PRODUCTS_PER_SITEMAP;

  console.log(`Fetching products for sitemap page ${page}, offset ${offset}`);

  const { data: products, error } = await supabase
    .from('products')
    .select('slug, updated_at, discount_percentage')
    .eq('is_active', true)
    .is('parent_product_id', null)
    .is('variant_value', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + PRODUCTS_PER_SITEMAP - 1);

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  console.log(`Generating products sitemap page ${page} with ${products?.length || 0} products`);

  let urls = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const product of products || []) {
    const lastmod = product.updated_at 
      ? new Date(product.updated_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Higher priority for products with bigger discounts
    const priority = product.discount_percentage && product.discount_percentage >= 50 
      ? '0.8' 
      : product.discount_percentage && product.discount_percentage >= 30 
        ? '0.6' 
        : '0.5';

    urls += `
  <url>
    <loc>${SITE_URL}/deal/${escapeXml(product.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }

  urls += `
</urlset>`;

  return urls;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
