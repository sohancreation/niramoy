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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_chat_usage: {
        Row: {
          created_at: string
          family_member_id: string | null
          id: string
          question_count: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_member_id?: string | null
          id?: string
          question_count?: number
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_member_id?: string | null
          id?: string
          question_count?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_usage_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_codes: {
        Row: {
          code: string
          created_at: string
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
        }
        Relationships: []
      }
      daily_health_updates: {
        Row: {
          created_at: string
          energy_level: number | null
          family_member_id: string | null
          id: string
          mood: string | null
          notes: string | null
          pain_areas: string[] | null
          sleep_hours: number | null
          sleep_quality: number | null
          stress_level: number | null
          symptoms: string[] | null
          update_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level?: number | null
          family_member_id?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          pain_areas?: string[] | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          symptoms?: string[] | null
          update_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number | null
          family_member_id?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          pain_areas?: string[] | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          symptoms?: string[] | null
          update_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_health_updates_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          family_member_id: string | null
          id: string
          photo_url: string | null
          task_date: string
          task_description: string | null
          task_name: string
          task_type: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          family_member_id?: string | null
          id?: string
          photo_url?: string | null
          task_date?: string
          task_description?: string | null
          task_name: string
          task_type: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          family_member_id?: string | null
          id?: string
          photo_url?: string | null
          task_date?: string
          task_description?: string | null
          task_name?: string
          task_type?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          activity_level: string | null
          age: number | null
          avatar_emoji: string
          created_at: string
          gender: string | null
          height: number | null
          id: string
          medical_conditions: string | null
          name: string
          owner_id: string
          relationship: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          avatar_emoji?: string
          created_at?: string
          gender?: string | null
          height?: number | null
          id?: string
          medical_conditions?: string | null
          name: string
          owner_id: string
          relationship?: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          avatar_emoji?: string
          created_at?: string
          gender?: string | null
          height?: number | null
          id?: string
          medical_conditions?: string | null
          name?: string
          owner_id?: string
          relationship?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      health_logs: {
        Row: {
          bp: string | null
          created_at: string
          date: string
          exercise: boolean | null
          family_member_id: string | null
          id: string
          sleep: number | null
          user_id: string
          water_intake: number | null
          weight: number | null
        }
        Insert: {
          bp?: string | null
          created_at?: string
          date?: string
          exercise?: boolean | null
          family_member_id?: string | null
          id?: string
          sleep?: number | null
          user_id: string
          water_intake?: number | null
          weight?: number | null
        }
        Update: {
          bp?: string | null
          created_at?: string
          date?: string
          exercise?: boolean | null
          family_member_id?: string | null
          id?: string
          sleep?: number | null
          user_id?: string
          water_intake?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_logs_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          family_member_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          family_member_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          family_member_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_logs: {
        Row: {
          created_at: string
          family_member_id: string | null
          id: string
          log_date: string
          mood: string
          note: string | null
          stress_level: number
          user_id: string
        }
        Insert: {
          created_at?: string
          family_member_id?: string | null
          id?: string
          log_date?: string
          mood: string
          note?: string | null
          stress_level?: number
          user_id: string
        }
        Update: {
          created_at?: string
          family_member_id?: string | null
          id?: string
          log_date?: string
          mood?: string
          note?: string | null
          stress_level?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_logs_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_progress: {
        Row: {
          completed_items: Json | null
          created_at: string
          family_member_id: string | null
          feedback: Json | null
          id: string
          notes: string | null
          plan_id: string
          progress_date: string
          user_id: string
        }
        Insert: {
          completed_items?: Json | null
          created_at?: string
          family_member_id?: string | null
          feedback?: Json | null
          id?: string
          notes?: string | null
          plan_id: string
          progress_date?: string
          user_id: string
        }
        Update: {
          completed_items?: Json | null
          created_at?: string
          family_member_id?: string | null
          feedback?: Json | null
          id?: string
          notes?: string | null
          plan_id?: string
          progress_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_progress_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saved_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          ai_summary: string | null
          analysis_status: string
          created_at: string
          diagnosis: string | null
          dietary_restrictions: Json | null
          doctor_name: string | null
          exercise_restrictions: Json | null
          family_member_id: string | null
          file_type: string
          id: string
          image_url: string
          medicines: Json | null
          raw_analysis: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          analysis_status?: string
          created_at?: string
          diagnosis?: string | null
          dietary_restrictions?: Json | null
          doctor_name?: string | null
          exercise_restrictions?: Json | null
          family_member_id?: string | null
          file_type?: string
          id?: string
          image_url: string
          medicines?: Json | null
          raw_analysis?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          analysis_status?: string
          created_at?: string
          diagnosis?: string | null
          dietary_restrictions?: Json | null
          doctor_name?: string | null
          exercise_restrictions?: Json | null
          family_member_id?: string | null
          file_type?: string
          id?: string
          image_url?: string
          medicines?: Json | null
          raw_analysis?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string
          email: string
          gender: string | null
          height: number | null
          id: string
          location: string | null
          medical_conditions: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          email: string
          gender?: string | null
          height?: number | null
          id?: string
          location?: string | null
          medical_conditions?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          email?: string
          gender?: string | null
          height?: number | null
          id?: string
          location?: string | null
          medical_conditions?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      saved_plans: {
        Row: {
          created_at: string
          duration_months: number | null
          end_date: string | null
          family_member_id: string | null
          goal: string | null
          id: string
          is_active: boolean
          plan_data: Json
          plan_type: string
          start_date: string | null
          total_days_completed: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_months?: number | null
          end_date?: string | null
          family_member_id?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean
          plan_data: Json
          plan_type: string
          start_date?: string | null
          total_days_completed?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_months?: number | null
          end_date?: string | null
          family_member_id?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean
          plan_data?: Json
          plan_type?: string
          start_date?: string | null
          total_days_completed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_plans_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          billing_cycle: string | null
          contact_number: string | null
          coupon_code: string | null
          created_at: string
          currency: string | null
          expires_at: string | null
          id: string
          payment_method: string | null
          payment_number: string | null
          plan_type: string
          starts_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          xp_discount_percent: number | null
        }
        Insert: {
          amount?: number | null
          billing_cycle?: string | null
          contact_number?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_number?: string | null
          plan_type?: string
          starts_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          xp_discount_percent?: number | null
        }
        Update: {
          amount?: number | null
          billing_cycle?: string | null
          contact_number?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_number?: string | null
          plan_type?: string
          starts_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          xp_discount_percent?: number | null
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          created_at: string
          family_member_id: string | null
          id: string
          last_active_date: string | null
          level: number
          streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          family_member_id?: string | null
          id?: string
          last_active_date?: string | null
          level?: number
          streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          family_member_id?: string | null
          id?: string
          last_active_date?: string | null
          level?: number
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_consult_usage: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          session_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          session_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          session_date?: string
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
      try_use_coupon: {
        Args: { _coupon_code: string; _now: string }
        Returns: {
          coupon_id: string
          discount_percent: number
        }[]
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
