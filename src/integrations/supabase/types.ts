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
      autoresponder_messages: {
        Row: {
          created_at: string
          id: string
          instagram_user_id: string | null
          instagram_user_id_ref: string | null
          is_active: boolean
          keywords: string[] | null
          message_text: string
          name: string
          send_only_first_message: boolean
          updated_at: string
          use_keywords: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          instagram_user_id?: string | null
          instagram_user_id_ref?: string | null
          is_active?: boolean
          keywords?: string[] | null
          message_text: string
          name: string
          send_only_first_message?: boolean
          updated_at?: string
          use_keywords?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          instagram_user_id?: string | null
          instagram_user_id_ref?: string | null
          is_active?: boolean
          keywords?: string[] | null
          message_text?: string
          name?: string
          send_only_first_message?: boolean
          updated_at?: string
          use_keywords?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "autoresponder_messages_instagram_user_id_fkey"
            columns: ["instagram_user_id"]
            isOneToOne: false
            referencedRelation: "instagram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      autoresponder_sent_log: {
        Row: {
          autoresponder_message_id: string | null
          id: string
          sender_id: string
          sent_at: string
        }
        Insert: {
          autoresponder_message_id?: string | null
          id?: string
          sender_id: string
          sent_at?: string
        }
        Update: {
          autoresponder_message_id?: string | null
          id?: string
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autoresponder_sent_log_autoresponder_message_id_fkey"
            columns: ["autoresponder_message_id"]
            isOneToOne: false
            referencedRelation: "autoresponder_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_autoresponder_log: {
        Row: {
          comment_autoresponder_id: string | null
          comment_text: string | null
          commenter_instagram_id: string
          dm_message_sent: string
          dm_sent_at: string
          id: string
          webhook_data: Json | null
        }
        Insert: {
          comment_autoresponder_id?: string | null
          comment_text?: string | null
          commenter_instagram_id: string
          dm_message_sent: string
          dm_sent_at?: string
          id?: string
          webhook_data?: Json | null
        }
        Update: {
          comment_autoresponder_id?: string | null
          comment_text?: string | null
          commenter_instagram_id?: string
          dm_message_sent?: string
          dm_sent_at?: string
          id?: string
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_autoresponder_log_new_comment_autoresponder_id_fkey"
            columns: ["comment_autoresponder_id"]
            isOneToOne: false
            referencedRelation: "comment_autoresponders"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_autoresponders: {
        Row: {
          created_at: string
          dm_message: string
          id: string
          is_active: boolean
          keywords: string[]
          name: string
          post_caption: string | null
          post_id: string
          post_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dm_message: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          name: string
          post_caption?: string | null
          post_id: string
          post_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dm_message?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          name?: string
          post_caption?: string | null
          post_id?: string
          post_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      ideal_client_traits: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          instagram_user_id: string | null
          instagram_user_id_ref: string | null
          position: number
          trait: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          instagram_user_id?: string | null
          instagram_user_id_ref?: string | null
          position?: number
          trait: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          instagram_user_id?: string | null
          instagram_user_id_ref?: string | null
          position?: number
          trait?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideal_client_traits_instagram_user_id_fkey"
            columns: ["instagram_user_id"]
            isOneToOne: false
            referencedRelation: "instagram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_messages: {
        Row: {
          conversation_stage: string | null
          created_at: string
          id: string
          instagram_message_id: string
          instagram_user_id: string | null
          is_inscription: boolean | null
          is_invitation: boolean | null
          is_presentation: boolean | null
          is_read: boolean | null
          message_text: string
          message_type: string
          raw_data: Json | null
          recipient_id: string
          response_time_seconds: number | null
          sender_id: string
          timestamp: string
          updated_at: string
        }
        Insert: {
          conversation_stage?: string | null
          created_at?: string
          id?: string
          instagram_message_id: string
          instagram_user_id?: string | null
          is_inscription?: boolean | null
          is_invitation?: boolean | null
          is_presentation?: boolean | null
          is_read?: boolean | null
          message_text?: string
          message_type: string
          raw_data?: Json | null
          recipient_id: string
          response_time_seconds?: number | null
          sender_id: string
          timestamp?: string
          updated_at?: string
        }
        Update: {
          conversation_stage?: string | null
          created_at?: string
          id?: string
          instagram_message_id?: string
          instagram_user_id?: string | null
          is_inscription?: boolean | null
          is_invitation?: boolean | null
          is_presentation?: boolean | null
          is_read?: boolean | null
          message_text?: string
          message_type?: string
          raw_data?: Json | null
          recipient_id?: string
          response_time_seconds?: number | null
          sender_id?: string
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_messages_instagram_user_id_fkey"
            columns: ["instagram_user_id"]
            isOneToOne: false
            referencedRelation: "instagram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_users: {
        Row: {
          access_token: string
          created_at: string
          ia_persona: string | null
          id: string
          instagram_user_id: string
          is_active: boolean
          nuevos_prospectos_contactados: number
          openai_api_key: string | null
          page_id: string | null
          token_expires_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          access_token: string
          created_at?: string
          ia_persona?: string | null
          id?: string
          instagram_user_id: string
          is_active?: boolean
          nuevos_prospectos_contactados?: number
          openai_api_key?: string | null
          page_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          access_token?: string
          created_at?: string
          ia_persona?: string | null
          id?: string
          instagram_user_id?: string
          is_active?: boolean
          nuevos_prospectos_contactados?: number
          openai_api_key?: string | null
          page_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      prospect_analysis: {
        Row: {
          analysis_data: Json | null
          created_at: string
          id: string
          last_analyzed_at: string | null
          match_points: number | null
          message_count: number | null
          met_trait_indices: number[] | null
          met_traits: string[] | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          id?: string
          last_analyzed_at?: string | null
          match_points?: number | null
          message_count?: number | null
          met_trait_indices?: number[] | null
          met_traits?: string[] | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          id?: string
          last_analyzed_at?: string | null
          match_points?: number | null
          message_count?: number | null
          met_trait_indices?: number[] | null
          met_traits?: string[] | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospect_last_activity: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string
          prospect_id: string
          traits_reset_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string
          prospect_id: string
          traits_reset_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string
          prospect_id?: string
          traits_reset_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          ai_delay: number | null
          ai_enabled: boolean | null
          auto_reset_hours: number | null
          created_at: string
          ia_persona: string | null
          id: string
          instagram_access_token: string | null
          instagram_page_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_delay?: number | null
          ai_enabled?: boolean | null
          auto_reset_hours?: number | null
          created_at?: string
          ia_persona?: string | null
          id?: string
          instagram_access_token?: string | null
          instagram_page_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_delay?: number | null
          ai_enabled?: boolean | null
          auto_reset_hours?: number | null
          created_at?: string
          ia_persona?: string | null
          id?: string
          instagram_access_token?: string | null
          instagram_page_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_advanced_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_sent: number
          total_responses: number
          total_invitations: number
          total_presentations: number
          total_inscriptions: number
          messages_per_response: number
          messages_per_invitation: number
          messages_per_presentation: number
          invitations_per_presentation: number
          messages_per_inscription: number
          invitations_per_inscription: number
          presentations_per_inscription: number
          today_messages: number
          response_rate_percentage: number
          avg_response_time_seconds: number
          last_message_date: string
        }[]
      }
      calculate_advanced_metrics_by_instagram_user: {
        Args: { user_instagram_id: string }
        Returns: {
          total_sent: number
          total_responses: number
          total_invitations: number
          total_presentations: number
          total_inscriptions: number
          messages_per_response: number
          messages_per_invitation: number
          messages_per_presentation: number
          invitations_per_presentation: number
          messages_per_inscription: number
          invitations_per_inscription: number
          presentations_per_inscription: number
          today_messages: number
          response_rate_percentage: number
          avg_response_time_seconds: number
          last_message_date: string
        }[]
      }
      get_instagram_token_by_user_id: {
        Args: { user_instagram_id: string }
        Returns: string
      }
      increment_nuevos_prospectos_by_instagram_id: {
        Args: { user_instagram_id: string; increment_by?: number }
        Returns: undefined
      }
      reset_inactive_prospect_traits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      reset_nuevos_prospectos_by_instagram_id: {
        Args: { user_instagram_id: string }
        Returns: undefined
      }
      update_prospect_activity: {
        Args: { p_prospect_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
