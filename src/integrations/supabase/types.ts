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
      departmental_logs: {
        Row: {
          created_at: string | null
          department: string
          findings: string
          id: string
          provider_name: string
          recorded_by: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          department: string
          findings: string
          id?: string
          provider_name: string
          recorded_by?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
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
      ape_companies: {
        Row: { company_code: string; created_at: string | null; name: string }
        Insert: { company_code: string; name: string; created_at?: string | null }
        Update: { company_code?: string; name?: string; created_at?: string | null }
        Relationships: []
      }
      ape_employees: {
        Row: {
          id: string
          company_code: string
          employee_number: number
          exam_code: string
          exam_date: string
          name: string
          address: string
          contact_number: string
          email: string
          age: number
          gender: string
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_code: string
          employee_number: number
          exam_code: string
          exam_date: string
          name: string
          address?: string
          contact_number?: string
          email?: string
          age: number
          gender: string
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_code?: string
          employee_number?: number
          exam_code?: string
          exam_date?: string
          name?: string
          address?: string
          contact_number?: string
          email?: string
          age?: number
          gender?: string
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ape_employees_company_code_fkey"
            columns: ["company_code"]
            isOneToOne: false
            referencedRelation: "ape_companies"
            referencedColumns: ["company_code"]
          },
        ]
      }
      pe_records: {
        Row: {
          id: string
          ape_employee_id: string
          childhood_diseases: string | null
          past_illnesses_injuries: string | null
          operations: string | null
          smoker: string | null
          alcohol: string | null
          exercise: string | null
          family_heart_disease: boolean | null
          family_hypertension: boolean | null
          family_diabetes: boolean | null
          family_asthma: boolean | null
          family_allergy: boolean | null
          family_cancer: boolean | null
          family_others: string | null
          ob_lmp: string | null
          ob_days: string | null
          ob_pmp: string | null
          ob_interval: string | null
          ob_gravida: string | null
          ob_para: string | null
          ob_delivery: string | null
          ob_complications: string | null
          meas_height: string | null
          meas_weight_lbs: string | null
          meas_bp: string | null
          meas_pr: string | null
          meas_rr: string | null
          meas_va_correction: string | null
          meas_far_od: string | null
          meas_far_os: string | null
          meas_near_odj: string | null
          meas_near_osj: string | null
          find_head: string | null
          find_ears_eyes_nose: string | null
          find_mouth_throat: string | null
          find_neck_thorax: string | null
          find_lungs: string | null
          find_heart: string | null
          find_abdomen: string | null
          find_genitalia: string | null
          find_extremities: string | null
          find_skin: string | null
          find_rectum: string | null
          find_ishihara_score: string | null
          dental_missing_teeth: string | null
          dental_canes: string | null
          dental_replaced: string | null
          dental_jacket_crown: string | null
          lab_hem_hemoglobin: string | null
          lab_hem_hematocrit: string | null
          lab_hem_wbc: string | null
          lab_hem_rbc: string | null
          lab_hem_segmanters: string | null
          lab_hem_lymphocytes: string | null
          lab_hem_eosinophil: string | null
          lab_hem_monocytes: string | null
          lab_hem_basophil: string | null
          lab_hem_platelet: string | null
          lab_ua_color: string | null
          lab_ua_transparency: string | null
          lab_ua_reaction: string | null
          lab_ua_specific_gravity: string | null
          lab_ua_protein: string | null
          lab_ua_sugar: string | null
          lab_ua_pus_cells: string | null
          lab_ua_red_blood_cells: string | null
          lab_ua_epithelial_cells: string | null
          lab_ua_amorphous: string | null
          lab_ua_mucus_threads: string | null
          lab_ua_bacteria: string | null
          lab_ua_others: string | null
          lab_stool_color: string | null
          lab_stool_consistency: string | null
          lab_stool_others: string | null
          lab_chest_pa_findings: string | null
          lab_chest_pa_impression: string | null
          lab_ecg_rate: string | null
          lab_ecg_rhythm: string | null
          lab_ecg_interpretation: string | null
          lab_ecg_others: string | null
          lab_pap_specimen_adequacy: string | null
          lab_pap_general_categorization: string | null
          lab_pap_descriptive_diagnoses: string | null
          physical_exam_saved_at: string | null
          laboratory_saved_at: string | null
          updated_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          ape_employee_id: string
          childhood_diseases?: string | null
          past_illnesses_injuries?: string | null
          operations?: string | null
          smoker?: string | null
          alcohol?: string | null
          exercise?: string | null
          family_heart_disease?: boolean | null
          family_hypertension?: boolean | null
          family_diabetes?: boolean | null
          family_asthma?: boolean | null
          family_allergy?: boolean | null
          family_cancer?: boolean | null
          family_others?: string | null
          ob_lmp?: string | null
          ob_days?: string | null
          ob_pmp?: string | null
          ob_interval?: string | null
          ob_gravida?: string | null
          ob_para?: string | null
          ob_delivery?: string | null
          ob_complications?: string | null
          meas_height?: string | null
          meas_weight_lbs?: string | null
          meas_bp?: string | null
          meas_pr?: string | null
          meas_rr?: string | null
          meas_va_correction?: string | null
          meas_far_od?: string | null
          meas_far_os?: string | null
          meas_near_odj?: string | null
          meas_near_osj?: string | null
          find_head?: string | null
          find_ears_eyes_nose?: string | null
          find_mouth_throat?: string | null
          find_neck_thorax?: string | null
          find_lungs?: string | null
          find_heart?: string | null
          find_abdomen?: string | null
          find_genitalia?: string | null
          find_extremities?: string | null
          find_skin?: string | null
          find_rectum?: string | null
          find_ishihara_score?: string | null
          dental_missing_teeth?: string | null
          dental_canes?: string | null
          dental_replaced?: string | null
          dental_jacket_crown?: string | null
          lab_hem_hemoglobin?: string | null
          lab_hem_hematocrit?: string | null
          lab_hem_wbc?: string | null
          lab_hem_rbc?: string | null
          lab_hem_segmanters?: string | null
          lab_hem_lymphocytes?: string | null
          lab_hem_eosinophil?: string | null
          lab_hem_monocytes?: string | null
          lab_hem_basophil?: string | null
          lab_hem_platelet?: string | null
          lab_ua_color?: string | null
          lab_ua_transparency?: string | null
          lab_ua_reaction?: string | null
          lab_ua_specific_gravity?: string | null
          lab_ua_protein?: string | null
          lab_ua_sugar?: string | null
          lab_ua_pus_cells?: string | null
          lab_ua_red_blood_cells?: string | null
          lab_ua_epithelial_cells?: string | null
          lab_ua_amorphous?: string | null
          lab_ua_mucus_threads?: string | null
          lab_ua_bacteria?: string | null
          lab_ua_others?: string | null
          lab_stool_color?: string | null
          lab_stool_consistency?: string | null
          lab_stool_others?: string | null
          lab_chest_pa_findings?: string | null
          lab_chest_pa_impression?: string | null
          lab_ecg_rate?: string | null
          lab_ecg_rhythm?: string | null
          lab_ecg_interpretation?: string | null
          lab_ecg_others?: string | null
          lab_pap_specimen_adequacy?: string | null
          lab_pap_general_categorization?: string | null
          lab_pap_descriptive_diagnoses?: string | null
          physical_exam_saved_at?: string | null
          laboratory_saved_at?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          ape_employee_id?: string
          childhood_diseases?: string | null
          past_illnesses_injuries?: string | null
          operations?: string | null
          smoker?: string | null
          alcohol?: string | null
          exercise?: string | null
          family_heart_disease?: boolean | null
          family_hypertension?: boolean | null
          family_diabetes?: boolean | null
          family_asthma?: boolean | null
          family_allergy?: boolean | null
          family_cancer?: boolean | null
          family_others?: string | null
          ob_lmp?: string | null
          ob_days?: string | null
          ob_pmp?: string | null
          ob_interval?: string | null
          ob_gravida?: string | null
          ob_para?: string | null
          ob_delivery?: string | null
          ob_complications?: string | null
          meas_height?: string | null
          meas_weight_lbs?: string | null
          meas_bp?: string | null
          meas_pr?: string | null
          meas_rr?: string | null
          meas_va_correction?: string | null
          meas_far_od?: string | null
          meas_far_os?: string | null
          meas_near_odj?: string | null
          meas_near_osj?: string | null
          find_head?: string | null
          find_ears_eyes_nose?: string | null
          find_mouth_throat?: string | null
          find_neck_thorax?: string | null
          find_lungs?: string | null
          find_heart?: string | null
          find_abdomen?: string | null
          find_genitalia?: string | null
          find_extremities?: string | null
          find_skin?: string | null
          find_rectum?: string | null
          find_ishihara_score?: string | null
          dental_missing_teeth?: string | null
          dental_canes?: string | null
          dental_replaced?: string | null
          dental_jacket_crown?: string | null
          lab_hem_hemoglobin?: string | null
          lab_hem_hematocrit?: string | null
          lab_hem_wbc?: string | null
          lab_hem_rbc?: string | null
          lab_hem_segmanters?: string | null
          lab_hem_lymphocytes?: string | null
          lab_hem_eosinophil?: string | null
          lab_hem_monocytes?: string | null
          lab_hem_basophil?: string | null
          lab_hem_platelet?: string | null
          lab_ua_color?: string | null
          lab_ua_transparency?: string | null
          lab_ua_reaction?: string | null
          lab_ua_specific_gravity?: string | null
          lab_ua_protein?: string | null
          lab_ua_sugar?: string | null
          lab_ua_pus_cells?: string | null
          lab_ua_red_blood_cells?: string | null
          lab_ua_epithelial_cells?: string | null
          lab_ua_amorphous?: string | null
          lab_ua_mucus_threads?: string | null
          lab_ua_bacteria?: string | null
          lab_ua_others?: string | null
          lab_stool_color?: string | null
          lab_stool_consistency?: string | null
          lab_stool_others?: string | null
          lab_chest_pa_findings?: string | null
          lab_chest_pa_impression?: string | null
          lab_ecg_rate?: string | null
          lab_ecg_rhythm?: string | null
          lab_ecg_interpretation?: string | null
          lab_ecg_others?: string | null
          lab_pap_specimen_adequacy?: string | null
          lab_pap_general_categorization?: string | null
          lab_pap_descriptive_diagnoses?: string | null
          physical_exam_saved_at?: string | null
          laboratory_saved_at?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pe_records_ape_employee_id_fkey"
            columns: ["ape_employee_id"]
            isOneToOne: true
            referencedRelation: "ape_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          contact_number: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string
          gender: string
          id: string
          name: string
          patient_number: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth: string
          gender: string
          id?: string
          name: string
          patient_number: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string
          gender?: string
          id?: string
          name?: string
          patient_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contact_number: string | null
          created_at: string | null
          full_name: string | null
          id: string
          patient_number: string | null
          updated_at: string | null
        }
        Insert: {
          contact_number?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          patient_number?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_number?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          patient_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_department_fkey"
            columns: ["department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      xray_reports: {
        Row: {
          id: string
          control_number: string
          report_date: string
          company_affiliation: string | null
          requesting_physician: string
          radiologic_technologist: string
          radiologist: string
          patient_name: string
          date_of_birth: string
          age: number | null
          sex: string
          first_day_last_menstruation: string | null
          indication_history: string
          diagnostic_imaging_request: string
          findings: string
          impression: string
          visit_id: string | null
          patient_id: string | null
          recorded_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          control_number?: string
          report_date: string
          company_affiliation?: string | null
          requesting_physician: string
          radiologic_technologist: string
          radiologist: string
          patient_name: string
          date_of_birth: string
          age?: number | null
          sex: string
          first_day_last_menstruation?: string | null
          indication_history: string
          diagnostic_imaging_request: string
          findings: string
          impression: string
          visit_id?: string | null
          patient_id?: string | null
          recorded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          control_number?: string
          report_date?: string
          company_affiliation?: string | null
          requesting_physician?: string
          radiologic_technologist?: string
          radiologist?: string
          patient_name?: string
          date_of_birth?: string
          age?: number | null
          sex?: string
          first_day_last_menstruation?: string | null
          indication_history?: string
          diagnostic_imaging_request?: string
          findings?: string
          impression?: string
          visit_id?: string | null
          patient_id?: string | null
          recorded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xray_reports_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xray_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          chief_complaint: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          department: string
          final_diagnosis: string | null
          id: string
          patient_id: string
          status: string
          updated_at: string | null
          visit_number: string
        }
        Insert: {
          chief_complaint: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          department: string
          final_diagnosis?: string | null
          id?: string
          patient_id: string
          status?: string
          updated_at?: string | null
          visit_number: string
        }
        Update: {
          chief_complaint?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string
          final_diagnosis?: string | null
          id?: string
          patient_id?: string
          status?: string
          updated_at?: string | null
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
      generate_patient_number: { Args: never; Returns: string }
      generate_visit_number: { Args: never; Returns: string }
      generate_xray_control_number: { Args: never; Returns: string }
      get_user_department: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_ape_employees: {
        Args: { p_query: string }
        Returns: {
          id: string
          exam_code: string
          name: string
          exam_date: string
          company_code: string
          match_rank: number
          match_label: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "encoder" | "patient"
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
      app_role: ["admin", "doctor", "encoder", "patient"],
    },
  },
} as const
