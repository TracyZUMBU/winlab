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
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      grocery_list_items: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          is_checked: boolean
          quantity: number
          unit_id: string
          week_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          is_checked?: boolean
          quantity: number
          unit_id: string
          week_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          is_checked?: boolean
          quantity?: number
          unit_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_list_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_items_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "meal_prep_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          category_id: string | null
          created_at: string
          default_unit_id: string | null
          id: string
          name: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          default_unit_id?: string | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          default_unit_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ingredient_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      lotteries: {
        Row: {
          brand_id: string
          category: string | null
          created_at: string
          description: string | null
          draw_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          number_of_winners: number
          short_description: string | null
          slug: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["lottery_status"]
          ticket_cost: number
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          draw_at: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          number_of_winners?: number
          short_description?: string | null
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["lottery_status"]
          ticket_cost: number
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          draw_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          number_of_winners?: number
          short_description?: string | null
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["lottery_status"]
          ticket_cost?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotteries_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_tickets: {
        Row: {
          created_at: string
          id: string
          lottery_id: string
          purchased_at: string
          status: Database["public"]["Enums"]["lottery_ticket_status"]
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lottery_id: string
          purchased_at?: string
          status?: Database["public"]["Enums"]["lottery_ticket_status"]
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lottery_id?: string
          purchased_at?: string
          status?: Database["public"]["Enums"]["lottery_ticket_status"]
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lottery_tickets_lottery_id_fkey"
            columns: ["lottery_id"]
            isOneToOne: false
            referencedRelation: "lotteries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_wallet_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lottery_tickets_wallet_transaction_fk"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_winners: {
        Row: {
          created_at: string
          id: string
          lottery_id: string
          position: number
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lottery_id: string
          position: number
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lottery_id?: string
          position?: number
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lottery_winners_lottery_id_fkey"
            columns: ["lottery_id"]
            isOneToOne: false
            referencedRelation: "lotteries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_winners_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "lottery_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_wallet_balance"
            referencedColumns: ["user_id"]
          },
        ]
      }
      meal_prep_weeks: {
        Row: {
          created_at: string
          id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      mission_completions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          proof_data: Json
          reviewed_at: string | null
          reward_transaction_id: string | null
          status: Database["public"]["Enums"]["mission_completion_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          proof_data?: Json
          reviewed_at?: string | null
          reward_transaction_id?: string | null
          status?: Database["public"]["Enums"]["mission_completion_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          proof_data?: Json
          reviewed_at?: string | null
          reward_transaction_id?: string | null
          status?: Database["public"]["Enums"]["mission_completion_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_completions_reward_fk"
            columns: ["reward_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_wallet_balance"
            referencedColumns: ["user_id"]
          },
        ]
      }
      missions: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          max_completions_per_user: number
          max_completions_total: number | null
          metadata: Json
          mission_type: Database["public"]["Enums"]["mission_type"]
          starts_at: string | null
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          token_reward: number
          updated_at: string
          validation_mode: Database["public"]["Enums"]["mission_validation_mode"]
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          max_completions_per_user?: number
          max_completions_total?: number | null
          metadata?: Json
          mission_type: Database["public"]["Enums"]["mission_type"]
          starts_at?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title: string
          token_reward: number
          updated_at?: string
          validation_mode?: Database["public"]["Enums"]["mission_validation_mode"]
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          max_completions_per_user?: number
          max_completions_total?: number | null
          metadata?: Json
          mission_type?: Database["public"]["Enums"]["mission_type"]
          starts_at?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title?: string
          token_reward?: number
          updated_at?: string
          validation_mode?: Database["public"]["Enums"]["mission_validation_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "missions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          referral_code: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          referral_code?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          referral_code?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          quantity: number
          recipe_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          quantity: number
          recipe_id: string
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          quantity?: number
          recipe_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          base_servings: number
          calories: number | null
          created_at: string
          external_url: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          meal_type: string | null
          name: string
          notes: string | null
          youtube_url: string | null
        }
        Insert: {
          base_servings: number
          calories?: number | null
          created_at?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          meal_type?: string | null
          name: string
          notes?: string | null
          youtube_url?: string | null
        }
        Update: {
          base_servings?: number
          calories?: number | null
          created_at?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          meal_type?: string | null
          name?: string
          notes?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          qualified_at: string | null
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          reward_transaction_id: string | null
          status: Database["public"]["Enums"]["referral_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          qualified_at?: string | null
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          reward_transaction_id?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          qualified_at?: string | null
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
          reward_transaction_id?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "user_wallet_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "user_wallet_balance"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_reward_transaction_fk"
            columns: ["reward_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          label: string
          type: Database["public"]["Enums"]["unit_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          type: Database["public"]["Enums"]["unit_type"]
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          type?: Database["public"]["Enums"]["unit_type"]
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          direction: Database["public"]["Enums"]["wallet_direction"]
          id: string
          reference_id: string | null
          reference_type:
            | Database["public"]["Enums"]["wallet_reference_type"]
            | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          direction: Database["public"]["Enums"]["wallet_direction"]
          id?: string
          reference_id?: string | null
          reference_type?:
            | Database["public"]["Enums"]["wallet_reference_type"]
            | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["wallet_direction"]
          id?: string
          reference_id?: string | null
          reference_type?:
            | Database["public"]["Enums"]["wallet_reference_type"]
            | null
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_wallet_balance"
            referencedColumns: ["user_id"]
          },
        ]
      }
      weekly_meal_prep: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          servings: number
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          servings: number
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          servings?: number
        }
        Relationships: []
      }
      weekly_meals: {
        Row: {
          created_at: string
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          planned_servings: number
          recipe_id: string
          week_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          planned_servings: number
          recipe_id: string
          week_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          planned_servings?: number
          recipe_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_meals_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "meal_prep_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      grocery_list_merged: {
        Row: {
          ingredient_id: string | null
          total_quantity: number | null
          unit_id: string | null
          week_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grocery_list_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_items_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "meal_prep_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallet_balance: {
        Row: {
          balance: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_mission_completion: {
        Args: { p_completion_id: string }
        Returns: {
          error_code: string
          success: boolean
        }[]
      }
      buy_ticket: { Args: { p_lottery_id: string }; Returns: string }
      get_lottery_active_ticket_counts: {
        Args: { p_lottery_ids: string[] }
        Returns: {
          lottery_id: string
          active_tickets_count: number
        }[]
      }
      get_wallet_transactions_enriched: {
        Args: never
        Returns: {
          id: string
          amount: number
          context_title: string | null
          created_at: string
          direction: Database["public"]["Enums"]["wallet_direction"]
          reference_id: string | null
          reference_type:
            | Database["public"]["Enums"]["wallet_reference_type"]
            | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
        }[]
      }
      handle_referral_after_first_mission: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      regenerate_grocery_list: {
        Args: { p_week_id: string }
        Returns: undefined
      }
      submit_mission_completion: {
        Args: { p_mission_id: string; p_proof_data?: Json }
        Returns: {
          completion_id: string
          error_code: string
          success: boolean
        }[]
      }
    }
    Enums: {
      lottery_status: "draft" | "active" | "closed" | "drawn" | "cancelled"
      lottery_ticket_status: "active" | "cancelled"
      meal_type: "breakfast" | "lunch" | "dinner"
      mission_completion_status: "pending" | "approved" | "rejected"
      mission_status: "draft" | "active" | "paused" | "archived"
      mission_type: "survey" | "video" | "follow" | "referral" | "custom"
      mission_validation_mode: "automatic" | "manual"
      referral_status: "pending" | "qualified" | "rewarded" | "cancelled"
      unit_type: "weight" | "volume" | "count"
      wallet_direction: "credit" | "debit"
      wallet_reference_type:
        | "mission_completion"
        | "lottery_ticket"
        | "referral"
        | "purchase"
        | "admin"
      wallet_transaction_type:
        | "mission_reward"
        | "ticket_purchase"
        | "referral_bonus"
        | "token_purchase"
        | "manual_adjustment"
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
      lottery_status: ["draft", "active", "closed", "drawn", "cancelled"],
      lottery_ticket_status: ["active", "cancelled"],
      meal_type: ["breakfast", "lunch", "dinner"],
      mission_completion_status: ["pending", "approved", "rejected"],
      mission_status: ["draft", "active", "paused", "archived"],
      mission_type: ["survey", "video", "follow", "referral", "custom"],
      mission_validation_mode: ["automatic", "manual"],
      referral_status: ["pending", "qualified", "rewarded", "cancelled"],
      unit_type: ["weight", "volume", "count"],
      wallet_direction: ["credit", "debit"],
      wallet_reference_type: [
        "mission_completion",
        "lottery_ticket",
        "referral",
        "purchase",
        "admin",
      ],
      wallet_transaction_type: [
        "mission_reward",
        "ticket_purchase",
        "referral_bonus",
        "token_purchase",
        "manual_adjustment",
      ],
    },
  },
} as const
