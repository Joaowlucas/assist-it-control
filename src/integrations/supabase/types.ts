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
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          room_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          room_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          room_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
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
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_unit_id_fkey"
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
          author_id: string
          content: string
          created_at: string
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          media_url: string | null
          poll_options: Json | null
          poll_votes: Json | null
          scheduled_for: string | null
          title: string
          type: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          media_url?: string | null
          poll_options?: Json | null
          poll_votes?: Json | null
          scheduled_for?: string | null
          title: string
          type?: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          media_url?: string | null
          poll_options?: Json | null
          poll_votes?: Json | null
          scheduled_for?: string | null
          title?: string
          type?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_posts_author_id_fkey"
            columns: ["author_id"]
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
          request_id: string
          equipment_id: string
          admin_comments?: string
        }
        Returns: undefined
      }
      can_access_chat_room: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      can_access_chat_room_secure: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      can_delete_chat_room: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      generate_tombamento: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_notification_recipients: {
        Args: { notification_type: string; entity_data?: Json }
        Returns: {
          user_id: string
          phone: string
          name: string
        }[]
      }
      get_technician_units: {
        Args: { technician_id: string }
        Returns: {
          unit_id: string
          unit_name: string
        }[]
      }
      get_user_chat_rooms: {
        Args: { user_id: string }
        Returns: {
          room_id: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      increment_tutorial_views: {
        Args: { tutorial_id: string }
        Returns: undefined
      }
      reject_equipment_request: {
        Args: { request_id: string; admin_comments?: string }
        Returns: undefined
      }
      technician_has_unit_access: {
        Args: { technician_id: string; unit_id: string }
        Returns: boolean
      }
      user_can_access_chat_room: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      assignment_status: "ativo" | "finalizado"
      equipment_status: "disponivel" | "em_uso" | "manutencao" | "descartado"
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
    Enums: {
      assignment_status: ["ativo", "finalizado"],
      equipment_status: ["disponivel", "em_uso", "manutencao", "descartado"],
      ticket_category: ["hardware", "software", "rede", "acesso", "outros"],
      ticket_priority: ["baixa", "media", "alta", "critica"],
      ticket_status: ["aberto", "em_andamento", "aguardando", "fechado"],
      user_role: ["admin", "technician", "user"],
    },
  },
} as const
