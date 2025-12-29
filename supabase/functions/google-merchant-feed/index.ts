import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

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
  category?: { name: string }[] | null;
  advertiser?: { name: string }[] | null;
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
  } else if (product.advertiser?.[0]?.name) {
    itemXml += `
      <g:brand>${escapeXml(product.advertiser[0].name)}</g:brand>`;
  }

  if (product.category?.[0]?.name) {
    itemXml += `
      <g:product_type>${escapeXml(product.category[0].name)}</g:product_type>`;
  }

  // Use awin_product_id as MPN since we don't have GTIN
  itemXml += `
      <g:mpn>${escapeXml(product.awin_product_id)}</g:mpn>
      <g:identifier_exists>false</g:identifier_exists>`;

  itemXml += `
    </item>`;

  return itemXml;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get base URL from request or use default
    const url = new URL(req.url);
    const baseUrl = url.searchParams.get("base_url") || "https://kortingdeal.nl";

    // Fetch all active products with category and advertiser
    const { data: products, error } = await supabase
      .from("products")
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
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    const productItems = (products || [])
      .map((p) => generateProductXml(p as Product, baseUrl))
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>KortingDeal.nl - Beste Deals &amp; Kortingen</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>De beste deals en kortingen van Nederland</description>
${productItems}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating feed:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(String(error))}</error>`,
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
