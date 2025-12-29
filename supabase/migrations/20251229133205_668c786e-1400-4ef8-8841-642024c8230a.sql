-- Add image dimension columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_width integer,
ADD COLUMN IF NOT EXISTS image_height integer;

-- Add index for filtering on image dimensions
CREATE INDEX IF NOT EXISTS idx_products_image_dimensions 
ON public.products(image_width, image_height) 
WHERE image_width IS NOT NULL AND image_height IS NOT NULL;