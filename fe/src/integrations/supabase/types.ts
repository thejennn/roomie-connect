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
      ai_tokens: {
        Row: {
          created_at: string
          id: string
          max_tokens: number
          tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_tokens?: number
          tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_tokens?: number
          tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account: string | null
          bank_name: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_banned: boolean | null
          is_verified: boolean | null
          phone: string | null
          university: string | null
          updated_at: string
          user_id: string
          workplace: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_banned?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
          workplace?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_banned?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
          workplace?: string | null
        }
        Relationships: []
      }
      roommate_profiles: {
        Row: {
          bio: string | null
          budget_max: number | null
          budget_min: number | null
          cleanliness: string | null
          created_at: string
          id: string
          is_public: boolean | null
          looking_for: string | null
          noise_level: string | null
          preferred_district: string[] | null
          sleep_time: string | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          cleanliness?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          looking_for?: string | null
          noise_level?: string | null
          preferred_district?: string[] | null
          sleep_time?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          cleanliness?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          looking_for?: string | null
          noise_level?: string | null
          preferred_district?: string[] | null
          sleep_time?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          address: string
          area: number | null
          capacity: number
          cleaning_fee: number | null
          created_at: string
          deposit: number | null
          description: string | null
          district: string
          electricity_price: number | null
          expires_at: string | null
          has_air_conditioner: boolean | null
          has_bed: boolean | null
          has_drying_area: boolean | null
          has_elevator: boolean | null
          has_fire_safety: boolean | null
          has_fridge: boolean | null
          has_kitchen: boolean | null
          has_parking: boolean | null
          has_pet_friendly: boolean | null
          has_private_washing: boolean | null
          has_security_camera: boolean | null
          has_shared_owner: boolean | null
          has_shared_washing: boolean | null
          has_wardrobe: boolean | null
          has_water_heater: boolean | null
          id: string
          images: string[] | null
          internet_price: number | null
          is_fully_furnished: boolean | null
          landlord_id: string
          parking_fee: number | null
          price: number
          rejection_reason: string | null
          status: Database["public"]["Enums"]["room_status"]
          title: string
          updated_at: string
          water_price: number | null
        }
        Insert: {
          address: string
          area?: number | null
          capacity?: number
          cleaning_fee?: number | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          district: string
          electricity_price?: number | null
          expires_at?: string | null
          has_air_conditioner?: boolean | null
          has_bed?: boolean | null
          has_drying_area?: boolean | null
          has_elevator?: boolean | null
          has_fire_safety?: boolean | null
          has_fridge?: boolean | null
          has_kitchen?: boolean | null
          has_parking?: boolean | null
          has_pet_friendly?: boolean | null
          has_private_washing?: boolean | null
          has_security_camera?: boolean | null
          has_shared_owner?: boolean | null
          has_shared_washing?: boolean | null
          has_wardrobe?: boolean | null
          has_water_heater?: boolean | null
          id?: string
          images?: string[] | null
          internet_price?: number | null
          is_fully_furnished?: boolean | null
          landlord_id: string
          parking_fee?: number | null
          price: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          title: string
          updated_at?: string
          water_price?: number | null
        }
        Update: {
          address?: string
          area?: number | null
          capacity?: number
          cleaning_fee?: number | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          district?: string
          electricity_price?: number | null
          expires_at?: string | null
          has_air_conditioner?: boolean | null
          has_bed?: boolean | null
          has_drying_area?: boolean | null
          has_elevator?: boolean | null
          has_fire_safety?: boolean | null
          has_fridge?: boolean | null
          has_kitchen?: boolean | null
          has_parking?: boolean | null
          has_pet_friendly?: boolean | null
          has_private_washing?: boolean | null
          has_security_camera?: boolean | null
          has_shared_owner?: boolean | null
          has_shared_washing?: boolean | null
          has_wardrobe?: boolean | null
          has_water_heater?: boolean | null
          id?: string
          images?: string[] | null
          internet_price?: number | null
          is_fully_furnished?: boolean | null
          landlord_id?: string
          parking_fee?: number | null
          price?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          title?: string
          updated_at?: string
          water_price?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
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
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_landlord: { Args: never; Returns: boolean }
      is_tenant: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "landlord" | "tenant"
      room_status: "pending" | "active" | "rejected" | "expired"
      transaction_type: "topup" | "post_fee" | "subscription" | "token_purchase"
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
      app_role: ["admin", "landlord", "tenant"],
      room_status: ["pending", "active", "rejected", "expired"],
      transaction_type: ["topup", "post_fee", "subscription", "token_purchase"],
    },
  },
} as const


