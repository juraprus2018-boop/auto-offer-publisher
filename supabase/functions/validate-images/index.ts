import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Fetch image dimensions using HEAD request or fetch first bytes
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number } | null> {
  try {
    // Fetch just enough bytes to read image headers
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Range': 'bytes=0-65535', // Fetch first 64KB which should contain dimensions
      },
    });

    if (!response.ok) {
      console.log(`Failed to fetch image: ${imageUrl} - ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for PNG signature
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      // PNG: width at bytes 16-19, height at bytes 20-23
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      return { width, height };
    }

    // Check for JPEG signature
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      // JPEG: Need to parse markers to find SOF
      let i = 2;
      while (i < bytes.length - 9) {
        if (bytes[i] !== 0xFF) {
          i++;
          continue;
        }
        
        const marker = bytes[i + 1];
        
        // SOF markers (Start of Frame)
        if ((marker >= 0xC0 && marker <= 0xC3) || 
            (marker >= 0xC5 && marker <= 0xC7) ||
            (marker >= 0xC9 && marker <= 0xCB) ||
            (marker >= 0xCD && marker <= 0xCF)) {
          const height = (bytes[i + 5] << 8) | bytes[i + 6];
          const width = (bytes[i + 7] << 8) | bytes[i + 8];
          return { width, height };
        }
        
        // Skip to next marker
        const length = (bytes[i + 2] << 8) | bytes[i + 3];
        i += 2 + length;
      }
    }

    // Check for GIF signature
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      const width = bytes[6] | (bytes[7] << 8);
      const height = bytes[8] | (bytes[9] << 8);
      return { width, height };
    }

    // Check for WebP signature
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      // VP8 format
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
        const width = ((bytes[26] | (bytes[27] << 8)) & 0x3FFF);
        const height = ((bytes[28] | (bytes[29] << 8)) & 0x3FFF);
        return { width, height };
      }
      // VP8L format (lossless)
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4C) {
        const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
        const width = (bits & 0x3FFF) + 1;
        const height = ((bits >> 14) & 0x3FFF) + 1;
        return { width, height };
      }
    }

    console.log(`Unknown image format for: ${imageUrl}`);
    return null;
  } catch (error) {
    console.error(`Error fetching image dimensions for ${imageUrl}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const batchSize = parseInt(url.searchParams.get("batch_size") || "50");
    const dryRun = url.searchParams.get("dry_run") === "true";

    // Fetch products without image dimensions
    const { data: products, error } = await supabase
      .from("products")
      .select("id, image_url, awin_product_id")
      .eq("is_active", true)
      .not("image_url", "is", null)
      .is("image_width", null)
      .limit(batchSize);

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    console.log(`Found ${products?.length || 0} products without image dimensions`);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No products need image validation",
          processed: 0,
          remaining: 0
        }),
        { headers: corsHeaders }
      );
    }

    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      tooSmall: 0,
      details: [] as Array<{ id: string; width: number | null; height: number | null; status: string }>,
    };

    for (const product of products) {
      if (!product.image_url) continue;

      results.processed++;
      const dimensions = await getImageDimensions(product.image_url);

      if (dimensions) {
        const status = dimensions.width < 100 || dimensions.height < 100 ? "too_small" : "valid";
        if (status === "too_small") results.tooSmall++;

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ 
              image_width: dimensions.width, 
              image_height: dimensions.height 
            })
            .eq("id", product.id);

          if (updateError) {
            console.error(`Failed to update product ${product.id}:`, updateError);
            results.failed++;
          } else {
            results.updated++;
          }
        } else {
          results.updated++;
        }

        results.details.push({ 
          id: product.id, 
          width: dimensions.width, 
          height: dimensions.height,
          status
        });
      } else {
        results.failed++;
        results.details.push({ 
          id: product.id, 
          width: null, 
          height: null,
          status: "failed"
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check how many products still need processing
    const { count: remaining } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .not("image_url", "is", null)
      .is("image_width", null);

    console.log(`Processed: ${results.processed}, Updated: ${results.updated}, Failed: ${results.failed}, Too Small: ${results.tooSmall}, Remaining: ${remaining}`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        ...results,
        remaining: remaining || 0,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error validating images:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
