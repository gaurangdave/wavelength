export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      dial_updates: {
        Row: {
          created_at: string
          dial_position: number
          id: string
          is_locked: boolean | null
          player_id: string | null
          room_id: string | null
          round_number: number
        }
        Insert: {
          created_at?: string
          dial_position: number
          id?: string
          is_locked?: boolean | null
          player_id?: string | null
          room_id?: string | null
          round_number: number
        }
        Update: {
          created_at?: string
          dial_position?: number
          id?: string
          is_locked?: boolean | null
          player_id?: string | null
          room_id?: string | null
          round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "dial_updates_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dial_updates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          created_at: string
          host_player_id: string | null
          id: string
          room_code: string
          room_name: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          host_player_id?: string | null
          id?: string
          room_code: string
          room_name: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          host_player_id?: string | null
          id?: string
          room_code?: string
          room_name?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_state: {
        Row: {
          current_psychic_id: string | null
          current_round: number | null
          id: string
          lives_remaining: number | null
          room_id: string | null
          team_score: number | null
          updated_at: string
        }
        Insert: {
          current_psychic_id?: string | null
          current_round?: number | null
          id?: string
          lives_remaining?: number | null
          room_id?: string | null
          team_score?: number | null
          updated_at?: string
        }
        Update: {
          current_psychic_id?: string | null
          current_round?: number | null
          id?: string
          lives_remaining?: number | null
          room_id?: string | null
          team_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_state_current_psychic_id_fkey"
            columns: ["current_psychic_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_state_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      participants: {
        Row: {
          id: string
          is_connected: boolean | null
          joined_at: string
          last_seen: string
          peer_id: string
          room_id: string | null
          user_name: string
        }
        Insert: {
          id?: string
          is_connected?: boolean | null
          joined_at?: string
          last_seen?: string
          peer_id: string
          room_id?: string | null
          user_name: string
        }
        Update: {
          id?: string
          is_connected?: boolean | null
          joined_at?: string
          last_seen?: string
          peer_id?: string
          room_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: string
          is_connected: boolean | null
          is_host: boolean | null
          is_psychic: boolean | null
          joined_at: string
          last_seen: string
          peer_id: string
          player_name: string
          room_id: string | null
        }
        Insert: {
          id?: string
          is_connected?: boolean | null
          is_host?: boolean | null
          is_psychic?: boolean | null
          joined_at?: string
          last_seen?: string
          peer_id: string
          player_name: string
          room_id?: string | null
        }
        Update: {
          id?: string
          is_connected?: boolean | null
          is_host?: boolean | null
          is_psychic?: boolean | null
          joined_at?: string
          last_seen?: string
          peer_id?: string
          player_name?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          creator_name: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_name: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          created_at: string
          id: string
          left_concept: string
          locked_positions: Json | null
          points_earned: number | null
          psychic_hint: string | null
          revealed: boolean | null
          right_concept: string
          room_id: string | null
          round_number: number
          target_position: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          left_concept: string
          locked_positions?: Json | null
          points_earned?: number | null
          psychic_hint?: string | null
          revealed?: boolean | null
          right_concept: string
          room_id?: string | null
          round_number: number
          target_position?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          left_concept?: string
          locked_positions?: Json | null
          points_earned?: number | null
          psychic_hint?: string | null
          revealed?: boolean | null
          right_concept?: string
          room_id?: string | null
          round_number?: number
          target_position?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      signaling: {
        Row: {
          created_at: string
          from_peer_id: string
          id: string
          is_consumed: boolean | null
          payload: Json
          room_id: string | null
          to_peer_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          from_peer_id: string
          id?: string
          is_consumed?: boolean | null
          payload: Json
          room_id?: string | null
          to_peer_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          from_peer_id?: string
          id?: string
          is_consumed?: boolean | null
          payload?: Json
          room_id?: string | null
          to_peer_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "signaling_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_dial_updates: { Args: never; Returns: undefined }
      cleanup_old_signaling: { Args: never; Returns: undefined }
      user_is_in_room: {
        Args: { check_player_id: string; check_room_id: string }
        Returns: boolean
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

