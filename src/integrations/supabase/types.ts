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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          assigned_by: string
          created_at: string | null
          end_date: string | null
          equipment_id: string
          id: string
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string | null
          end_date?: string | null
          equipment_id: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string | null
          end_date?: string | null
          equipment_id?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          mentions: Json | null
          message_type: string | null
          reply_to_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          mentions?: Json | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          mentions?: Json | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_muted: boolean | null
          joined_at: string | null
          left_at: string | null
          muted_until: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          muted_until?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          muted_until?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          purchase_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          tombamento: string | null
          type: string
          unit_id: string | null
          updated_at: string | null
          warranty_end_date: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          tombamento?: string | null
          type: string
          unit_id?: string | null
          updated_at?: string | null
          warranty_end_date?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          tombamento?: string | null
          type?: string
          unit_id?: string | null
          updated_at?: string | null
          warranty_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          equipment_id: string
          id: string
          is_primary: boolean | null
          photo_url: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          equipment_id: string
          id?: string
          is_primary?: boolean | null
          photo_url: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          equipment_id?: string
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_photos_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_requests: {
        Row: {
          admin_comments: string | null
          created_at: string | null
          equipment_type: string
          id: string
          justification: string
          priority: string
          requested_at: string
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          specifications: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_comments?: string | null
          created_at?: string | null
          equipment_type: string
          id?: string
          justification: string
          priority?: string
          requested_at?: string
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specifications?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_comments?: string | null
          created_at?: string | null
          equipment_type?: string
          id?: string
          justification?: string
          priority?: string
          requested_at?: string
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specifications?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_content: {
        Row: {
          content: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string
          content: string
          created_at: string
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          media_url: string | null
          poll_options: Json | null
          poll_votes: Json | null
          rejection_reason: string | null
          scheduled_for: string | null
          status: string | null
          title: string
          type: string
          unit_ids: Json | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          media_url?: string | null
          poll_options?: Json | null
          poll_votes?: Json | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          status?: string | null
          title: string
          type?: string
          unit_ids?: Json | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          media_url?: string | null
          poll_options?: Json | null
          poll_votes?: Json | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          status?: string | null
          title?: string
          type?: string
          unit_ids?: Json | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_posts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          attachment_type: Database["public"]["Enums"]["attachment_type"]
          created_at: string | null
          duration: number | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          message_id: string
          mime_type: string | null
          thumbnail_url: string | null
        }
        Insert: {
          attachment_type: Database["public"]["Enums"]["attachment_type"]
          created_at?: string | null
          duration?: number | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          message_id: string
          mime_type?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          attachment_type?: Database["public"]["Enums"]["attachment_type"]
          created_at?: string | null
          duration?: number | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          conversation_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          message_id: string | null
          moderator_id: string
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          conversation_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          message_id?: string | null
          moderator_id: string
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          conversation_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          message_id?: string | null
          moderator_id?: string
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          message: string
          notification_type: string
          phone: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          message: string
          notification_type: string
          phone: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          message?: string
          notification_type?: string
          phone?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          notification_type: string
          phone_override: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type: string
          phone_override?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type?: string
          phone_override?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_post_comments_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "landing_page_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_post_likes_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "landing_page_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post_likes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predefined_texts: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          text_content: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          text_content: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          text_content?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          auto_assign_tickets: boolean
          company_logo_url: string | null
          company_name: string
          created_at: string
          custom_destructive_color: string | null
          custom_destructive_foreground_color: string | null
          custom_foreground_color: string | null
          custom_muted_foreground_color: string | null
          custom_primary_color: string | null
          custom_primary_foreground_color: string | null
          custom_secondary_color: string | null
          custom_secondary_foreground_color: string | null
          default_priority: string
          department_name: string
          enable_custom_colors: boolean | null
          equipment_email: string
          evolution_api_token: string | null
          evolution_api_url: string | null
          evolution_instance_name: string | null
          id: string
          landing_page_enabled: boolean | null
          landing_page_subtitle: string | null
          landing_page_title: string | null
          support_email: string
          ticket_email: string
          updated_at: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          auto_assign_tickets?: boolean
          company_logo_url?: string | null
          company_name?: string
          created_at?: string
          custom_destructive_color?: string | null
          custom_destructive_foreground_color?: string | null
          custom_foreground_color?: string | null
          custom_muted_foreground_color?: string | null
          custom_primary_color?: string | null
          custom_primary_foreground_color?: string | null
          custom_secondary_color?: string | null
          custom_secondary_foreground_color?: string | null
          default_priority?: string
          department_name?: string
          enable_custom_colors?: boolean | null
          equipment_email?: string
          evolution_api_token?: string | null
          evolution_api_url?: string | null
          evolution_instance_name?: string | null
          id?: string
          landing_page_enabled?: boolean | null
          landing_page_subtitle?: string | null
          landing_page_title?: string | null
          support_email?: string
          ticket_email?: string
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          auto_assign_tickets?: boolean
          company_logo_url?: string | null
          company_name?: string
          created_at?: string
          custom_destructive_color?: string | null
          custom_destructive_foreground_color?: string | null
          custom_foreground_color?: string | null
          custom_muted_foreground_color?: string | null
          custom_primary_color?: string | null
          custom_primary_foreground_color?: string | null
          custom_secondary_color?: string | null
          custom_secondary_foreground_color?: string | null
          default_priority?: string
          department_name?: string
          enable_custom_colors?: boolean | null
          equipment_email?: string
          evolution_api_token?: string | null
          evolution_api_url?: string | null
          evolution_instance_name?: string | null
          id?: string
          landing_page_enabled?: boolean | null
          landing_page_subtitle?: string | null
          landing_page_title?: string | null
          support_email?: string
          ticket_email?: string
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      technician_units: {
        Row: {
          created_at: string | null
          id: string
          technician_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          technician_id: string
          unit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          technician_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_units_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          ticket_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          ticket_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          ticket_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_templates: {
        Row: {
          category: string
          created_at: string
          description_template: string
          id: string
          is_active: boolean
          name: string
          priority: string
          title_template: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description_template: string
          id?: string
          is_active?: boolean
          name: string
          priority?: string
          title_template: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_template?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: string
          title_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assignee_id: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string | null
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          requester_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: number
          title: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at?: string | null
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          requester_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: number
          title: string
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          requester_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: number
          title?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          author_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          view_count: number
        }
        Insert: {
          author_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          view_count?: number
        }
        Update: {
          author_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          view_count?: number
        }
        Relationships: []
      }
      units: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          id: string
          is_typing_in: string | null
          last_seen: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_typing_in?: string | null
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_typing_in?: string | null
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_is_typing_in_fkey"
            columns: ["is_typing_in"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_notifications: {
        Row: {
          created_at: string | null
          error_message: string | null
          evolution_message_id: string | null
          id: string
          message: string
          phone_number: string
          sent_at: string | null
          status: string | null
          ticket_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message: string
          phone_number: string
          sent_at?: string | null
          status?: string | null
          ticket_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message?: string
          phone_number?: string
          sent_at?: string | null
          status?: string | null
          ticket_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_notifications_user_id_fkey"
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
      approve_equipment_request_and_assign: {
        Args: {
          admin_comments?: string
          equipment_id: string
          request_id: string
        }
        Returns: undefined
      }
      can_access_conversation: {
        Args: { conversation_id: string; user_id: string }
        Returns: boolean
      }
      generate_tombamento: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_notification_recipients: {
        Args: { entity_data?: Json; notification_type: string }
        Returns: {
          name: string
          phone: string
          user_id: string
        }[]
      }
      get_technician_units: {
        Args: { technician_id: string }
        Returns: {
          unit_id: string
          unit_name: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_unit_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_tutorial_views: {
        Args: { tutorial_id: string }
        Returns: undefined
      }
      reject_equipment_request: {
        Args: { admin_comments?: string; request_id: string }
        Returns: undefined
      }
      technician_has_unit_access: {
        Args: { technician_id: string; unit_id: string }
        Returns: boolean
      }
      user_can_approve_posts: {
        Args: { post_unit_ids: Json; user_id: string; user_role: string }
        Returns: boolean
      }
      user_can_view_post: {
        Args: { post_unit_ids: Json; user_role: string; user_unit_id: string }
        Returns: boolean
      }
    }
    Enums: {
      assignment_status: "ativo" | "finalizado"
      attachment_type: "image" | "video" | "document" | "audio"
      conversation_type: "direct" | "group"
      equipment_status: "disponivel" | "em_uso" | "manutencao" | "descartado"
      message_status: "sent" | "delivered" | "read" | "edited" | "deleted"
      moderation_action: "delete_message" | "mute_user" | "ban_user" | "warning"
      ticket_category: "hardware" | "software" | "rede" | "acesso" | "outros"
      ticket_priority: "baixa" | "media" | "alta" | "critica"
      ticket_status: "aberto" | "em_andamento" | "aguardando" | "fechado"
      user_role: "admin" | "technician" | "user"
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
      assignment_status: ["ativo", "finalizado"],
      attachment_type: ["image", "video", "document", "audio"],
      conversation_type: ["direct", "group"],
      equipment_status: ["disponivel", "em_uso", "manutencao", "descartado"],
      message_status: ["sent", "delivered", "read", "edited", "deleted"],
      moderation_action: ["delete_message", "mute_user", "ban_user", "warning"],
      ticket_category: ["hardware", "software", "rede", "acesso", "outros"],
      ticket_priority: ["baixa", "media", "alta", "critica"],
      ticket_status: ["aberto", "em_andamento", "aguardando", "fechado"],
      user_role: ["admin", "technician", "user"],
    },
  },
} as const
