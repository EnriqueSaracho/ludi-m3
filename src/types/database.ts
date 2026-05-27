export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      game_cache: {
        Row: {
          fetched_at: string;
          igdb_id: number;
          payload: Json;
          steam_appid: number | null;
        };
        Insert: {
          fetched_at?: string;
          igdb_id: number;
          payload: Json;
          steam_appid?: number | null;
        };
        Update: {
          fetched_at?: string;
          igdb_id?: number;
          payload?: Json;
          steam_appid?: number | null;
        };
        Relationships: [];
      };
      game_comments: {
        Row: {
          body: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          igdb_id: number;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          igdb_id: number;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          igdb_id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      game_ratings: {
        Row: {
          created_at: string;
          id: string;
          igdb_id: number;
          score: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          igdb_id: number;
          score: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          igdb_id?: number;
          score?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      list_items: {
        Row: {
          added_at: string;
          id: string;
          igdb_id: number;
          list_id: string;
          platform_id: number | null;
          platform_name: string | null;
          sort_order: number;
        };
        Insert: {
          added_at?: string;
          id?: string;
          igdb_id: number;
          list_id: string;
          platform_id?: number | null;
          platform_name?: string | null;
          sort_order?: number;
        };
        Update: {
          added_at?: string;
          id?: string;
          igdb_id?: number;
          list_id?: string;
          platform_id?: number | null;
          platform_name?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "user_lists";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          id: string;
          preferred_country: string | null;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          id: string;
          preferred_country?: string | null;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          preferred_country?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      user_game_status: {
        Row: {
          igdb_id: number;
          platform_id: number | null;
          platform_name: string | null;
          play_status: Database["public"]["Enums"]["play_status"] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          igdb_id: number;
          platform_id?: number | null;
          platform_name?: string | null;
          play_status?: Database["public"]["Enums"]["play_status"] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          igdb_id?: number;
          platform_id?: number | null;
          platform_name?: string | null;
          play_status?: Database["public"]["Enums"]["play_status"] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_lists: {
        Row: {
          created_at: string;
          id: string;
          is_system: boolean;
          name: string;
          system_key: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_system?: boolean;
          name: string;
          system_key?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_system?: boolean;
          name?: string;
          system_key?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      play_status: "want" | "playing" | "played";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
