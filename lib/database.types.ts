export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          theme: Json | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id: string;
          name: string;
          theme?: Json | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          theme?: Json | null;
        };
        Relationships: [];
      };
      content_translations: {
        Row: {
          created_at: string;
          entity_id: string;
          entity_type: string;
          field: string;
          id: string;
          locale: string;
          text: string;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          entity_type: string;
          field: string;
          id?: string;
          locale: string;
          text: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          field?: string;
          id?: string;
          locale?: string;
          text?: string;
        };
        Relationships: [];
      };
      daily_insights: {
        Row: {
          category: string | null;
          content: string;
          created_at: string | null;
          day_of_year: number;
          id: string;
          source: string | null;
          source_url: string | null;
        };
        Insert: {
          category?: string | null;
          content: string;
          created_at?: string | null;
          day_of_year: number;
          id?: string;
          source?: string | null;
          source_url?: string | null;
        };
        Update: {
          category?: string | null;
          content?: string;
          created_at?: string | null;
          day_of_year?: number;
          id?: string;
          source?: string | null;
          source_url?: string | null;
        };
        Relationships: [];
      };
      game_ability_norms: {
        Row: {
          game_id: string;
          mean_raw: number;
          sample_size: number;
          std_raw: number;
          updated_at: string;
          window_end: string;
          window_start: string;
        };
        Insert: {
          game_id: string;
          mean_raw: number;
          sample_size: number;
          std_raw: number;
          updated_at?: string;
          window_end: string;
          window_start: string;
        };
        Update: {
          game_id?: string;
          mean_raw?: number;
          sample_size?: number;
          std_raw?: number;
          updated_at?: string;
          window_end?: string;
          window_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testing_game_ability_norms_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: true;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      game_answers: {
        Row: {
          accuracy: number;
          created_at: string | null;
          generated_content: Json | null;
          id: string;
          question_id: string | null;
          response_time_ms: number | null;
          session_id: string | null;
          user_response: Json | null;
        };
        Insert: {
          accuracy: number;
          created_at?: string | null;
          generated_content?: Json | null;
          id?: string;
          question_id?: string | null;
          response_time_ms?: number | null;
          session_id?: string | null;
          user_response?: Json | null;
        };
        Update: {
          accuracy?: number;
          created_at?: string | null;
          generated_content?: Json | null;
          id?: string;
          question_id?: string | null;
          response_time_ms?: number | null;
          session_id?: string | null;
          user_response?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_answers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      game_sessions: {
        Row: {
          avg_question_difficulty: number;
          avg_response_time_ms: number | null;
          correct_count: number | null;
          created_at: string | null;
          difficulty_rating_used: number | null;
          duration_seconds: number | null;
          game_id: string | null;
          id: string;
          metadata: Json | null;
          score: number | null;
          total_questions: number | null;
          user_id: string | null;
        };
        Insert: {
          avg_question_difficulty: number;
          avg_response_time_ms?: number | null;
          correct_count?: number | null;
          created_at?: string | null;
          difficulty_rating_used?: number | null;
          duration_seconds?: number | null;
          game_id?: string | null;
          id?: string;
          metadata?: Json | null;
          score?: number | null;
          total_questions?: number | null;
          user_id?: string | null;
        };
        Update: {
          avg_question_difficulty?: number;
          avg_response_time_ms?: number | null;
          correct_count?: number | null;
          created_at?: string | null;
          difficulty_rating_used?: number | null;
          duration_seconds?: number | null;
          game_id?: string | null;
          id?: string;
          metadata?: Json | null;
          score?: number | null;
          total_questions?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          banner_url: string | null;
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          icon_url: string | null;
          id: string;
          instructions: string | null;
          is_active: boolean | null;
          is_pro_only: boolean;
          name: string;
          recommended_rounds: number;
        };
        Insert: {
          banner_url?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id: string;
          instructions?: string | null;
          is_active?: boolean | null;
          is_pro_only?: boolean;
          name: string;
          recommended_rounds?: number;
        };
        Update: {
          banner_url?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          instructions?: string | null;
          is_active?: boolean | null;
          is_pro_only?: boolean;
          name?: string;
          recommended_rounds?: number;
        };
        Relationships: [
          {
            foreignKeyName: "games_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          onboarding_completed_at: string | null;
          onboarding_data: Json | null;
          updated_at: string | null;
          username: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          onboarding_completed_at?: string | null;
          onboarding_data?: Json | null;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          onboarding_completed_at?: string | null;
          onboarding_data?: Json | null;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string;
          device_name: string | null;
          device_type: string | null;
          expo_push_token: string;
          id: string;
          is_active: boolean;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          device_name?: string | null;
          device_type?: string | null;
          expo_push_token: string;
          id?: string;
          is_active?: boolean;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          device_name?: string | null;
          device_type?: string | null;
          expo_push_token?: string;
          id?: string;
          is_active?: boolean;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          content: Json;
          created_at: string | null;
          difficulty: number;
          game_id: string | null;
          id: string;
        };
        Insert: {
          content: Json;
          created_at?: string | null;
          difficulty: number;
          game_id?: string | null;
          id?: string;
        };
        Update: {
          content?: Json;
          created_at?: string | null;
          difficulty?: number;
          game_id?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      user_category_ability_history: {
        Row: {
          ability_score: number;
          category_id: string;
          created_at: string | null;
          id: string;
          snapshot_date: string;
          user_id: string;
        };
        Insert: {
          ability_score: number;
          category_id: string;
          created_at?: string | null;
          id?: string;
          snapshot_date?: string;
          user_id: string;
        };
        Update: {
          ability_score?: number;
          category_id?: string;
          created_at?: string | null;
          id?: string;
          snapshot_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testing_user_category_ability_history_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_category_ability_scores: {
        Row: {
          ability_score: number;
          category_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ability_score: number;
          category_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ability_score?: number;
          category_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testing_user_category_ability_scores_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_game_ability_history: {
        Row: {
          ability_score: number;
          created_at: string | null;
          game_id: string;
          id: string;
          percentile: number;
          snapshot_date: string;
          user_id: string;
        };
        Insert: {
          ability_score: number;
          created_at?: string | null;
          game_id: string;
          id?: string;
          percentile: number;
          snapshot_date?: string;
          user_id: string;
        };
        Update: {
          ability_score?: number;
          created_at?: string | null;
          game_id?: string;
          id?: string;
          percentile?: number;
          snapshot_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testing_user_game_ability_history_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      user_game_ability_scores: {
        Row: {
          ability_score: number;
          game_id: string;
          last_score_raw: number;
          percentile: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ability_score: number;
          game_id: string;
          last_score_raw: number;
          percentile: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ability_score?: number;
          game_id?: string;
          last_score_raw?: number;
          percentile?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testing_user_game_ability_scores_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      user_game_performance: {
        Row: {
          created_at: string | null;
          difficulty_rating: number;
          game_id: string;
          games_played_count: number;
          highest_score: number | null;
          last_played_at: string | null;
          total_score: number;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          difficulty_rating?: number;
          game_id: string;
          games_played_count?: number;
          highest_score?: number | null;
          last_played_at?: string | null;
          total_score?: number;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          difficulty_rating?: number;
          game_id?: string;
          games_played_count?: number;
          highest_score?: number | null;
          last_played_at?: string | null;
          total_score?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_game_performance_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      user_global_ability_history: {
        Row: {
          ability_score: number;
          created_at: string | null;
          id: string;
          snapshot_date: string;
          user_id: string;
        };
        Insert: {
          ability_score: number;
          created_at?: string | null;
          id?: string;
          snapshot_date?: string;
          user_id: string;
        };
        Update: {
          ability_score?: number;
          created_at?: string | null;
          id?: string;
          snapshot_date?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_global_ability_scores: {
        Row: {
          ability_score: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ability_score: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ability_score?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_streaks: {
        Row: {
          best_streak: number;
          created_at: string | null;
          current_streak: number;
          last_played_date: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          best_streak?: number;
          created_at?: string | null;
          current_streak?: number;
          last_played_date?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          best_streak?: number;
          created_at?: string | null;
          current_streak?: number;
          last_played_date?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_content_translations: {
        Args: {
          p_entity_ids: string[];
          p_entity_type: string;
          p_fields: string[];
          p_locale: string;
        };
        Returns: {
          entity_id: string;
          field: string;
          text: string;
        }[];
      };
      get_daily_analytics_summary: { Args: never; Returns: Json };
      get_daily_challenge: {
        Args: never;
        Returns: {
          game_description: string;
          game_id: string;
          game_name: string;
          sessions_count: number;
        }[];
      };
      get_daily_insight: {
        Args: never;
        Returns: {
          category: string;
          content: string;
          id: string;
          source: string;
          source_url: string;
        }[];
      };
      get_game_questions: {
        Args: { p_count?: number; p_game_id: string };
        Returns: {
          content: Json;
          difficulty: number;
          id: string;
          pool_type: string;
        }[];
      };
      refresh_ability_scores: { Args: never; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
