export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advertisers: {
        Row: {
          awin_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          product_count: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          awin_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          product_count?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          awin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          product_count?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      awin_settings: {
        Row: {
          api_key_configured: boolean | null
          created_at: string
          feed_url: string | null
          id: string
          last_sync_at: string | null
          publisher_id: string | null
          seo_title_template: string | null
          sync_enabled: boolean | null
          sync_interval_hours: number | null
          updated_at: string
        }
        Insert: {
          api_key_configured?: boolean | null
          created_at?: string
          feed_url?: string | null
          id?: string
          last_sync_at?: string | null
          publisher_id?: string | null
          seo_title_template?: string | null
          sync_enabled?: boolean | null
          sync_interval_hours?: number | null
          updated_at?: string
        }
        Update: {
          api_key_configured?: boolean | null
          created_at?: string
          feed_url?: string | null
          id?: string
          last_sync_at?: string | null
          publisher_id?: string | null
          seo_title_template?: string | null
          sync_enabled?: boolean | null
          sync_interval_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          product_count: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          product_count?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          product_count?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          advertiser_id: string | null
          affiliate_link: string
          availability: string | null
          awin_product_id: string
          brand: string | null
          category_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          last_synced_at: string | null
          merchant_category: string | null
          original_price: number | null
          original_title: string
          parent_product_id: string | null
          product_url: string
          sale_price: number | null
          seo_description: string | null
          seo_title: string
          slug: string
          updated_at: string
          variant_value: string | null
        }
        Insert: {
          advertiser_id?: string | null
          affiliate_link: string
          availability?: string | null
          awin_product_id: string
          brand?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          last_synced_at?: string | null
          merchant_category?: string | null
          original_price?: number | null
          original_title: string
          parent_product_id?: string | null
          product_url: string
          sale_price?: number | null
          seo_description?: string | null
          seo_title: string
          slug: string
          updated_at?: string
          variant_value?: string | null
        }
        Update: {
          advertiser_id?: string | null
          affiliate_link?: string
          availability?: string | null
          awin_product_id?: string
          brand?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          last_synced_at?: string | null
          merchant_category?: string | null
          original_price?: number | null
          original_title?: string
          parent_product_id?: string | null
          product_url?: string
          sale_price?: number | null
          seo_description?: string | null
          seo_title?: string
          slug?: string
          updated_at?: string
          variant_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          current_batch: number | null
          error_message: string | null
          id: string
          processed_products: number | null
          products_added: number | null
          products_removed: number | null
          products_updated: number | null
          started_at: string
          status: string
          sync_type: string
          total_batches: number | null
          total_products: number | null
        }
        Insert: {
          completed_at?: string | null
          current_batch?: number | null
          error_message?: string | null
          id?: string
          processed_products?: number | null
          products_added?: number | null
          products_removed?: number | null
          products_updated?: number | null
          started_at?: string
          status: string
          sync_type: string
          total_batches?: number | null
          total_products?: number | null
        }
        Update: {
          completed_at?: string | null
          current_batch?: number | null
          error_message?: string | null
          id?: string
          processed_products?: number | null
          products_added?: number | null
          products_removed?: number | null
          products_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          total_batches?: number | null
          total_products?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_base_product_name: { Args: { title: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
