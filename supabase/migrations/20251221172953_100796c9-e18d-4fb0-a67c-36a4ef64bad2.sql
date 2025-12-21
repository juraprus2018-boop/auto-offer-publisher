-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create advertisers table (Awin merchants)
CREATE TABLE public.advertisers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  awin_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  awin_product_id TEXT NOT NULL UNIQUE,
  advertiser_id UUID REFERENCES public.advertisers(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Original product data from Awin
  original_title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_url TEXT NOT NULL,
  affiliate_link TEXT NOT NULL,
  
  -- SEO optimized title (template-based)
  seo_title TEXT NOT NULL,
  seo_description TEXT,
  slug TEXT NOT NULL UNIQUE,
  
  -- Pricing
  original_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  discount_percentage INTEGER,
  currency TEXT DEFAULT 'EUR',
  
  -- Additional data
  brand TEXT,
  merchant_category TEXT,
  availability TEXT DEFAULT 'in_stock',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sync_logs table
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'manual'
  status TEXT NOT NULL, -- 'started', 'completed', 'failed'
  products_added INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_removed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create awin_settings table for storing API configuration
CREATE TABLE public.awin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publisher_id TEXT,
  api_key_configured BOOLEAN DEFAULT false,
  sync_enabled BOOLEAN DEFAULT true,
  sync_interval_hours INTEGER DEFAULT 24,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  seo_title_template TEXT DEFAULT '[brand] [title] - [discount]% Korting | KortingDeal.nl',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read access for products)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awin_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies for frontend
CREATE POLICY "Categories are publicly viewable" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Advertisers are publicly viewable" 
ON public.advertisers FOR SELECT 
USING (true);

CREATE POLICY "Active products are publicly viewable" 
ON public.products FOR SELECT 
USING (is_active = true);

-- Service role policies for edge functions (full access)
CREATE POLICY "Service role can manage categories" 
ON public.categories FOR ALL 
USING (true);

CREATE POLICY "Service role can manage advertisers" 
ON public.advertisers FOR ALL 
USING (true);

CREATE POLICY "Service role can manage products" 
ON public.products FOR ALL 
USING (true);

CREATE POLICY "Service role can manage sync_logs" 
ON public.sync_logs FOR ALL 
USING (true);

CREATE POLICY "Service role can manage awin_settings" 
ON public.awin_settings FOR ALL 
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_advertiser ON public.products(advertiser_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_discount ON public.products(discount_percentage DESC);
CREATE INDEX idx_products_sale_price ON public.products(sale_price);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- Create full text search index on products
CREATE INDEX idx_products_search ON public.products 
USING gin(to_tsvector('dutch', coalesce(seo_title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, '')));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertisers_updated_at
BEFORE UPDATE ON public.advertisers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_awin_settings_updated_at
BEFORE UPDATE ON public.awin_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default awin settings
INSERT INTO public.awin_settings (id) VALUES (gen_random_uuid());

-- Insert some default categories
INSERT INTO public.categories (name, slug, icon) VALUES
('Elektronica', 'elektronica', 'Smartphone'),
('Mode', 'mode', 'Shirt'),
('Huis & Tuin', 'huis-tuin', 'Home'),
('Sport & Vrije tijd', 'sport-vrije-tijd', 'Dumbbell'),
('Beauty & Gezondheid', 'beauty-gezondheid', 'Heart'),
('Speelgoed & Games', 'speelgoed-games', 'Gamepad2'),
('Eten & Drinken', 'eten-drinken', 'UtensilsCrossed'),
('Auto & Motor', 'auto-motor', 'Car'),
('Reizen', 'reizen', 'Plane'),
('Overig', 'overig', 'MoreHorizontal');