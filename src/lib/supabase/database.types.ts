/* ══════════════════════════════════════════════════════════
   NovelFlow — Supabase Database 型定義
   本来は `supabase gen types typescript` で自動生成するが
   ここでは手書きで定義。実運用では自動生成を推奨。
══════════════════════════════════════════════════════════ */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:               string;
          display_name:     string;
          username:         string;
          avatar_url:       string | null;
          bio:              string | null;
          role:             "reader" | "author" | "admin";
          is_banned:        boolean;
          follower_count:   number;
          following_count:  number;
          work_count:       number;
          total_like_count: number;
          created_at:       string;
          updated_at:       string;
          deleted_at:       string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at" | "follower_count" | "following_count" | "work_count" | "total_like_count">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      novel_works: {
        Row: {
          id:                  string;
          author_id:           string;
          title:               string;
          synopsis:            string | null;
          genre:               string;
          age_rating:          string;
          serial_status:       string;
          reading_mode:        string;
          thumbnail_url:       string | null;
          total_char_count:    number;
          episode_count:       number;
          like_count:          number;
          read_complete_count: number;
          is_published:        boolean;
          published_at:        string | null;
          created_at:          string;
          updated_at:          string;
          deleted_at:          string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["novel_works"]["Row"],
          "id" | "created_at" | "updated_at" | "total_char_count" | "episode_count" | "like_count" | "read_complete_count"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["novel_works"]["Insert"]>;
      };
      name_chars: {
        Row: {
          id:           string;
          work_id:      string;
          display_name: string;
          reading:      string;
          gender:       string | null;
          sort_order:   number;
          created_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["name_chars"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["name_chars"]["Insert"]>;
      };
      chapters: {
        Row: { id: string; work_id: string; title: string; sort_order: number; created_at: string; };
        Insert: Omit<Database["public"]["Tables"]["chapters"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["chapters"]["Insert"]>;
      };
      episodes: {
        Row: {
          id:           string;
          work_id:      string;
          chapter_id:   string | null;
          title:        string;
          body_json:    Json;
          char_count:   number;
          sort_order:   number;
          is_published: boolean;
          publish_at:   string | null;
          has_image:    boolean;
          has_video:    boolean;
          like_count:   number;
          published_at: string | null;
          created_at:   string;
          updated_at:   string;
          deleted_at:   string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["episodes"]["Row"],
          "id" | "created_at" | "updated_at" | "like_count"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["episodes"]["Insert"]>;
      };
      episode_media_slots: {
        Row: {
          id:                 string;
          episode_id:         string;
          slot_key:           string;
          default_media_url:  string | null;
          default_media_type: string | null;
          alt_text:           string | null;
          sort_order:         number;
          created_at:         string;
        };
        Insert: Omit<Database["public"]["Tables"]["episode_media_slots"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["episode_media_slots"]["Insert"]>;
      };
      media_packs: {
        Row: {
          id:             string;
          work_id:        string;
          author_id:      string;
          pack_name:      string;
          description:    string | null;
          thumbnail_url:  string | null;
          file_url:       string | null;
          signature_hash: string;
          version:        string;
          is_published:   boolean;
          download_count: number;
          created_at:     string;
          updated_at:     string;
        };
        Insert: Omit<Database["public"]["Tables"]["media_packs"]["Row"],
          "id" | "created_at" | "updated_at" | "download_count"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["media_packs"]["Insert"]>;
      };
      bookmarks: {
        Row: { id: string; user_id: string; work_id: string; folder_name: string | null; created_at: string; };
        Insert: Omit<Database["public"]["Tables"]["bookmarks"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Insert"]>;
      };
      read_progresses: {
        Row: {
          id:               string;
          user_id:          string;
          work_id:          string;
          last_episode_id:  string | null;
          last_scroll_pct:  number | null;
          last_flip_page:   number | null;
          completed_at:     string | null;
          updated_at:       string;
        };
        Insert: Omit<Database["public"]["Tables"]["read_progresses"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["read_progresses"]["Insert"]>;
      };
      likes: {
        Row: { id: string; user_id: string; episode_id: string; created_at: string; };
        Insert: Omit<Database["public"]["Tables"]["likes"]["Row"], "id" | "created_at"> & { id?: string };
        Update: never;
      };
      comments: {
        Row: {
          id:         string;
          episode_id: string;
          user_id:    string;
          parent_id:  string | null;
          body:       string;
          like_count: number;
          is_hidden:  boolean;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["comments"]["Row"], "id" | "created_at" | "like_count"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
      };
      notifications: {
        Row: {
          id:         string;
          user_id:    string;
          type:       string;
          actor_id:   string | null;
          work_id:    string | null;
          episode_id: string | null;
          pack_id:    string | null;
          message:    string | null;
          is_read:    boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      follows: {
        Row: { follower_id: string; followee_id: string; created_at: string; };
        Insert: Omit<Database["public"]["Tables"]["follows"]["Row"], "created_at">;
        Update: never;
      };
      tags: {
        Row: { id: string; name: string; };
        Insert: { name: string; id?: string; };
        Update: never;
      };
      work_tags: {
        Row: { work_id: string; tag_id: string; };
        Insert: Database["public"]["Tables"]["work_tags"]["Row"];
        Update: never;
      };
      user_pack_imports: {
        Row: { id: string; user_id: string; pack_id: string; is_active: boolean; imported_at: string; };
        Insert: Omit<Database["public"]["Tables"]["user_pack_imports"]["Row"], "id" | "imported_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["user_pack_imports"]["Insert"]>;
      };
      reports: {
        Row: {
          id: string; reporter_id: string; target_type: string; target_id: string;
          reason: string; detail: string | null; status: string;
          reviewed_by: string | null; reviewed_at: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reports"]["Row"], "id" | "created_at" | "status"> & { id?: string; status?: string };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
