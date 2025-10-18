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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      departmental_logs: {
        Row: {
          created_at: string
          department: string
          findings: string
          id: string
          provider_name: string
          recorded_by: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string
          department: string
          findings: string
          id?: string
          provider_name: string
          recorded_by?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string
          department?: string
          findings?: string
          id?: string
          provider_name?: string
          recorded_by?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departmental_logs_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
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
      patients: {
        Row: {
          address: string
          contact_number: string
          created_at: string
          created_by: string | null
          date_of_birth: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          name: string
          patient_number: string
          updated_at: string
        }
        Insert: {
          address: string
          contact_number: string
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          name: string
          patient_number: string
          updated_at?: string
        }
        Update: {
          address?: string
          contact_number?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          name?: string
          patient_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contact_number: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          patient_number: string | null
          updated_at: string
        }
        Insert: {
          contact_number?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          patient_number?: string | null
          updated_at?: string
        }
        Update: {
          contact_number?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          patient_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          department: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_department"
            columns: ["department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          chief_complaint: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          department: string
          final_diagnosis: string | null
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["visit_status"]
          visit_number: string
        }
        Insert: {
          chief_complaint: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          department: string
          final_diagnosis?: string | null
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["visit_status"]
          visit_number: string
        }
        Update: {
          chief_complaint?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          final_diagnosis?: string | null
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["visit_status"]
          visit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_patient_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_visit_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_patient_id_by_number: {
        Args: { _patient_number: string }
        Returns: string
      }
      get_user_department: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      patient_has_visit_in_department: {
        Args: { _department_id: string; _patient_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "encoder" | "doctor" | "patient" | "admin"
      gender: "male" | "female" | "other"
      visit_status: "pending" | "in-progress" | "completed"
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
      app_role: ["encoder", "doctor", "patient", "admin"],
      gender: ["male", "female", "other"],
      visit_status: ["pending", "in-progress", "completed"],
    },
  },
} as const
