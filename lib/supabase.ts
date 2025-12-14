import { createClient } from '@supabase/supabase-js'

// These are the default local development URLs for Supabase
const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      messages: {
        Row: {
          id: number
          content: string
          created_at: string
        }
        Insert: {
          id?: number
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          content?: string
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          creator_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          creator_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          creator_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          room_id: string
          user_name: string
          peer_id: string
          is_connected: boolean
          joined_at: string
          last_seen: string
        }
        Insert: {
          id?: string
          room_id: string
          user_name: string
          peer_id: string
          is_connected?: boolean
          joined_at?: string
          last_seen?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_name?: string
          peer_id?: string
          is_connected?: boolean
          joined_at?: string
          last_seen?: string
        }
      }
      signaling: {
        Row: {
          id: string
          room_id: string
          from_peer_id: string
          to_peer_id: string | null
          type: 'offer' | 'answer' | 'ice-candidate'
          payload: any
          is_consumed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          from_peer_id: string
          to_peer_id?: string | null
          type: 'offer' | 'answer' | 'ice-candidate'
          payload: any
          is_consumed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          from_peer_id?: string
          to_peer_id?: string | null
          type?: 'offer' | 'answer' | 'ice-candidate'
          payload?: any
          is_consumed?: boolean
          created_at?: string
        }
      }
    }
  }
}