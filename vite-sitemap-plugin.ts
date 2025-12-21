import type { Plugin } from 'vite';

const SUPABASE_FUNCTION_URL = 'https://ugzhiztkzeyhpybnsgnj.supabase.co/functions/v1/sitemap';

async function fetchSitemap(type: string, page?: number): Promise<string> {
  const url = page 
    ? `${SUPABASE_FUNCTION_URL}?type=${type}&page=${page}`
    : `${SUPABASE_FUNCTION_URL}?type=${type}`;
  
  console.log(`Fetching sitemap: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap ${type}: ${response.statusText}`);
  }
  return response.text();
}

async function generateSitemaps(): Promise<Map<string, string>> {
  const sitemaps = new Map<string, string>();
  
  try {
    // Fetch the sitemap index to know how many product pages there are
    const indexXml = await fetchSitemap('index');
    
    // Parse the index to find product sitemap count
    const productPageMatches = indexXml.match(/type=products&amp;page=(\d+)/g) || [];
    const maxPage = productPageMatches.length > 0 
      ? Math.max(...productPageMatches.map(m => parseInt(m.match(/page=(\d+)/)?.[1] || '1')))
      : 1;
    
    console.log(`Found ${maxPage} product sitemap pages`);
    
    // Generate sitemap index with local URLs
    const localIndexXml = indexXml
      .replace(/https:\/\/ugzhiztkzeyhpybnsgnj\.supabase\.co\/functions\/v1\/sitemap\?type=static/g, 'https://kortingdeal.nl/sitemap-static.xml')
      .replace(/https:\/\/ugzhiztkzeyhpybnsgnj\.supabase\.co\/functions\/v1\/sitemap\?type=categories/g, 'https://kortingdeal.nl/sitemap-categories.xml')
      .replace(/https:\/\/ugzhiztkzeyhpybnsgnj\.supabase\.co\/functions\/v1\/sitemap\?type=products&amp;page=(\d+)/g, 'https://kortingdeal.nl/sitemap-products-$1.xml');
    
    sitemaps.set('sitemap.xml', localIndexXml);
    
    // Fetch static sitemap
    const staticXml = await fetchSitemap('static');
    sitemaps.set('sitemap-static.xml', staticXml);
    
    // Fetch categories sitemap
    const categoriesXml = await fetchSitemap('categories');
    sitemaps.set('sitemap-categories.xml', categoriesXml);
    
    // Fetch all product sitemaps
    for (let page = 1; page <= maxPage; page++) {
      const productsXml = await fetchSitemap('products', page);
      sitemaps.set(`sitemap-products-${page}.xml`, productsXml);
      console.log(`Generated sitemap-products-${page}.xml`);
    }
    
    console.log(`Generated ${sitemaps.size} sitemap files`);
    
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    throw error;
  }
  
  return sitemaps;
}

export function sitemapPlugin(): Plugin {
  return {
    name: 'vite-sitemap-plugin',
    apply: 'build',
    async generateBundle() {
      console.log('Generating static sitemaps...');
      
      try {
        const sitemaps = await generateSitemaps();
        
        for (const [filename, content] of sitemaps) {
          this.emitFile({
            type: 'asset',
            fileName: filename,
            source: content,
          });
          console.log(`Emitted ${filename}`);
        }
        
        console.log('Sitemap generation complete!');
      } catch (error) {
        console.error('Failed to generate sitemaps:', error);
        // Don't fail the build, just warn
        console.warn('Build will continue without sitemaps');
      }
    },
  };
}
