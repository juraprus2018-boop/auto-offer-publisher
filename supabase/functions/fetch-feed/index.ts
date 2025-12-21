import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { gunzip } from "https://deno.land/x/compress@v0.4.5/gzip/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { chunkIndex = 0, chunkSize = 5000 } = body;

    console.log(`Fetching feed chunk ${chunkIndex} (size: ${chunkSize})...`);

    // Get feed URL
    const { data: settings } = await supabase
      .from('awin_settings')
      .select('feed_url')
      .single();

    const feedUrl = settings?.feed_url;
    if (!feedUrl) {
      throw new Error('Feed URL not configured');
    }

    // Fetch the feed
    console.log('Fetching from Awin...');
    const response = await fetch(feedUrl, {
      headers: {
        'Accept-Encoding': 'gzip',
        'User-Agent': 'KortingDeal-Sync/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Awin API error: ${response.status}`);
    }

    const compressedData = new Uint8Array(await response.arrayBuffer());
    console.log(`Received ${compressedData.length} bytes`);

    // Decompress
    let csvText: string;
    try {
      const decompressed = gunzip(compressedData);
      csvText = new TextDecoder().decode(decompressed);
    } catch {
      csvText = new TextDecoder().decode(compressedData);
    }

    console.log(`Decompressed to ${csvText.length} chars`);

    // Parse CSV headers and count lines
    const lines = csvText.split('\n');
    const headers = parseCSVLine(lines[0]);
    const totalProducts = lines.length - 1; // minus header

    // Calculate chunk range
    const startIdx = 1 + (chunkIndex * chunkSize); // +1 to skip header
    const endIdx = Math.min(startIdx + chunkSize, lines.length);

    console.log(`Processing lines ${startIdx} to ${endIdx} of ${lines.length}`);

    const products: Record<string, string>[] = [];
    for (let i = startIdx; i < endIdx; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const values = parseCSVLine(line);
      if (values.length === headers.length) {
        const product: Record<string, string> = {};
        headers.forEach((header, idx) => {
          product[header] = values[idx];
        });
        if (product.aw_product_id && product.product_name) {
          products.push(product);
        }
      }
    }

    console.log(`Parsed ${products.length} products for this chunk`);

    const hasMore = endIdx < lines.length;

    return new Response(
      JSON.stringify({
        success: true,
        products,
        totalProducts,
        chunkIndex,
        hasMore,
        nextChunkIndex: hasMore ? chunkIndex + 1 : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
