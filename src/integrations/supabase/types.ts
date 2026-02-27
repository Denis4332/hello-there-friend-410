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
      advertisements: {
        Row: {
          active: boolean | null
          clicks: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          end_date: string | null
          id: string
          image_url: string
          impressions: number | null
          link_url: string
          payment_method: string | null
          payment_reference: string | null
          payment_required: boolean | null
          payment_status: string | null
          popup_delay_seconds: number | null
          popup_frequency: string | null
          position: string
          price_per_day: number | null
          priority: number | null
          requested_duration: string | null
          start_date: string | null
          stripe_payment_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          clicks?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          image_url: string
          impressions?: number | null
          link_url: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          popup_delay_seconds?: number | null
          popup_frequency?: string | null
          position: string
          price_per_day?: number | null
          priority?: number | null
          requested_duration?: string | null
          start_date?: string | null
          stripe_payment_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          clicks?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          image_url?: string
          impressions?: number | null
          link_url?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          popup_delay_seconds?: number | null
          popup_frequency?: string | null
          position?: string
          price_per_day?: number | null
          priority?: number | null
          requested_duration?: string | null
          start_date?: string | null
          stripe_payment_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agb_acceptances: {
        Row: {
          acceptance_type: string
          accepted_at: string
          agb_version: string
          created_at: string
          created_by_admin: boolean
          email: string
          id: string
          ip_address: string | null
          profile_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acceptance_type: string
          accepted_at?: string
          agb_version?: string
          created_at?: string
          created_by_admin?: boolean
          email: string
          id?: string
          ip_address?: string | null
          profile_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acceptance_type?: string
          accepted_at?: string
          agb_version?: string
          created_at?: string
          created_by_admin?: boolean
          email?: string
          id?: string
          ip_address?: string | null
          profile_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agb_acceptances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agb_acceptances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_type: string
          created_at: string | null
          email: string
          failed_attempts: number | null
          id: string
          ip_address: string | null
          last_attempt_at: string | null
          locked_until: string | null
          updated_at: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          email: string
          failed_attempts?: number | null
          id?: string
          ip_address?: string | null
          last_attempt_at?: string | null
          locked_until?: string | null
          updated_at?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          email?: string
          failed_attempts?: number | null
          id?: string
          ip_address?: string | null
          last_attempt_at?: string | null
          locked_until?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cantons: {
        Row: {
          abbreviation: string
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          intro_text: string | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          intro_text?: string | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          intro_text?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      change_request_media: {
        Row: {
          created_at: string | null
          id: string
          request_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          request_id: string
          storage_path: string
        }
        Update: {
          created_at?: string | null
          id?: string
          request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_request_media_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "profile_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          canton_id: string
          created_at: string
          id: string
          intro_text: string | null
          lat: number | null
          lng: number | null
          name: string
          postal_code: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          canton_id: string
          created_at?: string
          id?: string
          intro_text?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          postal_code?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          canton_id?: string
          created_at?: string
          id?: string
          intro_text?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          postal_code?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_canton_id_fkey"
            columns: ["canton_id"]
            isOneToOne: false
            referencedRelation: "cantons"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          metadata: Json | null
          name: string
          read_at: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          metadata?: Json | null
          name: string
          read_at?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          metadata?: Json | null
          name?: string
          read_at?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      dropdown_options: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          id: string
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          id?: string
          label: string
          sort_order?: number
          value: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          label?: string
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          browser_info: string | null
          component_stack: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          url: string
          user_id: string | null
        }
        Insert: {
          browser_info?: string | null
          component_stack?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          url: string
          user_id?: string | null
        }
        Update: {
          browser_info?: string | null
          component_stack?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          media_type: string | null
          profile_id: string
          sort_order: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          media_type?: string | null
          profile_id: string
          sort_order?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          media_type?: string | null
          profile_id?: string
          sort_order?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_categories: {
        Row: {
          category_id: string
          profile_id: string
        }
        Insert: {
          category_id: string
          profile_id: string
        }
        Update: {
          category_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_change_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          description: string
          id: string
          profile_id: string
          request_type: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          description: string
          id?: string
          profile_id: string
          request_type: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          description?: string
          id?: string
          profile_id?: string
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_change_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          instagram: string | null
          phone: string | null
          profile_id: string
          show_street: boolean | null
          street_address: string | null
          telegram: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          profile_id: string
          show_street?: boolean | null
          street_address?: string | null
          telegram?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          profile_id?: string
          show_street?: boolean | null
          street_address?: string | null
          telegram?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_moderation_notes: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          note: string
          profile_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          note: string
          profile_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          note?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_moderation_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_moderation_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          profile_id: string
          referrer: string | null
          session_id: string
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          profile_id: string
          referrer?: string | null
          session_id: string
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          profile_id?: string
          referrer?: string | null
          session_id?: string
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about_me: string | null
          age: number | null
          availability_status: string | null
          canton: string
          city: string
          created_at: string | null
          display_name: string
          gender: string | null
          id: string
          is_adult: boolean
          languages: string[] | null
          last_seen_at: string | null
          lat: number | null
          listing_type: string | null
          lng: number | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          postal_code: string | null
          premium_until: string | null
          slug: string | null
          status: string | null
          top_ad_until: string | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          about_me?: string | null
          age?: number | null
          availability_status?: string | null
          canton: string
          city: string
          created_at?: string | null
          display_name: string
          gender?: string | null
          id?: string
          is_adult?: boolean
          languages?: string[] | null
          last_seen_at?: string | null
          lat?: number | null
          listing_type?: string | null
          lng?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          postal_code?: string | null
          premium_until?: string | null
          slug?: string | null
          status?: string | null
          top_ad_until?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          about_me?: string | null
          age?: number | null
          availability_status?: string | null
          canton?: string
          city?: string
          created_at?: string | null
          display_name?: string
          gender?: string | null
          id?: string
          is_adult?: boolean
          languages?: string[] | null
          last_seen_at?: string | null
          lat?: number | null
          listing_type?: string | null
          lng?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          postal_code?: string | null
          premium_until?: string | null
          slug?: string | null
          status?: string | null
          top_ad_until?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          profile_id: string
          reason: string
          reporter_user_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          profile_id: string
          reason: string
          reporter_user_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          profile_id?: string
          reason?: string
          reporter_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          canton: string | null
          category_id: string | null
          created_at: string | null
          id: string
          query_text: string | null
          radius: number | null
          results_count: number | null
          session_id: string | null
          user_id: string | null
          user_lat: number | null
          user_lng: number | null
        }
        Insert: {
          canton?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          query_text?: string | null
          radius?: number | null
          results_count?: number | null
          session_id?: string | null
          user_id?: string | null
          user_lat?: number | null
          user_lng?: number | null
        }
        Update: {
          canton?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          query_text?: string | null
          radius?: number | null
          results_count?: number | null
          session_id?: string | null
          user_id?: string | null
          user_lat?: number | null
          user_lng?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          label: string
          type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          label: string
          type: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          label?: string
          type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          user_id?: string
        }
        Relationships: []
      }
      verification_submissions: {
        Row: {
          admin_note: string | null
          created_at: string | null
          id: string
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          storage_path: string
          submitted_at: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string | null
          id?: string
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          storage_path: string
          submitted_at?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          storage_path?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_submissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_submissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profile_view_counts: {
        Row: {
          profile_id: string | null
          total_views: number | null
          unique_views: number | null
          views_24h: number | null
          views_30d: number | null
          views_7d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          about_me: string | null
          age: number | null
          canton: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          gender: string | null
          id: string | null
          is_adult: boolean | null
          languages: string[] | null
          lat: number | null
          listing_type: string | null
          lng: number | null
          postal_code: string | null
          premium_until: string | null
          slug: string | null
          status: string | null
          top_ad_until: string | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          about_me?: string | null
          age?: number | null
          canton?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string | null
          is_adult?: boolean | null
          languages?: string[] | null
          lat?: number | null
          listing_type?: string | null
          lng?: number | null
          postal_code?: string | null
          premium_until?: string | null
          slug?: string | null
          status?: string | null
          top_ad_until?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          about_me?: string | null
          age?: number | null
          canton?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string | null
          is_adult?: boolean | null
          languages?: string[] | null
          lat?: number | null
          listing_type?: string | null
          lng?: number | null
          postal_code?: string | null
          premium_until?: string | null
          slug?: string | null
          status?: string | null
          top_ad_until?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_unlock_rate_limit: {
        Args: { _email: string; _type: string }
        Returns: boolean
      }
      check_auth_rate_limit: {
        Args: { _email: string; _type: string }
        Returns: Json
      }
      check_auth_rate_limit_with_ip: {
        Args: { _email: string; _ip_address: string; _type: string }
        Returns: Json
      }
      check_contact_rate_limit: { Args: { _email: string }; Returns: boolean }
      check_error_rate_limit: { Args: { _url: string }; Returns: boolean }
      cleanup_old_analytics: { Args: never; Returns: undefined }
      cleanup_old_auth_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_error_logs: { Args: never; Returns: undefined }
      cleanup_orphaned_photos: {
        Args: never
        Returns: {
          deleted_count: number
          error_message: string
        }[]
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          profile_count: number
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
        }[]
      }
      get_paginated_profiles: {
        Args: {
          p_canton?: string
          p_category_id?: string
          p_city?: string
          p_keyword?: string
          p_page?: number
          p_page_size?: number
          p_rotation_seed?: number
        }
        Returns: {
          profiles: Json
          total_count: number
        }[]
      }
      get_rate_limits_for_admin: {
        Args: never
        Returns: {
          attempt_type: string
          created_at: string
          email: string
          failed_attempts: number
          id: string
          is_locked: boolean
          last_attempt_at: string
          locked_until: string
          minutes_remaining: number
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_counter: {
        Args: { p_ad_id: string; p_column: string }
        Returns: undefined
      }
      increment_ad_counter_v2: {
        Args: { p_ad_id: string; p_column: string; p_delta?: number }
        Returns: undefined
      }
      record_auth_attempt: {
        Args: { _email: string; _success: boolean; _type: string }
        Returns: undefined
      }
      record_auth_attempt_with_ip: {
        Args: {
          _attempt_type: string
          _email: string
          _ip_address: string
          _success: boolean
        }
        Returns: undefined
      }
      search_profiles_by_radius:
        | {
            Args: {
              filter_category_id?: string
              filter_keyword?: string
              radius_km: number
              user_lat: number
              user_lng: number
            }
            Returns: {
              about_me: string
              age: number
              availability_status: string
              canton: string
              city: string
              created_at: string
              display_name: string
              distance_km: number
              gender: string
              id: string
              is_adult: boolean
              languages: string[]
              lat: number
              listing_type: string
              lng: number
              postal_code: string
              premium_until: string
              show_street: boolean
              slug: string
              status: string
              street_address: string
              top_ad_until: string
              updated_at: string
              verified_at: string
            }[]
          }
        | {
            Args: {
              filter_category_id?: string
              filter_keyword?: string
              p_page?: number
              p_page_size?: number
              p_rotation_seed?: number
              radius_km: number
              user_lat: number
              user_lng: number
            }
            Returns: {
              about_me: string
              age: number
              availability_status: string
              canton: string
              city: string
              created_at: string
              display_name: string
              distance_km: number
              gender: string
              id: string
              is_adult: boolean
              languages: string[]
              lat: number
              listing_type: string
              lng: number
              postal_code: string
              premium_until: string
              show_street: boolean
              slug: string
              status: string
              street_address: string
              top_ad_until: string
              total_count: number
              updated_at: string
              verified_at: string
            }[]
          }
      search_profiles_by_radius_v2: {
        Args: {
          filter_category_id?: string
          filter_keyword?: string
          p_page?: number
          p_page_size?: number
          p_rotation_seed?: number
          radius_km: number
          user_lat: number
          user_lng: number
        }
        Returns: {
          about_me: string
          age: number
          availability_status: string
          canton: string
          city: string
          created_at: string
          display_name: string
          distance_km: number
          gender: string
          id: string
          is_adult: boolean
          languages: string[]
          lat: number
          listing_type: string
          lng: number
          photos: Json
          postal_code: string
          premium_until: string
          profile_categories: Json
          show_street: boolean
          slug: string
          status: string
          street_address: string
          top_ad_until: string
          total_count: number
          updated_at: string
          verified_at: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      user_status: "active" | "suspended"
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
      app_role: ["admin", "user"],
      user_status: ["active", "suspended"],
    },
  },
} as const
