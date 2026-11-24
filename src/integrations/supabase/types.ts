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
      active_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          idle_timeout_minutes: number
          ip_address: string | null
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          idle_timeout_minutes?: number
          ip_address?: string | null
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          idle_timeout_minutes?: number
          ip_address?: string | null
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_output_log: {
        Row: {
          actor_id: string | null
          created_at: string
          function_name: string
          id: string
          input_hash: string | null
          output_sanitized: boolean
          phi_detected: boolean
          phi_removed_fields: string[] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          function_name: string
          id?: string
          input_hash?: string | null
          output_sanitized?: boolean
          phi_detected?: boolean
          phi_removed_fields?: string[] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          function_name?: string
          id?: string
          input_hash?: string | null
          output_sanitized?: boolean
          phi_detected?: boolean
          phi_removed_fields?: string[] | null
        }
        Relationships: []
      }
      analytics_daily: {
        Row: {
          date: string
          engaged_sessions: number
          engagement_rate: number
          fetched_at: string
          key_events: number
          organic_sessions: number
          pageviews: number
          sessions: number
          users: number
        }
        Insert: {
          date: string
          engaged_sessions?: number
          engagement_rate?: number
          fetched_at?: string
          key_events?: number
          organic_sessions?: number
          pageviews?: number
          sessions?: number
          users?: number
        }
        Update: {
          date?: string
          engaged_sessions?: number
          engagement_rate?: number
          fetched_at?: string
          key_events?: number
          organic_sessions?: number
          pageviews?: number
          sessions?: number
          users?: number
        }
        Relationships: []
      }
      analytics_landing_daily: {
        Row: {
          channel_group: string
          date: string
          engaged_sessions: number
          engagement_rate: number
          fetched_at: string
          key_events: number
          landing_page_path: string
          landing_page_url: string
          sessions: number
          users: number
        }
        Insert: {
          channel_group: string
          date: string
          engaged_sessions?: number
          engagement_rate?: number
          fetched_at?: string
          key_events?: number
          landing_page_path: string
          landing_page_url?: string
          sessions?: number
          users?: number
        }
        Update: {
          channel_group?: string
          date?: string
          engaged_sessions?: number
          engagement_rate?: number
          fetched_at?: string
          key_events?: number
          landing_page_path?: string
          landing_page_url?: string
          sessions?: number
          users?: number
        }
        Relationships: []
      }
      appointment_internal_notes: {
        Row: {
          appointment_id: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_internal_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_types: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          name_he: string
          price: number | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          name_he: string
          price?: number | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          name_he?: string
          price?: number | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          clinic_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          duration_minutes: number
          id: string
          internal_notes: string | null
          invitation_token: string | null
          is_deleted: boolean | null
          medications: string | null
          meeting_url: string | null
          modality: string
          notes: string | null
          patient_id: string
          reminder_24h_sent_at: string | null
          reminder_2h_sent_at: string | null
          reminder_email_sent_at: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          reminder_whatsapp_sent_at: string | null
          scheduled_at: string
          signature_data: string | null
          signature_name: string | null
          signature_role: string | null
          signed_at: string | null
          signed_by: string | null
          status: string | null
          treatment_plan: string | null
          updated_at: string
          visit_completed_at: string | null
          visit_shared_email_at: string | null
          visit_shared_whatsapp_at: string | null
          visit_summary: string | null
        }
        Insert: {
          appointment_type_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duration_minutes?: number
          id?: string
          internal_notes?: string | null
          invitation_token?: string | null
          is_deleted?: boolean | null
          medications?: string | null
          meeting_url?: string | null
          modality?: string
          notes?: string | null
          patient_id: string
          reminder_24h_sent_at?: string | null
          reminder_2h_sent_at?: string | null
          reminder_email_sent_at?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          reminder_whatsapp_sent_at?: string | null
          scheduled_at: string
          signature_data?: string | null
          signature_name?: string | null
          signature_role?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_completed_at?: string | null
          visit_shared_email_at?: string | null
          visit_shared_whatsapp_at?: string | null
          visit_summary?: string | null
        }
        Update: {
          appointment_type_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duration_minutes?: number
          id?: string
          internal_notes?: string | null
          invitation_token?: string | null
          is_deleted?: boolean | null
          medications?: string | null
          meeting_url?: string | null
          modality?: string
          notes?: string | null
          patient_id?: string
          reminder_24h_sent_at?: string | null
          reminder_2h_sent_at?: string | null
          reminder_email_sent_at?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          reminder_whatsapp_sent_at?: string | null
          scheduled_at?: string
          signature_data?: string | null
          signature_name?: string | null
          signature_role?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string
          visit_completed_at?: string | null
          visit_shared_email_at?: string | null
          visit_shared_whatsapp_at?: string | null
          visit_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      booking_otp: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          otp_hash: string
          phone: string
          token_expires_at: string | null
          verification_token: string | null
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          otp_hash: string
          phone: string
          token_expires_at?: string | null
          verification_token?: string | null
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          otp_hash?: string
          phone?: string
          token_expires_at?: string | null
          verification_token?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      booking_verifications: {
        Row: {
          appointment_id: string
          clinic_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          last_resend_at: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          appointment_id: string
          clinic_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          last_resend_at?: string | null
          token?: string
          used_at?: string | null
        }
        Update: {
          appointment_id?: string
          clinic_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          last_resend_at?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_verifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_verifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_call_messages: {
        Row: {
          call_hash: string
          created_at: string
          status: string
        }
        Insert: {
          call_hash: string
          created_at?: string
          status?: string
        }
        Update: {
          call_hash?: string
          created_at?: string
          status?: string
        }
        Relationships: []
      }
      clinic_meet_connections: {
        Row: {
          clinic_id: string
          key_hash: string
        }
        Insert: {
          clinic_id: string
          key_hash: string
        }
        Update: {
          clinic_id?: string
          key_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_meet_connections_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      clinical_document_deliveries: {
        Row: {
          created_at: string
          document_id: string
          kind: string
          provider_message_id: string | null
          requested_by: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          kind: string
          provider_message_id?: string | null
          requested_by: string
          state?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          kind?: string
          provider_message_id?: string | null
          requested_by?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_document_deliveries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_documents: {
        Row: {
          appointment_id: string
          id: string
          patient_id: string
          revision: number
          signed_at: string
          signed_by: string
          snapshot: Json
        }
        Insert: {
          appointment_id: string
          id?: string
          patient_id: string
          revision: number
          signed_at?: string
          signed_by: string
          snapshot: Json
        }
        Update: {
          appointment_id?: string
          id?: string
          patient_id?: string
          revision?: number
          signed_at?: string
          signed_by?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "clinical_documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_issuer: {
        Row: {
          id: boolean
          license: string
          name: string
          specialty: string
          stamp_data: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: boolean
          license?: string
          name: string
          specialty: string
          stamp_data: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: boolean
          license?: string
          name?: string
          specialty?: string
          stamp_data?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clinical_stamp_renderings: {
        Row: {
          original_hash: string
          stamp_data: string
        }
        Insert: {
          original_hash: string
          stamp_data: string
        }
        Update: {
          original_hash?: string
          stamp_data?: string
        }
        Relationships: []
      }
      clinical_templates: {
        Row: {
          body: string
          created_by: string
          field: string
          id: string
          name: string
        }
        Insert: {
          body: string
          created_by?: string
          field: string
          id?: string
          name: string
        }
        Update: {
          body?: string
          created_by?: string
          field?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      clinical_visit_versions: {
        Row: {
          appointment_id: string
          content: Json
          revision: number
          saved_at: string
          saved_by: string
        }
        Insert: {
          appointment_id: string
          content: Json
          revision: number
          saved_at?: string
          saved_by: string
        }
        Update: {
          appointment_id?: string
          content?: Json
          revision?: number
          saved_at?: string
          saved_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_visit_versions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "clinical_visits"
            referencedColumns: ["appointment_id"]
          },
        ]
      }
      clinical_visits: {
        Row: {
          appointment_id: string
          content: Json
          revision: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          appointment_id: string
          content: Json
          revision?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          appointment_id?: string
          content?: Json
          revision?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_visits_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          doctor_license: string | null
          doctor_name: string | null
          doctor_specialty: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          doctor_license?: string | null
          doctor_name?: string | null
          doctor_specialty?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          doctor_license?: string | null
          doctor_name?: string | null
          doctor_specialty?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: []
      }
      custom_scoring_tools: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_global: boolean | null
          name: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_global?: boolean | null
          name: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_global?: boolean | null
          name?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      electronic_signatures: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          record_id: string
          record_type: string
          signature_data: string
          signature_meaning: string
          signed_at: string
          signer_id: string
          signer_name: string
          signer_role: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          record_id: string
          record_type: string
          signature_data: string
          signature_meaning: string
          signed_at?: string
          signer_id: string
          signer_name: string
          signer_role: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          record_id?: string
          record_type?: string
          signature_data?: string
          signature_meaning?: string
          signed_at?: string
          signer_id?: string
          signer_name?: string
          signer_role?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          clinic_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          patient_id: string
          token: string
          verified_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          patient_id: string
          token: string
          verified_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          patient_id?: string
          token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_verifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_verifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          clinic_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          recurring: boolean | null
          recurring_interval: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          recurring?: boolean | null
          recurring_interval?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          recurring?: boolean | null
          recurring_interval?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      file_scan_queue: {
        Row: {
          created_at: string
          document_id: string
          file_path: string
          id: string
          scan_result: Json | null
          scan_status: string
          scanned_at: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          file_path: string
          id?: string
          scan_result?: Json | null
          scan_status?: string
          scanned_at?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          file_path?: string
          id?: string
          scan_result?: Json | null
          scan_status?: string
          scanned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_scan_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "patient_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_cluster_actions: {
        Row: {
          action_type: string
          cluster_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          page_path: string
          page_title: string
          status: string
        }
        Insert: {
          action_type: string
          cluster_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          page_path?: string
          page_title: string
          status?: string
        }
        Update: {
          action_type?: string
          cluster_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          page_path?: string
          page_title?: string
          status?: string
        }
        Relationships: []
      }
      geo_content_briefs: {
        Row: {
          brief_type: string
          cluster_id: string
          content: Json
          created_at: string
          created_by: string | null
          id: string
          page_path: string
          page_title: string
          updated_at: string
        }
        Insert: {
          brief_type?: string
          cluster_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          page_path?: string
          page_title: string
          updated_at?: string
        }
        Update: {
          brief_type?: string
          cluster_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          page_path?: string
          page_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      geo_page_workflows: {
        Row: {
          checklist: Json
          created_at: string
          id: string
          last_reviewed: string
          notes: string
          owner: string
          page_id: string
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          id?: string
          last_reviewed?: string
          notes?: string
          owner?: string
          page_id: string
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          id?: string
          last_reviewed?: string
          notes?: string
          owner?: string
          page_id?: string
          priority?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      geo_scan_results: {
        Row: {
          blockers: Json
          content_hash: string | null
          created_at: string
          dimensions: Json
          id: string
          overall_score: number
          page_id: string
          recommendations: Json
          scanned_at: string
          strengths: Json
          weaknesses: Json
        }
        Insert: {
          blockers?: Json
          content_hash?: string | null
          created_at?: string
          dimensions?: Json
          id?: string
          overall_score?: number
          page_id: string
          recommendations?: Json
          scanned_at?: string
          strengths?: Json
          weaknesses?: Json
        }
        Update: {
          blockers?: Json
          content_hash?: string | null
          created_at?: string
          dimensions?: Json
          id?: string
          overall_score?: number
          page_id?: string
          recommendations?: Json
          scanned_at?: string
          strengths?: Json
          weaknesses?: Json
        }
        Relationships: []
      }
      gsc_dataset_sync_cursor: {
        Row: {
          attempts: number
          dataset: string
          date: string
          last_error: string | null
          property: string
          rows_written: number
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          dataset: string
          date: string
          last_error?: string | null
          property: string
          rows_written?: number
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          dataset?: string
          date?: string
          last_error?: string | null
          property?: string
          rows_written?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      gsc_sync_cursor: {
        Row: {
          attempts: number
          date: string
          last_error: string | null
          property: string
          rows_written: number
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          date: string
          last_error?: string | null
          property: string
          rows_written?: number
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          date?: string
          last_error?: string | null
          property?: string
          rows_written?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      guest_booking_requests: {
        Row: {
          appointment_type_id: string | null
          approved_at: string | null
          approved_by: string | null
          captcha_token: string | null
          clinic_id: string | null
          created_at: string
          email: string | null
          expires_at: string
          fingerprint_hash: string | null
          first_name: string
          id: string
          ip_address: string | null
          last_name: string
          notes: string | null
          patient_id: string | null
          phone: string
          requested_date: string
          requested_time: string
          status: string
        }
        Insert: {
          appointment_type_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          captcha_token?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          fingerprint_hash?: string | null
          first_name: string
          id?: string
          ip_address?: string | null
          last_name: string
          notes?: string | null
          patient_id?: string | null
          phone: string
          requested_date: string
          requested_time: string
          status?: string
        }
        Update: {
          appointment_type_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          captcha_token?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          fingerprint_hash?: string | null
          first_name?: string
          id?: string
          ip_address?: string | null
          last_name?: string
          notes?: string | null
          patient_id?: string | null
          phone?: string
          requested_date?: string
          requested_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_booking_requests_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_booking_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_booking_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_tokens: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          patient_id: string | null
          sent_at: string | null
          sent_via: string | null
          token: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          patient_id?: string | null
          sent_at?: string | null
          sent_via?: string | null
          token?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          patient_id?: string | null
          sent_at?: string | null
          sent_via?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          appointment_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          insurance_claim_amount: number | null
          insurance_claim_status: string | null
          invoice_number: string
          notes: string | null
          paid_at: string | null
          patient_id: string | null
          payment_link: string | null
          status: string | null
          subtotal: number
          sumit_eligible: boolean
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          insurance_claim_amount?: number | null
          insurance_claim_status?: string | null
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_link?: string | null
          status?: string | null
          subtotal?: number
          sumit_eligible?: boolean
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          insurance_claim_amount?: number | null
          insurance_claim_status?: string | null
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_link?: string | null
          status?: string | null
          subtotal?: number
          sumit_eligible?: boolean
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_updates: {
        Row: {
          created_at: string
          fetched_at: string
          id: string
          is_published: boolean
          published_date: string
          pubmed_id: string | null
          source: string
          source_url: string | null
          summary_he: string
          title: string
          title_he: string
        }
        Insert: {
          created_at?: string
          fetched_at?: string
          id?: string
          is_published?: boolean
          published_date: string
          pubmed_id?: string | null
          source: string
          source_url?: string | null
          summary_he: string
          title: string
          title_he: string
        }
        Update: {
          created_at?: string
          fetched_at?: string
          id?: string
          is_published?: boolean
          published_date?: string
          pubmed_id?: string | null
          source?: string
          source_url?: string | null
          summary_he?: string
          title?: string
          title_he?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          parent_id: string | null
          patient_id: string
          read_at: string | null
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          parent_id?: string | null
          patient_id: string
          read_at?: string | null
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          parent_id?: string | null
          patient_id?: string
          read_at?: string | null
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content_overrides: {
        Row: {
          applied_by: string | null
          created_at: string
          id: string
          page_id: string
          sections: Json
          updated_at: string
          version_label: string | null
        }
        Insert: {
          applied_by?: string | null
          created_at?: string
          id?: string
          page_id: string
          sections?: Json
          updated_at?: string
          version_label?: string | null
        }
        Update: {
          applied_by?: string | null
          created_at?: string
          id?: string
          page_id?: string
          sections?: Json
          updated_at?: string
          version_label?: string | null
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          ai_summary: string | null
          ai_tags: string[] | null
          created_at: string
          description: string | null
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          patient_id: string
          title: string
          upload_key: string | null
          uploaded_by: string | null
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string
          description?: string | null
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          patient_id: string
          title: string
          upload_key?: string | null
          uploaded_by?: string | null
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string
          description?: string | null
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          patient_id?: string
          title?: string
          upload_key?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          first_name: string
          id: string
          invite_code: string
          invited_by: string | null
          last_name: string
          patient_id: string | null
          phone: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          first_name: string
          id?: string
          invite_code?: string
          invited_by?: string | null
          last_name: string
          patient_id?: string | null
          phone?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          invite_code?: string
          invited_by?: string | null
          last_name?: string
          patient_id?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_invitations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          alcohol_consumption: string | null
          allergies: string[] | null
          allergy_reaction_type: string | null
          allergy_severity: string | null
          chronic_conditions: string[] | null
          city: string | null
          clinic_id: string | null
          consent_signed: boolean | null
          consent_signed_at: string | null
          created_at: string
          current_medications: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          exercise_frequency: string | null
          family_history_father: string | null
          family_history_mother: string | null
          family_history_other: string | null
          family_medical_history: string | null
          first_name: string
          gdpr_consent: boolean | null
          gdpr_consent_at: string | null
          gender: string | null
          id: string
          id_number: string | null
          insurance_number: string | null
          insurance_provider: string | null
          intake_completed_at: string | null
          intake_token_id: string | null
          last_name: string
          main_complaint: string | null
          marital_status: string | null
          medical_notes: string | null
          num_children: number | null
          occupation: string | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_contact_time: string | null
          previous_surgeries: string | null
          previous_treatments: string | null
          referral_source: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sleep_hours: number | null
          smoking_status: string | null
          status: string | null
          stress_level: string | null
          symptoms_duration: string | null
          treatment_goals: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          alcohol_consumption?: string | null
          allergies?: string[] | null
          allergy_reaction_type?: string | null
          allergy_severity?: string | null
          chronic_conditions?: string[] | null
          city?: string | null
          clinic_id?: string | null
          consent_signed?: boolean | null
          consent_signed_at?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          exercise_frequency?: string | null
          family_history_father?: string | null
          family_history_mother?: string | null
          family_history_other?: string | null
          family_medical_history?: string | null
          first_name: string
          gdpr_consent?: boolean | null
          gdpr_consent_at?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          insurance_number?: string | null
          insurance_provider?: string | null
          intake_completed_at?: string | null
          intake_token_id?: string | null
          last_name: string
          main_complaint?: string | null
          marital_status?: string | null
          medical_notes?: string | null
          num_children?: number | null
          occupation?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          previous_surgeries?: string | null
          previous_treatments?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sleep_hours?: number | null
          smoking_status?: string | null
          status?: string | null
          stress_level?: string | null
          symptoms_duration?: string | null
          treatment_goals?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          alcohol_consumption?: string | null
          allergies?: string[] | null
          allergy_reaction_type?: string | null
          allergy_severity?: string | null
          chronic_conditions?: string[] | null
          city?: string | null
          clinic_id?: string | null
          consent_signed?: boolean | null
          consent_signed_at?: string | null
          created_at?: string
          current_medications?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          exercise_frequency?: string | null
          family_history_father?: string | null
          family_history_mother?: string | null
          family_history_other?: string | null
          family_medical_history?: string | null
          first_name?: string
          gdpr_consent?: boolean | null
          gdpr_consent_at?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          insurance_number?: string | null
          insurance_provider?: string | null
          intake_completed_at?: string | null
          intake_token_id?: string | null
          last_name?: string
          main_complaint?: string | null
          marital_status?: string | null
          medical_notes?: string | null
          num_children?: number | null
          occupation?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_contact_time?: string | null
          previous_surgeries?: string | null
          previous_treatments?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sleep_hours?: number | null
          smoking_status?: string | null
          status?: string | null
          stress_level?: string | null
          symptoms_duration?: string | null
          treatment_goals?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_intake_token_id_fkey"
            columns: ["intake_token_id"]
            isOneToOne: false
            referencedRelation: "intake_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          patient_id: string | null
          payment_method: string | null
          payment_reference: string | null
          processed_by: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          processed_by?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          patient_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          processed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      phi_access_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          phi_fields_accessed: string[] | null
          record_id: string | null
          session_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          phi_fields_accessed?: string[] | null
          record_id?: string | null
          session_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          phi_fields_accessed?: string[] | null
          record_id?: string | null
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          mobile: string | null
          phone: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      referral_sources: {
        Row: {
          count: number | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          count?: number | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          count?: number | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      reminder_delivery_log: {
        Row: {
          appointment_id: string
          channel: string
          created_at: string
          error: string | null
          id: string
          provider_message_id: string | null
          status: string
        }
        Insert: {
          appointment_id: string
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          status: string
        }
        Update: {
          appointment_id?: string
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_delivery_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_runs: {
        Row: {
          email_sent_count: number | null
          error_count: number | null
          errors: Json | null
          finished_at: string | null
          id: string
          processed_count: number | null
          started_at: string
          trigger_type: string | null
          whatsapp_sent_count: number | null
        }
        Insert: {
          email_sent_count?: number | null
          error_count?: number | null
          errors?: Json | null
          finished_at?: string | null
          id?: string
          processed_count?: number | null
          started_at?: string
          trigger_type?: string | null
          whatsapp_sent_count?: number | null
        }
        Update: {
          email_sent_count?: number | null
          error_count?: number | null
          errors?: Json | null
          finished_at?: string | null
          id?: string
          processed_count?: number | null
          started_at?: string
          trigger_type?: string | null
          whatsapp_sent_count?: number | null
        }
        Relationships: []
      }
      reminder_schedules: {
        Row: {
          created_at: string
          hours_before: number
          id: string
          is_active: boolean | null
          send_email: boolean | null
          send_whatsapp: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours_before: number
          id?: string
          is_active?: boolean | null
          send_email?: boolean | null
          send_whatsapp?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours_before?: number
          id?: string
          is_active?: boolean | null
          send_email?: boolean | null
          send_whatsapp?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      search_console_daily: {
        Row: {
          clicks: number
          ctr: number
          date: string
          fetched_at: string
          impressions: number
          page_host: string
          page_path: string
          page_url: string
          page_url_variants: number
          position: number
          property: string
          query: string
        }
        Insert: {
          clicks?: number
          ctr?: number
          date: string
          fetched_at?: string
          impressions?: number
          page_host: string
          page_path: string
          page_url: string
          page_url_variants?: number
          position?: number
          property: string
          query: string
        }
        Update: {
          clicks?: number
          ctr?: number
          date?: string
          fetched_at?: string
          impressions?: number
          page_host?: string
          page_path?: string
          page_url?: string
          page_url_variants?: number
          position?: number
          property?: string
          query?: string
        }
        Relationships: []
      }
      search_console_page_daily: {
        Row: {
          clicks: number
          ctr: number
          date: string
          fetched_at: string
          impressions: number
          page_host: string
          page_path: string
          page_url: string
          page_url_variants: number
          position: number
          property: string
        }
        Insert: {
          clicks?: number
          ctr?: number
          date: string
          fetched_at?: string
          impressions?: number
          page_host: string
          page_path: string
          page_url: string
          page_url_variants?: number
          position?: number
          property: string
        }
        Update: {
          clicks?: number
          ctr?: number
          date?: string
          fetched_at?: string
          impressions?: number
          page_host?: string
          page_path?: string
          page_url?: string
          page_url_variants?: number
          position?: number
          property?: string
        }
        Relationships: []
      }
      search_console_totals_daily: {
        Row: {
          clicks: number
          ctr: number
          date: string
          fetched_at: string
          impressions: number
          position: number
          property: string
        }
        Insert: {
          clicks?: number
          ctr?: number
          date: string
          fetched_at?: string
          impressions?: number
          position?: number
          property: string
        }
        Update: {
          clicks?: number
          ctr?: number
          date?: string
          fetched_at?: string
          impressions?: number
          position?: number
          property?: string
        }
        Relationships: []
      }
      sumit_documents: {
        Row: {
          created_at: string
          created_by: string
          delivery_channel: string
          delivery_not_before: string | null
          delivery_state: string
          document_id: number | null
          document_number: string | null
          document_type: number
          download_url: string | null
          invoice_id: string
          message: string | null
          recipient_email: string | null
          recipient_phone: string | null
          request_id: number
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          delivery_channel?: string
          delivery_not_before?: string | null
          delivery_state?: string
          document_id?: number | null
          document_number?: string | null
          document_type: number
          download_url?: string | null
          invoice_id: string
          message?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          request_id: number
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          delivery_channel?: string
          delivery_not_before?: string | null
          delivery_state?: string
          document_id?: number | null
          document_number?: string | null
          document_type?: number
          download_url?: string | null
          invoice_id?: string
          message?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          request_id?: number
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sumit_documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          clinic_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_code: string
          invited_by: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          clinic_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invite_code?: string
          invited_by?: string | null
          permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          clinic_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_code?: string
          invited_by?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      telephone_whatsapp_deliveries: {
        Row: {
          accepted_at: string | null
          appointment_id: string
          auto_enabled: boolean
          created_at: string
          dispatch_token: string
          error_code: string | null
          intake_token_id: string | null
          provider_message_id: string | null
          state: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          appointment_id: string
          auto_enabled?: boolean
          created_at?: string
          dispatch_token?: string
          error_code?: string | null
          intake_token_id?: string | null
          provider_message_id?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          appointment_id?: string
          auto_enabled?: boolean
          created_at?: string
          dispatch_token?: string
          error_code?: string | null
          intake_token_id?: string | null
          provider_message_id?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telephone_whatsapp_deliveries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telephone_whatsapp_deliveries_intake_token_id_fkey"
            columns: ["intake_token_id"]
            isOneToOne: false
            referencedRelation: "intake_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          patient_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          patient_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          patient_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          appointment_type_id: string | null
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          preferred_dates: string[] | null
          preferred_times: string[] | null
          priority: number | null
          status: string | null
        }
        Insert: {
          appointment_type_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          preferred_dates?: string[] | null
          preferred_times?: string[] | null
          priority?: number | null
          status?: string | null
        }
        Update: {
          appointment_type_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          preferred_dates?: string[] | null
          preferred_times?: string[] | null
          priority?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_bot_settings: {
        Row: {
          dispatch_token: string
          last_incoming_at: string | null
          quota_exceeded_at: string | null
          setup_state: string
          singleton: boolean
          updated_at: string
          vault_id: string
        }
        Insert: {
          dispatch_token?: string
          last_incoming_at?: string | null
          quota_exceeded_at?: string | null
          setup_state?: string
          singleton?: boolean
          updated_at?: string
          vault_id: string
        }
        Update: {
          dispatch_token?: string
          last_incoming_at?: string | null
          quota_exceeded_at?: string | null
          setup_state?: string
          singleton?: boolean
          updated_at?: string
          vault_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          answers: Json
          bot_stage: string
          bot_started_at: string | null
          clinic_id: string | null
          created_at: string
          id: string
          name: string
          opted_out: boolean
          phone: string
          source: string
          unread: boolean
          updated_at: string
          whatsapp_consent_at: string | null
          whatsapp_consent_scope: string | null
          whatsapp_consent_withdrawn_at: string | null
        }
        Insert: {
          answers?: Json
          bot_stage?: string
          bot_started_at?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          name?: string
          opted_out?: boolean
          phone: string
          source?: string
          unread?: boolean
          updated_at?: string
          whatsapp_consent_at?: string | null
          whatsapp_consent_scope?: string | null
          whatsapp_consent_withdrawn_at?: string | null
        }
        Update: {
          answers?: Json
          bot_stage?: string
          bot_started_at?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          name?: string
          opted_out?: boolean
          phone?: string
          source?: string
          unread?: boolean
          updated_at?: string
          whatsapp_consent_at?: string | null
          whatsapp_consent_scope?: string | null
          whatsapp_consent_withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          message_type: string
          provider_id: string | null
          status: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          message_type?: string
          provider_id?: string | null
          status?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          provider_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_outbox: {
        Row: {
          created_at: string
          error_code: string | null
          id: string
          message_id: string
          ordinal: number
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: string
          message_id: string
          ordinal?: never
          state?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: string
          message_id?: string
          ordinal?: never
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbox_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      work_sessions: {
        Row: {
          clinic_id: string | null
          created_at: string
          date: string
          end_time: string | null
          id: string
          start_time: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_sessions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      search_console_canonical: {
        Row: {
          clicks: number | null
          ctr: number | null
          date: string | null
          fetched_at: string | null
          impressions: number | null
          page_host: string | null
          page_path: string | null
          page_url: string | null
          position: number | null
          query: string | null
          source_property: string | null
          source_property_domain: string | null
        }
        Relationships: []
      }
      search_console_page_canonical: {
        Row: {
          clicks: number | null
          ctr: number | null
          date: string | null
          fetched_at: string | null
          impressions: number | null
          page_host: string | null
          page_path: string | null
          page_url: string | null
          page_url_variants: number | null
          position: number | null
          source_property: string | null
          source_property_domain: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_team_invitation: {
        Args: { _invite_code: string; _user_id: string }
        Returns: boolean
      }
      attach_meet_room: {
        Args: { p_key: string; p_url: string; p_visit: string }
        Returns: undefined
      }
      can_access_clinic: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      can_edit_appointments: { Args: { _user_id: string }; Returns: boolean }
      can_edit_billing: { Args: { _user_id: string }; Returns: boolean }
      can_edit_documents: { Args: { _user_id: string }; Returns: boolean }
      can_edit_patients: { Args: { _user_id: string }; Returns: boolean }
      can_edit_profile: {
        Args: { _target_user_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_appointments: { Args: { _user_id: string }; Returns: boolean }
      can_view_billing: { Args: { _user_id: string }; Returns: boolean }
      can_view_documents: { Args: { _user_id: string }; Returns: boolean }
      can_view_patients: { Args: { _user_id: string }; Returns: boolean }
      check_patient_invite_code: { Args: { _code: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          _endpoint: string
          _identifier: string
          _max_requests?: number
          _window_seconds?: number
        }
        Returns: boolean
      }
      check_team_invite_code: { Args: { _code: string }; Returns: boolean }
      claim_clinic_referral_ai: { Args: never; Returns: Json }
      claim_clinic_whatsapp_outbox: { Args: never; Returns: Json }
      claim_clinic_whatsapp_outbox_before_typing: { Args: never; Returns: Json }
      claim_clinical_delivery: {
        Args: { p_confirmed_phone: string; p_document: string; p_kind: string }
        Returns: Json
      }
      claim_telephone_whatsapp: {
        Args: { p_dispatch_token: string; p_visit: string }
        Returns: Json
      }
      cleanup_expired_data: { Args: never; Returns: undefined }
      clinical_document_stamp: { Args: { p_document: string }; Returns: string }
      clinical_signing_ready: { Args: never; Returns: boolean }
      create_appointment_atomic: {
        Args: {
          p_appointment_type_id: string
          p_clinic_id: string
          p_duration_minutes?: number
          p_notes?: string
          p_patient_id: string
          p_scheduled_at: string
          p_status?: string
        }
        Returns: string
      }
      create_telephone_appointment: {
        Args: {
          p_appointment_type_id: string
          p_clinic_id: string
          p_duration_minutes: number
          p_meeting_url: string
          p_notes: string
          p_patient_id: string
          p_scheduled_at: string
          p_status?: string
        }
        Returns: string
      }
      dispatch_clinic_whatsapp_bot: { Args: never; Returns: undefined }
      dispatch_telephone_whatsapp: { Args: never; Returns: undefined }
      finalize_clinical_visit: {
        Args: {
          p_appointment_id: string
          p_content: Json
          p_expected_revision: number
        }
        Returns: {
          appointment_id: string
          id: string
          patient_id: string
          revision: number
          signed_at: string
          signed_by: string
          snapshot: Json
        }
        SetofOptions: {
          from: "*"
          to: "clinical_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finish_clinic_referral_ai: {
        Args: {
          p_action: string
          p_claim: string
          p_conversation: string
          p_origin?: string
        }
        Returns: undefined
      }
      finish_clinic_whatsapp_outbox: {
        Args: { p_error: string; p_id: string; p_provider_id: string }
        Returns: undefined
      }
      finish_patient_intake: {
        Args: { p_data: Json; p_token: string }
        Returns: string
      }
      finish_telephone_whatsapp: {
        Args: {
          p_dispatch_token: string
          p_error_code: string
          p_message_id: string
          p_state: string
          p_visit: string
        }
        Returns: undefined
      }
      geo_ctr_curve: {
        Args: { p_end_date?: string; p_host?: string; p_window_days?: number }
        Returns: {
          clicks: number
          impressions: number
          observations: number
          position_bucket: number
        }[]
      }
      geo_ga4_page_window: {
        Args: {
          p_channel?: string
          p_end_date?: string
          p_window_days?: number
        }
        Returns: {
          days_with_data: number
          engaged_sessions: number
          engagement_rate: number
          key_events: number
          landing_page_path: string
          sessions: number
          users: number
        }[]
      }
      geo_latest_page_date: { Args: { p_host: string }; Returns: string }
      geo_page_window: {
        Args: { p_end_date?: string; p_host?: string; p_window_days?: number }
        Returns: {
          avg_position: number
          clicks: number
          ctr: number
          days_with_data: number
          first_seen: string
          impressions: number
          last_seen: string
          page_host: string
          page_path: string
          page_url: string
          prev_avg_position: number
          prev_clicks: number
          prev_ctr: number
          prev_days: number
          prev_impressions: number
          source_property: string
        }[]
      }
      geo_query_window: {
        Args: {
          p_end_date?: string
          p_host?: string
          p_min_impressions?: number
          p_window_days?: number
        }
        Returns: {
          avg_position: number
          clicks: number
          impressions: number
          page_path: string
          query: string
        }[]
      }
      geo_totals_window: {
        Args: {
          p_end_date?: string
          p_property?: string
          p_window_days?: number
        }
        Returns: {
          avg_position: number
          clicks: number
          ctr: number
          days_with_data: number
          impressions: number
          prev_clicks: number
          prev_days: number
          prev_impressions: number
          property: string
          window_end: string
          window_start: string
        }[]
      }
      get_available_slots: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_duration_minutes?: number
        }
        Returns: {
          slot_datetime: string
          slot_time: string
        }[]
      }
      get_blocking_statuses: { Args: never; Returns: string[] }
      get_public_clinic: {
        Args: { clinic_id: string }
        Returns: {
          city: string
          id: string
          is_active: boolean
          name: string
          working_hours: Json
        }[]
      }
      get_public_clinics: {
        Args: never
        Returns: {
          city: string
          id: string
          is_active: boolean
          name: string
          working_hours: Json
        }[]
      }
      get_user_clinic_id: { Args: { _user_id: string }; Returns: string }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      issue_sumit_document:
        | {
            Args: { p_document_type: number; p_invoice_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_channel: string
              p_document_type: number
              p_invoice_id: string
            }
            Returns: Json
          }
      pending_meet_rooms: {
        Args: { p_key: string }
        Returns: {
          duration_minutes: number
          id: string
          scheduled_at: string
        }[]
      }
      queue_due_clinic_referrals: { Args: never; Returns: undefined }
      queue_due_clinic_referrals_before_offer: {
        Args: never
        Returns: undefined
      }
      queue_whatsapp_text: {
        Args: { p_body: string; p_conversation: string }
        Returns: string
      }
      receive_clinic_whatsapp: {
        Args: {
          p_body: string
          p_from_staff?: boolean
          p_phone: string
          p_provider_id: string
          p_timestamp: string
          p_type: string
        }
        Returns: undefined
      }
      receive_clinic_whatsapp_before_inbound: {
        Args: {
          p_body: string
          p_from_staff?: boolean
          p_phone: string
          p_provider_id: string
          p_timestamp: string
          p_type: string
        }
        Returns: undefined
      }
      receive_clinic_whatsapp_before_referral: {
        Args: {
          p_body: string
          p_from_staff?: boolean
          p_phone: string
          p_provider_id: string
          p_timestamp: string
          p_type: string
        }
        Returns: undefined
      }
      receive_clinic_whatsapp_before_waitlist: {
        Args: {
          p_body: string
          p_from_staff?: boolean
          p_phone: string
          p_provider_id: string
          p_timestamp: string
          p_type: string
        }
        Returns: undefined
      }
      record_and_issue_sumit_document: {
        Args: {
          p_channel: string
          p_document_type: number
          p_invoice_id: string
          p_method: string
          p_reference: string
        }
        Returns: Json
      }
      record_external_invoice_payment: {
        Args: { p_invoice_id: string; p_method: string; p_reference?: string }
        Returns: undefined
      }
      record_token_document: {
        Args: {
          p_key: string
          p_kind: string
          p_mime: string
          p_path: string
          p_patient_id: string
          p_size: number
          p_title: string
          p_token: string
        }
        Returns: string
      }
      register_whatsapp_waitlist: {
        Args: {
          p_clinic: string
          p_name: string
          p_phone: string
          p_start?: boolean
        }
        Returns: string
      }
      save_clinical_visit: {
        Args: {
          p_appointment_id: string
          p_content: Json
          p_expected_revision: number
        }
        Returns: {
          appointment_id: string
          content: Json
          revision: number
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "clinical_visits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      schedule_clinic_referral: {
        Args: {
          p_name: string
          p_phone: string
          p_request_id?: string
          p_source: string
        }
        Returns: string
      }
      staff_whatsapp_action: {
        Args: { p_action: string; p_conversation: string; p_text?: string }
        Returns: undefined
      }
      staff_whatsapp_action_before_referral: {
        Args: { p_action: string; p_conversation: string; p_text?: string }
        Returns: undefined
      }
      telephone_intake_token: { Args: { p_visit: string }; Returns: string }
      telephone_invitation: {
        Args: { p_token: string }
        Returns: {
          duration_minutes: number
          meeting_url: string
          scheduled_at: string
        }[]
      }
      validate_session: {
        Args: { _session_token: string; _user_id: string }
        Returns: boolean
      }
      whatsapp_bot_config: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "doctor" | "secretary" | "patient"
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
      app_role: ["admin", "doctor", "secretary", "patient"],
    },
  },
} as const
