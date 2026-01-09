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
      indicator_templates: {
        Row: {
          id: string
          name: string
          description: string
          formula: string
          importance: string
          segment: "Academia" | "Restaurante" | "Contabilidade" | "PetShop" | "Geral"
          complexity: "Fácil" | "Intermediário" | "Avançado"
          icon_name: string | null
          required_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          formula: string
          importance: string
          segment?: "Academia" | "Restaurante" | "Contabilidade" | "PetShop" | "Geral"
          complexity?: "Fácil" | "Intermediário" | "Avançado"
          icon_name?: string | null
          required_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          formula?: string
          importance?: string
          segment?: "Academia" | "Restaurante" | "Contabilidade" | "PetShop" | "Geral"
          complexity?: "Fácil" | "Intermediário" | "Avançado"
          icon_name?: string | null
          required_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_indicators: {
        Row: {
          id: string
          user_id: string
          indicator_template_id: string
          name: string
          current_value: number
          target_value: number | null
          format: "currency" | "percentage" | "number"
          segment: string | null
          icon_name: string | null
          is_active: boolean
          position: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          indicator_template_id: string
          name: string
          current_value?: number
          target_value?: number | null
          format?: "currency" | "percentage" | "number"
          segment?: string | null
          icon_name?: string | null
          is_active?: boolean
          position?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          indicator_template_id?: string
          name?: string
          current_value?: number
          target_value?: number | null
          format?: "currency" | "percentage" | "number"
          segment?: string | null
          icon_name?: string | null
          is_active?: boolean
          position?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      indicator_history: {
        Row: {
          id: string
          user_indicator_id: string
          value: number
          recorded_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_indicator_id: string
          value: number
          recorded_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_indicator_id?: string
          value?: number
          recorded_at?: string
          notes?: string | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          business_name: string | null
          business_segment: "Academia" | "Restaurante" | "Contabilidade" | "PetShop" | "Geral" | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          business_name?: string | null
          business_segment?: "Academia" | "Restaurante" | "Contabilidade" | "PetShop" | "Geral" | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          business_name?: string | null
          business_segment?: "Academia" | "Restaurante" | "Contabilidade" | "PetShop" | "Geral" | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      complexity_level: "Fácil" | "Intermediário" | "Avançado"
      business_segment: "Academia" | "Restaurante" | "Contabilidade" | "PetShop" | "Geral"
      value_format: "currency" | "percentage" | "number"
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
      complexity_level: ["Fácil", "Intermediário", "Avançado"],
      business_segment: ["Academia", "Restaurante", "Contabilidade", "PetShop", "Geral"],
      value_format: ["currency", "percentage", "number"],
    },
  },
} as const
