-- Add columns for product variations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS parent_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_value text;

-- Create index for faster variant lookups
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_product_id);

-- Create a function to extract base product name (without size)
CREATE OR REPLACE FUNCTION public.extract_base_product_name(title text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Remove size patterns like "Maat XS", "Maat M", "Maat L", etc.
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(title, '\s*,?\s*Maat\s+(string\s+)?[XXXSML]+(\s*,\s*top\s+[XXXSML]+)?', '', 'gi'),
      '\s*Maat\s+[XXXSML]+\s*$', '', 'gi'
    ),
    '\s+$', '', 'g'
  );
END;
$$;