import type { Plugin } from 'vite';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  awin_product_id: string;
  original_title: string;
  seo_title: string;
  description: string | null;
  seo_description: string | null;
  image_url: string | null;
  affiliate_link: string;
  slug: string;
  original_price: number | null;
  sale_price: number | null;
  currency: string | null;
  brand: string | null;
  availability: string | null;
  category: { name: string } | null;
  advertiser: { name: string } | null;
}

function escapeXml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatPrice(price: number | null, currency: string | null): string {
  if (price === null) return "";
  const curr = currency || "EUR";
  return `${price.toFixed(2)} ${curr}`;
}

function mapAvailability(availability: string | null): string {
  switch (availability?.toLowerCase()) {
    case "in_stock":
    case "in stock":
      return "in_stock";
    case "out_of_stock":
    case "out of stock":
      return "out_of_stock";
    case "preorder":
      return "preorder";
    case "backorder":
      return "backorder";
    default:
      return "in_stock";
  }
}

function generateProductXml(product: Product, baseUrl: string): string {
  const productUrl = `${baseUrl}/deal/${product.slug}`;
  const price = product.sale_price ?? product.original_price;

  let itemXml = `    <item>
      <g:id>${escapeXml(product.awin_product_id)}</g:id>
      <title>${escapeXml(product.seo_title || product.original_title)}</title>
      <description>${escapeXml(product.seo_description || product.description || product.original_title)}</description>
      <link>${escapeXml(productUrl)}</link>
      <g:image_link>${escapeXml(product.image_url || "")}</g:image_link>
      <g:availability>${mapAvailability(product.availability)}</g:availability>
      <g:condition>new</g:condition>`;

  if (price !== null) {
    itemXml += `
      <g:price>${formatPrice(price, product.currency)}</g:price>`;
  }

  if (product.sale_price !== null && product.original_price !== null && product.sale_price < product.original_price) {
    itemXml += `
      <g:sale_price>${formatPrice(product.sale_price, product.currency)}</g:sale_price>`;
  }

  if (product.brand) {
    itemXml += `
      <g:brand>${escapeXml(product.brand)}</g:brand>`;
  } else if (product.advertiser?.name) {
    itemXml += `
      <g:brand>${escapeXml(product.advertiser.name)}</g:brand>`;
  }

  if (product.category?.name) {
    itemXml += `
      <g:product_type>${escapeXml(product.category.name)}</g:product_type>`;
  }

  itemXml += `
      <g:mpn>${escapeXml(product.awin_product_id)}</g:mpn>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`;

  return itemXml;
}

export function googleMerchantPlugin(): Plugin {
  return {
    name: 'google-merchant-feed',
    apply: 'build',
    async closeBundle() {
      console.log('Generating Google Merchant feed...');

      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const baseUrl = 'https://kortingdeal.nl';

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      try {
        // Fetch all active products
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id,
            awin_product_id,
            original_title,
            seo_title,
            description,
            seo_description,
            image_url,
            affiliate_link,
            slug,
            original_price,
            sale_price,
            currency,
            brand,
            availability,
            category:categories(name),
            advertiser:advertisers(name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching products:', error);
          return;
        }

        const productItems = (products || [])
          .map((p: any) => {
            // Handle joined data (arrays from Supabase)
            const product: Product = {
              ...p,
              category: Array.isArray(p.category) ? p.category[0] : p.category,
              advertiser: Array.isArray(p.advertiser) ? p.advertiser[0] : p.advertiser,
            };
            return generateProductXml(product, baseUrl);
          })
          .join('\n');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>KortingDeal.nl - Beste Deals &amp; Kortingen</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>De beste deals en kortingen van Nederland</description>
${productItems}
  </channel>
</rss>`;

        // Write to dist folder
        const distDir = path.resolve('dist');
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        const feedPath = path.join(distDir, 'google-merchant-feed.xml');
        fs.writeFileSync(feedPath, xml, 'utf-8');

        console.log(`Google Merchant feed generated: ${feedPath}`);
        console.log(`Total products: ${products?.length || 0}`);
      } catch (err) {
        console.error('Error generating Google Merchant feed:', err);
      }
    },
  };
}
