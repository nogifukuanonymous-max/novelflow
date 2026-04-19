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
        Insert: {
          id:              string;
          display_name:    string;
          username:        string;
          avatar_url?:     string | null;
          bio?:            string | null;
          role?:           "reader" | "author" | "admin";
          is_banned?:      boolean;
          deleted_at?:     string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
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
        Insert: {
          id?:             string;
          author_id:       string;
          title:           string;
          synopsis?:       string | null;
          genre:           string;
          age_rating?:     string;
          serial_status?:  string;
          reading_mode?:   string;
          thumbnail_url?:  string | null;
          is_published?:   boolean;
          published_at?:   string | null;
          deleted_at?:     string | null;
        };
        Update: Partial<Database["public"]["Tables"]["novel_works"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "novel_works_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
        Insert: {
          id?:          string;
          work_id:      string;
          display_name: string;
          reading:      string;
          gender?:      string | null;
          sort_order?:  number;
        };
        Update: Partial<Database["public"]["Tables"]["name_chars"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "name_chars_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "novel_works";
            referencedColumns: ["id"];
          }
        ];
      };
      chapters: {
        Row: { id: string; work_id: string; title: string; sort_order: number; created_at: string; };
        Insert: { id?: string; work_id: string; title: string; sort_order?: number; };
        Update: Partial<Database["public"]["Tables"]["chapters"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "chapters_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "novel_works";
            referencedColumns: ["id"];
          }
        ];
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
        Insert: {
          id?:          string;
          work_id:      string;
          chapter_id?:  string | null;
          title:        string;
          body_json:    Json;
          char_count?:  number;
          sort_order?:  number;
          is_published?: boolean;
          publish_at?:  string | null;
          has_image?:   boolean;
          has_video?:   boolean;
          published_at?: string | null;
          deleted_at?:  string | null;
        };
        Update: Partial<Database["public"]["Tables"]["episodes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "episodes_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "novel_works";
            referencedColumns: ["id"];
          }
        ];
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
        Insert: {
          id?:                 string;
          episode_id:          string;
          slot_key:            string;
          default_media_url?:  string | null;
          default_media_type?: string | null;
          alt_text?:           string | null;
          sort_order?:         number;
        };
        Update: Partial<Database["public"]["Tables"]["episode_media_slots"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "episode_media_slots_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: false;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          }
        ];
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
        Insert: {
          id?:             string;
          work_id:         string;
          author_id:       string;
          pack_name:       string;
          description?:    string | null;
          thumbnail_url?:  string | null;
          file_url?:       string | null;
          signature_hash:  string;
          version?:        string;
          is_published?:   boolean;
        };
        Update: Partial<Database["public"]["Tables"]["media_packs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "media_packs_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "novel_works";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_packs_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      pack_media_maps: {
        Row: {
          id:              string;
          pack_id:         string;
          slot_id:         string;
          media_url:       string;
          media_type:      string;
          file_size_bytes: number | null;
        };
        Insert: {
          id?:              string;
          pack_id:          string;
          slot_id:          string;
          media_url:        string;
          media_type:       string;
          file_size_bytes?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["pack_media_maps"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "pack_media_maps_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "media_packs";
            referencedColumns: ["id"];
          }
        ];
      };
      bookmarks: {
        Row: { id: string; user_id: string; work_id: string; folder_name: string | null; created_at: string; };
        Insert: { id?: string; user_id: string; work_id: string; folder_name?: string | null; };
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bookmarks_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "novel_works";
            referencedColumns: ["id"];
          }
        ];
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
        Insert: {
          id?:              string;
          user_id:          string;
          work_id:          string;
          last_episode_id?: string | null;
          last_scroll_pct?: number | null;
          last_flip_page?:  number | null;
          completed_at?:    string | null;
          updated_at?:      string;
        };
        Update: Partial<Database["public"]["Tables"]["read_progresses"]["Insert"]>;
        Relationships: [];
      };
      likes: {
        Row: { id: string; user_id: string; episode_id: string; created_at: string; };
        Insert: { id?: string; user_id: string; episode_id: string; };
        Update: Partial<Record<string, never>>;
        Relationships: [];
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
        Insert: {
          id?:         string;
          episode_id:  string;
          user_id:     string;
          parent_id?:  string | null;
          body:        string;
          is_hidden?:  boolean;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
        Insert: {
          id?:         string;
          user_id:     string;
          type:        string;
          actor_id?:   string | null;
          work_id?:    string | null;
          episode_id?: string | null;
          pack_id?:    string | null;
          message?:    string | null;
          is_read?:    boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "novel_works";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: false;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "media_packs";
            referencedColumns: ["id"];
          }
        ];
      };
      follows: {
        Row: { follower_id: string; followee_id: string; created_at: string; };
        Insert: { follower_id: string; followee_id: string; };
        Update: Partial<Record<string, never>>;
        Relationships: [];
      };
      tags: {
        Row: { id: string; name: string; };
        Insert: { name: string; id?: string; };
        Update: Partial<Record<string, never>>;
        Relationships: [];
      };
      work_tags: {
        Row: { work_id: string; tag_id: string; };
        Insert: { work_id: string; tag_id: string; };
        Update: Partial<Record<string, never>>;
        Relationships: [
          {
            foreignKeyName: "work_tags_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "novel_works";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "work_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
      user_pack_imports: {
        Row: { id: string; user_id: string; pack_id: string; is_active: boolean; imported_at: string; };
        Insert: { id?: string; user_id: string; pack_id: string; is_active?: boolean; imported_at?: string; };
        Update: Partial<Database["public"]["Tables"]["user_pack_imports"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "user_pack_imports_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "media_packs";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string; reporter_id: string; target_type: string; target_id: string;
          reason: string; detail: string | null; status: string;
          reviewed_by: string | null; reviewed_at: string | null; created_at: string;
        };
        Insert: {
          id?:          string;
          reporter_id:  string;
          target_type:  string;
          target_id:    string;
          reason:       string;
          detail?:      string | null;
          status?:      string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
