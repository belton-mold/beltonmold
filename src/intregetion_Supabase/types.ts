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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      daily_records: {
        Row: {
          created_at: string
          customer: string | null
          defects: Json
          id: string
          machine_name: string | null
          machine_no: string | null
          master_condition_id: string | null
          mold_no: string
          notes: string | null
          parameters: Json
          part_no: string | null
          product_name: string
          record_date: string
          shift: string
          technician: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer?: string | null
          defects?: Json
          id?: string
          machine_name?: string | null
          machine_no?: string | null
          master_condition_id?: string | null
          mold_no: string
          notes?: string | null
          parameters?: Json
          part_no?: string | null
          product_name: string
          record_date: string
          shift: string
          technician?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer?: string | null
          defects?: Json
          id?: string
          machine_name?: string | null
          machine_no?: string | null
          master_condition_id?: string | null
          mold_no?: string
          notes?: string | null
          parameters?: Json
          part_no?: string | null
          product_name?: string
          record_date?: string
          shift?: string
          technician?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_records_master_condition_id_fkey"
            columns: ["master_condition_id"]
            isOneToOne: false
            referencedRelation: "master_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      defect_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          created_at: string
          id: string
          machine_name: string
          machine_no: string
        }
        Insert: {
          created_at?: string
          id?: string
          machine_name: string
          machine_no: string
        }
        Update: {
          created_at?: string
          id?: string
          machine_name?: string
          machine_no?: string
        }
        Relationships: []
      }
      master_conditions: {
        Row: {
          barrel_nozzle: string | null
          barrel_zone1: string | null
          barrel_zone2: string | null
          barrel_zone3: string | null
          barrel_zone4: string | null
          cavities: string | null
          created_at: string
          customer: string | null
          cycle_time: string | null
          drying_temp_time: string | null
          extra: Json | null
          fill_pressure_a: string | null
          fill_pressure_b: string | null
          fill_speed_a: string | null
          fill_speed_b: string | null
          hold_pressure_a: string | null
          hold_pressure_b: string | null
          hold_speed_a: string | null
          hold_speed_b: string | null
          hold_time_a: string | null
          hold_time_b: string | null
          id: string
          machine_a: string | null
          machine_b: string | null
          materials: string | null
          mold_no: string
          mould_temp: string | null
          piece_weight: string | null
          product_name: string
          product_number: string | null
          shot_weight: string | null
          transfer_position_a: string | null
          transfer_position_b: string | null
          updated_at: string
        }
        Insert: {
          barrel_nozzle?: string | null
          barrel_zone1?: string | null
          barrel_zone2?: string | null
          barrel_zone3?: string | null
          barrel_zone4?: string | null
          cavities?: string | null
          created_at?: string
          customer?: string | null
          cycle_time?: string | null
          drying_temp_time?: string | null
          extra?: Json | null
          fill_pressure_a?: string | null
          fill_pressure_b?: string | null
          fill_speed_a?: string | null
          fill_speed_b?: string | null
          hold_pressure_a?: string | null
          hold_pressure_b?: string | null
          hold_speed_a?: string | null
          hold_speed_b?: string | null
          hold_time_a?: string | null
          hold_time_b?: string | null
          id?: string
          machine_a?: string | null
          machine_b?: string | null
          materials?: string | null
          mold_no: string
          mould_temp?: string | null
          piece_weight?: string | null
          product_name: string
          product_number?: string | null
          shot_weight?: string | null
          transfer_position_a?: string | null
          transfer_position_b?: string | null
          updated_at?: string
        }
        Update: {
          barrel_nozzle?: string | null
          barrel_zone1?: string | null
          barrel_zone2?: string | null
          barrel_zone3?: string | null
          barrel_zone4?: string | null
          cavities?: string | null
          created_at?: string
          customer?: string | null
          cycle_time?: string | null
          drying_temp_time?: string | null
          extra?: Json | null
          fill_pressure_a?: string | null
          fill_pressure_b?: string | null
          fill_speed_a?: string | null
          fill_speed_b?: string | null
          hold_pressure_a?: string | null
          hold_pressure_b?: string | null
          hold_speed_a?: string | null
          hold_speed_b?: string | null
          hold_time_a?: string | null
          hold_time_b?: string | null
          id?: string
          machine_a?: string | null
          machine_b?: string | null
          materials?: string | null
          mold_no?: string
          mould_temp?: string | null
          piece_weight?: string | null
          product_name?: string
          product_number?: string | null
          shot_weight?: string | null
          transfer_position_a?: string | null
          transfer_position_b?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      technicians: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
