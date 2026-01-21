export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      indicator_history: {
        Row: {
          created_at: string
          id: string
          indicator_id: string
          recorded_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          indicator_id: string
          recorded_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          indicator_id?: string
          recorded_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicator_history_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "user_indicators"
            referencedColumns: ["id"]
          }
        ]
      }
      indicator_templates: {
        Row: {
          calc_method: string
          complexity: Database["public"]["Enums"]["complexity_level"]
          created_at: string
          default_critical_threshold: number | null
          default_target: number | null
          default_warning_threshold: number | null
          description: string
          direction: Database["public"]["Enums"]["indicator_direction"]
          formula: string
          icon_name: string
          id: string
          importance: string
          input_fields: Json
          name: string
          required_data: Json
          segment: Database["public"]["Enums"]["business_segment"]
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string | null
        }
        Insert: {
          calc_method?: string
          complexity?: Database["public"]["Enums"]["complexity_level"]
          created_at?: string
          default_critical_threshold?: number | null
          default_target?: number | null
          default_warning_threshold?: number | null
          description: string
          direction?: Database["public"]["Enums"]["indicator_direction"]
          formula: string
          icon_name: string
          id?: string
          importance: string
          input_fields?: Json
          name: string
          required_data: Json
          segment?: Database["public"]["Enums"]["business_segment"]
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
        }
        Update: {
          calc_method?: string
          complexity?: Database["public"]["Enums"]["complexity_level"]
          created_at?: string
          default_critical_threshold?: number | null
          default_target?: number | null
          default_warning_threshold?: number | null
          description?: string
          direction?: Database["public"]["Enums"]["indicator_direction"]
          formula?: string
          icon_name?: string
          id?: string
          importance?: string
          input_fields?: Json
          name?: string
          required_data?: Json
          segment?: Database["public"]["Enums"]["business_segment"]
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          id: string
          indicador_id: string
          user_id: string
          valor: number
          data_referencia: string
          observacao: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          indicador_id: string
          user_id: string
          valor: number
          data_referencia: string
          observacao?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          indicador_id?: string
          user_id?: string
          valor?: number
          data_referencia?: string
          observacao?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "user_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_indicators: {
        Row: {
          created_at: string
          current_value: number | null
          format: Database["public"]["Enums"]["value_format"]
          id: string
          indicator_template_id: string
          is_active: boolean | null
          last_inputs: Json | null
          name: string
          target_value: number | null
          updated_at: string | null
          user_id: string
          frequencia_meta: string | null
          tipo_agregacao: string | null
          direcao_meta: string | null
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          format?: Database["public"]["Enums"]["value_format"]
          id?: string
          indicator_template_id: string
          is_active?: boolean | null
          last_inputs?: Json | null
          name: string
          target_value?: number | null
          updated_at?: string | null
          user_id: string
          frequencia_meta?: string | null
          tipo_agregacao?: string | null
          direcao_meta?: string | null
        }
        Update: {
          created_at?: string
          current_value?: number | null
          format?: Database["public"]["Enums"]["value_format"]
          id?: string
          indicator_template_id?: string
          is_active?: boolean | null
          last_inputs?: Json | null
          name?: string
          target_value?: number | null
          updated_at?: string | null
          user_id?: string
          frequencia_meta?: string | null
          tipo_agregacao?: string | null
          direcao_meta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_indicators_indicator_template_id_fkey"
            columns: ["indicator_template_id"]
            isOneToOne: false
            referencedRelation: "indicator_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          business_name: string | null
          business_segment: Database["public"]["Enums"]["business_segment"] | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          business_segment?: Database["public"]["Enums"]["business_segment"] | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          business_segment?: Database["public"]["Enums"]["business_segment"] | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_indicator_templates_analysis: {
        Row: {
          behavior_description: string | null
          calc_method: string | null
          complexity: Database["public"]["Enums"]["complexity_level"] | null
          created_at: string | null
          default_critical_threshold: number | null
          default_target: number | null
          default_warning_threshold: number | null
          direction: Database["public"]["Enums"]["indicator_direction"] | null
          id: string | null
          input_fields: Json | null
          name: string | null
          num_required_fields: number | null
          segment: Database["public"]["Enums"]["business_segment"] | null
          unit_type: Database["public"]["Enums"]["unit_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_indicator_status: {
        Args: {
          current_value: number
          target_value: number
          direction: Database["public"]["Enums"]["indicator_direction"]
          warning_threshold: number
          critical_threshold: number
        }
        Returns: string
      }
    }
    Enums: {
      business_segment:
      | "Academia"
      | "Restaurante"
      | "PetShop"
      | "Contabilidade"
      | "Geral"
      complexity_level: "Fácil" | "Intermediário" | "Avançado"
      indicator_direction: "HIGHER_BETTER" | "LOWER_BETTER" | "NEUTRAL_RANGE"
      unit_type: "currency" | "percentage" | "integer" | "decimal"
      value_format: "currency" | "percentage" | "number"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

