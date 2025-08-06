export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      autoresponder_followup_configs: {
        Row: {
          autoresponder_message_id: string | null
          comment_autoresponder_id: string | null
          created_at: string
          delay_hours: number
          general_autoresponder_id: string | null
          id: string
          is_active: boolean
          message_text: string
          sequence_order: number
          updated_at: string
        }
        Insert: {
          autoresponder_message_id?: string | null
          comment_autoresponder_id?: string | null
          created_at?: string
          delay_hours: number
          general_autoresponder_id?: string | null
          id?: string
          is_active?: boolean
          message_text: string
          sequence_order: number
          updated_at?: string
        }
        Update: {
          autoresponder_message_id?: string | null
          comment_autoresponder_id?: string | null
          created_at?: string
          delay_hours?: number
          general_autoresponder_id?: string | null
          id?: string
          is_active?: boolean
          message_text?: string
          sequence_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_autoresponder_followup_configs_message_id"
            columns: ["autoresponder_message_id"]
            isOneToOne: false
            referencedRelation: "autoresponder_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_followup_configs_comment_autoresponder"
            columns: ["comment_autoresponder_id"]
            isOneToOne: false
            referencedRelation: "comment_autoresponders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_followup_configs_general_autoresponder"
            columns: ["general_autoresponder_id"]
            isOneToOne: false
            referencedRelation: "general_comment_autoresponders"
            referencedColumns: ["id"]
          },
        ]
      }
      autoresponder_followups: {
        Row: {
          autoresponder_message_id: string | null
          comment_autoresponder_id: string | null
          created_at: string
          followup_message_text: string
          followup_scheduled_at: string
          followup_sent_at: string | null
          general_autoresponder_id: string | null
          id: string
          initial_message_sent_at: string
          is_completed: boolean
          prospect_responded: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          autoresponder_message_id?: string | null
          comment_autoresponder_id?: string | null
          created_at?: string
          followup_message_text?: string
          followup_scheduled_at: string
          followup_sent_at?: string | null
          general_autoresponder_id?: string | null
          id?: string
          initial_message_sent_at: string
          is_completed?: boolean
          prospect_responded?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          autoresponder_message_id?: string | null
          comment_autoresponder_id?: string | null
          created_at?: string
          followup_message_text?: string
          followup_scheduled_at?: string
          followup_sent_at?: string | null
          general_autoresponder_id?: string | null
          id?: string
          initial_message_sent_at?: string
          is_completed?: boolean
          prospect_responded?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autoresponder_followups_autoresponder_message_id_fkey"
            columns: ["autoresponder_message_id"]
            isOneToOne: false
            referencedRelation: "autoresponder_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      autoresponder_messages: {
        Row: {
          buttons: Json | null
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
          use_buttons: boolean | null
          use_keywords: boolean | null
        }
        Insert: {
          buttons?: Json | null
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
          use_buttons?: boolean | null
          use_keywords?: boolean | null
        }
        Update: {
          buttons?: Json | null
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
          use_buttons?: boolean | null
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
      button_postback_actions: {
        Row: {
          action_data: Json
          action_type: string
          autoresponder_id: string | null
          created_at: string
          id: string
          payload_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_data: Json
          action_type: string
          autoresponder_id?: string | null
          created_at?: string
          id?: string
          payload_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          autoresponder_id?: string | null
          created_at?: string
          id?: string
          payload_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          button_text: string | null
          button_type: string | null
          button_url: string | null
          buttons: Json | null
          created_at: string
          dm_message: string
          follower_confirmation_message: string | null
          id: string
          is_active: boolean
          keywords: string[]
          name: string
          post_caption: string | null
          post_id: string
          post_url: string
          postback_response: string | null
          public_reply_messages: string[] | null
          require_follower: boolean
          updated_at: string
          use_button_message: boolean | null
          use_buttons: boolean | null
          user_id: string
        }
        Insert: {
          button_text?: string | null
          button_type?: string | null
          button_url?: string | null
          buttons?: Json | null
          created_at?: string
          dm_message: string
          follower_confirmation_message?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          name: string
          post_caption?: string | null
          post_id: string
          post_url: string
          postback_response?: string | null
          public_reply_messages?: string[] | null
          require_follower?: boolean
          updated_at?: string
          use_button_message?: boolean | null
          use_buttons?: boolean | null
          user_id: string
        }
        Update: {
          button_text?: string | null
          button_type?: string | null
          button_url?: string | null
          buttons?: Json | null
          created_at?: string
          dm_message?: string
          follower_confirmation_message?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          name?: string
          post_caption?: string | null
          post_id?: string
          post_url?: string
          postback_response?: string | null
          public_reply_messages?: string[] | null
          require_follower?: boolean
          updated_at?: string
          use_button_message?: boolean | null
          use_buttons?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      general_comment_autoresponders: {
        Row: {
          auto_assign_to_all_posts: boolean | null
          button_text: string | null
          button_type: string | null
          button_url: string | null
          buttons: Json | null
          created_at: string
          dm_message: string
          follower_confirmation_message: string | null
          id: string
          is_active: boolean
          keywords: string[]
          name: string
          postback_response: string | null
          public_reply_messages: string[] | null
          require_follower: boolean
          updated_at: string
          use_button_message: boolean | null
          use_buttons: boolean | null
          user_id: string
        }
        Insert: {
          auto_assign_to_all_posts?: boolean | null
          button_text?: string | null
          button_type?: string | null
          button_url?: string | null
          buttons?: Json | null
          created_at?: string
          dm_message: string
          follower_confirmation_message?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          name: string
          postback_response?: string | null
          public_reply_messages?: string[] | null
          require_follower?: boolean
          updated_at?: string
          use_button_message?: boolean | null
          use_buttons?: boolean | null
          user_id: string
        }
        Update: {
          auto_assign_to_all_posts?: boolean | null
          button_text?: string | null
          button_type?: string | null
          button_url?: string | null
          buttons?: Json | null
          created_at?: string
          dm_message?: string
          follower_confirmation_message?: string | null
          id?: string
          is_active?: boolean
          keywords?: string[]
          name?: string
          postback_response?: string | null
          public_reply_messages?: string[] | null
          require_follower?: boolean
          updated_at?: string
          use_button_message?: boolean | null
          use_buttons?: boolean | null
          user_id?: string
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
      pending_follower_confirmations: {
        Row: {
          autoresponder_id: string
          autoresponder_type: string
          commenter_id: string
          commenter_username: string | null
          confirmation_message_sent: string
          confirmation_sent_at: string
          confirmed_at: string | null
          created_at: string
          expires_at: string
          id: string
          is_confirmed: boolean
          original_comment_text: string | null
          original_dm_message: string
          original_message_sent: boolean
          original_message_sent_at: string | null
          updated_at: string
        }
        Insert: {
          autoresponder_id: string
          autoresponder_type: string
          commenter_id: string
          commenter_username?: string | null
          confirmation_message_sent: string
          confirmation_sent_at?: string
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_confirmed?: boolean
          original_comment_text?: string | null
          original_dm_message: string
          original_message_sent?: boolean
          original_message_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          autoresponder_id?: string
          autoresponder_type?: string
          commenter_id?: string
          commenter_username?: string | null
          confirmation_message_sent?: string
          confirmation_sent_at?: string
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_confirmed?: boolean
          original_comment_text?: string | null
          original_dm_message?: string
          original_message_sent?: boolean
          original_message_sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_autoresponder_assignments: {
        Row: {
          created_at: string
          general_autoresponder_id: string
          id: string
          is_active: boolean
          post_caption: string | null
          post_id: string
          post_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          general_autoresponder_id: string
          id?: string
          is_active?: boolean
          post_caption?: string | null
          post_id: string
          post_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          general_autoresponder_id?: string
          id?: string
          is_active?: boolean
          post_caption?: string | null
          post_id?: string
          post_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_autoresponder_assignments_general_autoresponder_id_fkey"
            columns: ["general_autoresponder_id"]
            isOneToOne: false
            referencedRelation: "general_comment_autoresponders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country_code: string | null
          created_at: string
          email: string
          id: string
          name: string
          niche: string
          niche_detail: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          niche: string
          niche_detail?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          niche?: string
          niche_detail?: string | null
          phone?: string
          updated_at?: string
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
      prospect_messages: {
        Row: {
          created_at: string
          id: string
          is_from_prospect: boolean
          message_instagram_id: string
          message_text: string | null
          message_timestamp: string
          message_type: string | null
          prospect_id: string | null
          raw_data: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_from_prospect: boolean
          message_instagram_id: string
          message_text?: string | null
          message_timestamp: string
          message_type?: string | null
          prospect_id?: string | null
          raw_data?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_from_prospect?: boolean
          message_instagram_id?: string
          message_text?: string | null
          message_timestamp?: string
          message_type?: string | null
          prospect_id?: string | null
          raw_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_messages_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          created_at: string
          first_contact_date: string
          id: string
          instagram_user_id: string | null
          last_message_date: string
          last_message_from_prospect: boolean
          profile_picture_url: string | null
          prospect_instagram_id: string
          status: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          first_contact_date?: string
          id?: string
          instagram_user_id?: string | null
          last_message_date?: string
          last_message_from_prospect?: boolean
          profile_picture_url?: string | null
          prospect_instagram_id: string
          status?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          first_contact_date?: string
          id?: string
          instagram_user_id?: string | null
          last_message_date?: string
          last_message_from_prospect?: boolean
          profile_picture_url?: string | null
          prospect_instagram_id?: string
          status?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospects_instagram_user_id_fkey"
            columns: ["instagram_user_id"]
            isOneToOne: false
            referencedRelation: "instagram_users"
            referencedColumns: ["id"]
          },
        ]
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
      add_prospect_message: {
        Args: {
          p_prospect_id: string
          p_message_instagram_id: string
          p_message_text: string
          p_is_from_prospect: boolean
          p_message_timestamp: string
          p_message_type?: string
          p_raw_data?: Json
        }
        Returns: string
      }
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
      create_or_update_prospect: {
        Args: {
          p_instagram_user_id: string
          p_prospect_instagram_id: string
          p_username: string
          p_profile_picture_url?: string
        }
        Returns: string
      }
      get_instagram_token_by_user_id: {
        Args: { user_instagram_id: string }
        Returns: string
      }
      increment_nuevos_prospectos_by_instagram_id: {
        Args: { user_instagram_id: string; increment_by?: number }
        Returns: undefined
      }
      process_pending_followups: {
        Args: Record<PropertyKey, never>
        Returns: {
          processed_count: number
          details: Json
        }[]
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
