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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      answer_options: {
        Row: {
          body: string
          id: string
          is_correct: boolean
          label: string
          question_id: string
          sort_order: number
        }
        Insert: {
          body: string
          id?: string
          is_correct?: boolean
          label: string
          question_id: string
          sort_order?: number
        }
        Update: {
          body?: string
          id?: string
          is_correct?: boolean
          label?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          answered: number
          correct: number
          duration_sec: number | null
          id: string
          mode: string
          question_ids: string[]
          score_pct: number | null
          started_at: string
          status: string
          subject_id: string | null
          submitted_at: string | null
          time_limit_sec: number | null
          timed: boolean
          title: string
          total: number
          user_id: string
        }
        Insert: {
          answered?: number
          correct?: number
          duration_sec?: number | null
          id?: string
          mode: string
          question_ids?: string[]
          score_pct?: number | null
          started_at?: string
          status?: string
          subject_id?: string | null
          submitted_at?: string | null
          time_limit_sec?: number | null
          timed?: boolean
          title?: string
          total?: number
          user_id: string
        }
        Update: {
          answered?: number
          correct?: number
          duration_sec?: number | null
          id?: string
          mode?: string
          question_ids?: string[]
          score_pct?: number | null
          started_at?: string
          status?: string
          subject_id?: string | null
          submitted_at?: string | null
          time_limit_sec?: number | null
          timed?: boolean
          title?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      clinical_cases: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          key_learning: string[]
          presentation: string
          red_flags: string[]
          references: string[]
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          steps: Json
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          key_learning?: string[]
          presentation: string
          red_flags?: string[]
          references?: string[]
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          steps?: Json
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          key_learning?: string[]
          presentation?: string
          red_flags?: string[]
          references?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          steps?: Json
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_cases_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reviews: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          from_status: Database["public"]["Enums"]["content_status"] | null
          id: string
          note: string
          reviewer_id: string | null
          to_status: Database["public"]["Enums"]["content_status"]
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          from_status?: Database["public"]["Enums"]["content_status"] | null
          id?: string
          note?: string
          reviewer_id?: string | null
          to_status: Database["public"]["Enums"]["content_status"]
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          from_status?: Database["public"]["Enums"]["content_status"] | null
          id?: string
          note?: string
          reviewer_id?: string | null
          to_status?: Database["public"]["Enums"]["content_status"]
        }
        Relationships: []
      }
      content_sources: {
        Row: {
          citation: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          url: string | null
        }
        Insert: {
          citation: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          url?: string | null
        }
        Update: {
          citation?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          url?: string | null
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          actions: number
          day: string
          user_id: string
        }
        Insert: {
          actions?: number
          day: string
          user_id: string
        }
        Update: {
          actions?: number
          day?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_feedback: {
        Row: {
          created_at: string
          id: string
          improved_answer: string
          improvements: string[]
          overall: number | null
          revision_topics: string[]
          safety_flags: string[]
          scores: Json
          session_id: string
          strengths: string[]
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          improved_answer?: string
          improvements?: string[]
          overall?: number | null
          revision_topics?: string[]
          safety_flags?: string[]
          scores?: Json
          session_id: string
          strengths?: string[]
          summary?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          improved_answer?: string
          improvements?: string[]
          overall?: number | null
          revision_topics?: string[]
          safety_flags?: string[]
          scores?: Json
          session_id?: string
          strengths?: string[]
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          duration_min: number
          ended_at: string | null
          id: string
          mode: string
          question_count: number
          started_at: string
          status: string
          transcript: Json
          user_id: string
        }
        Insert: {
          duration_min?: number
          ended_at?: string | null
          id?: string
          mode: string
          question_count?: number
          started_at?: string
          status?: string
          transcript?: Json
          user_id: string
        }
        Update: {
          duration_min?: number
          ended_at?: string | null
          id?: string
          mode?: string
          question_count?: number
          started_at?: string
          status?: string
          transcript?: Json
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          clinical_example: string
          created_at: string
          est_minutes: number
          high_yield: string[]
          id: string
          notes_md: string
          objectives: string[]
          references: string[]
          review_note: string
          reviewed_on: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          subject_id: string
          summary: string
          title: string
          updated_at: string
          viva_prompts: string[]
        }
        Insert: {
          clinical_example?: string
          created_at?: string
          est_minutes?: number
          high_yield?: string[]
          id?: string
          notes_md?: string
          objectives?: string[]
          references?: string[]
          review_note?: string
          reviewed_on?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subject_id: string
          summary?: string
          title: string
          updated_at?: string
          viva_prompts?: string[]
        }
        Update: {
          clinical_example?: string
          created_at?: string
          est_minutes?: number
          high_yield?: string[]
          id?: string
          notes_md?: string
          objectives?: string[]
          references?: string[]
          review_note?: string
          reviewed_on?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subject_id?: string
          summary?: string
          title?: string
          updated_at?: string
          viva_prompts?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          checklist: Json
          college: string | null
          created_at: string
          daily_hours: number
          email: string | null
          full_name: string | null
          goals: string[]
          id: string
          onboarded: boolean
          state: string | null
          target_date: string | null
          theme: string
          updated_at: string
          voice_consent: boolean
          weak_subject_ids: string[]
        }
        Insert: {
          checklist?: Json
          college?: string | null
          created_at?: string
          daily_hours?: number
          email?: string | null
          full_name?: string | null
          goals?: string[]
          id: string
          onboarded?: boolean
          state?: string | null
          target_date?: string | null
          theme?: string
          updated_at?: string
          voice_consent?: boolean
          weak_subject_ids?: string[]
        }
        Update: {
          checklist?: Json
          college?: string | null
          created_at?: string
          daily_hours?: number
          email?: string | null
          full_name?: string | null
          goals?: string[]
          id?: string
          onboarded?: boolean
          state?: string | null
          target_date?: string | null
          theme?: string
          updated_at?: string
          voice_consent?: boolean
          weak_subject_ids?: string[]
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          explanation: string
          id: string
          source_note: string
          status: Database["public"]["Enums"]["content_status"]
          stem: string
          subject_id: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string
          id?: string
          source_note?: string
          status?: Database["public"]["Enums"]["content_status"]
          stem: string
          subject_id: string
          topic?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string
          id?: string
          source_note?: string
          status?: Database["public"]["Enums"]["content_status"]
          stem?: string
          subject_id?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_notices: {
        Row: {
          advt_no: string | null
          closing_at: string | null
          created_at: string
          id: string
          is_official: boolean
          key_facts: Json
          official_url: string
          opens_on: string | null
          posts: number | null
          published_on: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          title: string
          updated_at: string
          vacancy_no: string | null
          verification_note: string
          verified_on: string | null
        }
        Insert: {
          advt_no?: string | null
          closing_at?: string | null
          created_at?: string
          id?: string
          is_official?: boolean
          key_facts?: Json
          official_url: string
          opens_on?: string | null
          posts?: number | null
          published_on?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title: string
          updated_at?: string
          vacancy_no?: string | null
          verification_note?: string
          verified_on?: string | null
        }
        Update: {
          advt_no?: string | null
          closing_at?: string | null
          created_at?: string
          id?: string
          is_official?: boolean
          key_facts?: Json
          official_url?: string
          opens_on?: string | null
          posts?: number | null
          published_on?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title?: string
          updated_at?: string
          vacancy_no?: string | null
          verification_note?: string
          verified_on?: string | null
        }
        Relationships: []
      }
      revision_schedule: {
        Row: {
          due_date: string
          id: string
          interval_days: number
          lapses: number
          last_result: boolean | null
          question_id: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          due_date: string
          id?: string
          interval_days?: number
          lapses?: number
          last_result?: boolean | null
          question_id: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          due_date?: string
          id?: string
          interval_days?: number
          lapses?: number
          last_result?: boolean | null
          question_id?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_schedule_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          active: boolean
          created_at: string
          daily_hours: number
          goals: string[]
          id: string
          length_days: number
          start_date: string
          user_id: string
          weak_subject_ids: string[]
        }
        Insert: {
          active?: boolean
          created_at?: string
          daily_hours?: number
          goals?: string[]
          id?: string
          length_days: number
          start_date: string
          user_id: string
          weak_subject_ids?: string[]
        }
        Update: {
          active?: boolean
          created_at?: string
          daily_hours?: number
          goals?: string[]
          id?: string
          length_days?: number
          start_date?: string
          user_id?: string
          weak_subject_ids?: string[]
        }
        Relationships: []
      }
      study_tasks: {
        Row: {
          day_index: number
          done: boolean
          done_at: string | null
          id: string
          lesson_id: string | null
          minutes: number
          plan_id: string
          subject_id: string | null
          task_date: string
          task_type: string
          title: string
          user_id: string
        }
        Insert: {
          day_index: number
          done?: boolean
          done_at?: string | null
          id?: string
          lesson_id?: string | null
          minutes?: number
          plan_id: string
          subject_id?: string | null
          task_date: string
          task_type: string
          title: string
          user_id: string
        }
        Update: {
          day_index?: number
          done?: boolean
          done_at?: string | null
          id?: string
          lesson_id?: string | null
          minutes?: number
          plan_id?: string
          subject_id?: string | null
          task_date?: string
          task_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          short_name: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          short_name: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          short_name?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option_id: string | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option_id?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "answer_options"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_viewed_at: string
          lesson_id: string
          status: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_viewed_at?: string
          lesson_id: string
          status?: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_viewed_at?: string
          lesson_id?: string
          status?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_usage_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_activity: { Args: never; Returns: undefined }
      record_answer: {
        Args: {
          p_attempt_id: string
          p_option_id: string
          p_question_id: string
        }
        Returns: Json
      }
      start_attempt: {
        Args: {
          p_mode: string
          p_question_ids: string[]
          p_subject_id: string
          p_time_limit_sec: number
          p_title: string
        }
        Returns: string
      }
      submit_attempt: { Args: { p_attempt_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      content_status: "draft" | "in_review" | "published" | "archived"
      difficulty_level: "easy" | "medium" | "hard"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      content_status: ["draft", "in_review", "published", "archived"],
      difficulty_level: ["easy", "medium", "hard"],
    },
  },
} as const