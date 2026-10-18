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
      demo_activity: {
        Row: {
          activity_key: string
          completed_at: string
          credits: number
          id: string
          title: string
          user_id: string
        }
        Insert: {
          activity_key: string
          completed_at?: string
          credits: number
          id?: string
          title: string
          user_id: string
        }
        Update: {
          activity_key?: string
          completed_at?: string
          credits?: number
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_sessions: {
        Row: {
          activity_key: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          activity_key: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          activity_key?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rewards: {
        Row: {
          claimed: boolean
          day: string
          id: string
          level: number
          reward: number
          started_at: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          day?: string
          id?: string
          level: number
          reward?: number
          started_at?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          day?: string
          id?: string
          level?: number
          reward?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          id: string
          image_url: string
          link: string
          proof_question: string
          require_screenshot: boolean
          reward: number
          title: string
          watch_seconds: number
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          link?: string
          proof_question?: string
          require_screenshot?: boolean
          reward: number
          title: string
          watch_seconds?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          link?: string
          proof_question?: string
          require_screenshot?: boolean
          reward?: number
          title?: string
          watch_seconds?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banned: boolean
          created_at: string
          date_of_birth: string | null
          display_name: string
          email: string
          id: string
          signup_bonus: number
        }
        Insert: {
          banned?: boolean
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string
          id: string
          signup_bonus?: number
        }
        Update: {
          banned?: boolean
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string
          id?: string
          signup_bonus?: number
        }
        Relationships: []
      }
      reward_events: {
        Row: {
          awarded_by: string | null
          claimed: boolean
          claimed_at: string | null
          id: string
          kind: string
          level: number | null
          request_id: string | null
          reward: number
          started_at: string
          user_id: string
        }
        Insert: {
          awarded_by?: string | null
          claimed?: boolean
          claimed_at?: string | null
          id?: string
          kind: string
          level?: number | null
          request_id?: string | null
          reward: number
          started_at?: string
          user_id: string
        }
        Update: {
          awarded_by?: string | null
          claimed?: boolean
          claimed_at?: string | null
          id?: string
          kind?: string
          level?: number | null
          request_id?: string | null
          reward?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_events_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          offer_title: string
          proof: string
          reviewed_at: string | null
          reward: number
          screenshot_path: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          offer_title: string
          proof?: string
          reviewed_at?: string | null
          reward: number
          screenshot_path?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          offer_title?: string
          proof?: string
          reviewed_at?: string | null
          reward?: number
          screenshot_path?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      video_views: {
        Row: {
          claimed: boolean
          id: string
          offer_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          id?: string
          offer_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          id?: string
          offer_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_views_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          details: string
          id: string
          method: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          details: string
          id?: string
          method: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          details?: string
          id?: string
          method?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_user_bonus: {
        Args: { _request: string; _user: string }
        Returns: number
      }
      box_status: { Args: never; Returns: Json }
      claim_box_reward: { Args: never; Returns: number }
      claim_game_reward: { Args: { _level: number }; Returns: number }
      claim_video: { Args: { _offer: string }; Returns: number }
      complete_demo_activity: {
        Args: { activity: string; answer: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_withdrawal: {
        Args: { _amount: number; _details: string; _method: string }
        Returns: undefined
      }
      review_submission: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      review_withdrawal: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      start_box_claim: { Args: never; Returns: undefined }
      start_demo_activity: { Args: { activity: string }; Returns: undefined }
      start_game_claim: { Args: { _level: number }; Returns: undefined }
      start_video: { Args: { _offer: string }; Returns: undefined }
      submit_offer: {
        Args: { _offer: string; _proof: string }
        Returns: undefined
      }
      submit_proof: {
        Args: { _answer: string; _offer: string; _screenshot: string }
        Returns: undefined
      }
      user_balance: { Args: { _user: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
