export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface Advertiser {
  id: string;
  awin_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  awin_product_id: string;
  advertiser_id: string | null;
  category_id: string | null;
  original_title: string;
  description: string | null;
  image_url: string | null;
  product_url: string;
  affiliate_link: string;
  seo_title: string;
  seo_description: string | null;
  slug: string;
  original_price: number | null;
  sale_price: number | null;
  discount_percentage: number | null;
  currency: string;
  brand: string | null;
  merchant_category: string | null;
  availability: string;
  is_featured: boolean;
  is_active: boolean;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
  advertiser?: Advertiser;
}

export interface SyncLog {
  id: string;
  sync_type: 'full' | 'incremental' | 'manual';
  status: 'started' | 'completed' | 'failed';
  products_added: number;
  products_updated: number;
  products_removed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  total_products?: number;
  processed_products?: number;
  current_batch?: number;
  total_batches?: number;
}

export interface AwinSettings {
  id: string;
  publisher_id: string | null;
  api_key_configured: boolean;
  sync_enabled: boolean;
  sync_interval_hours: number;
  last_sync_at: string | null;
  seo_title_template: string;
  feed_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  advertiserIds?: string[];
  minDiscount?: number;
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'discount';
  page?: number;
  limit?: number;
}
