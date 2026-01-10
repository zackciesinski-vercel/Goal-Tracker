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
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'member'
          created_at?: string
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          id: string
          fiscal_year_start_month: number
          checkin_cadence_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fiscal_year_start_month?: number
          checkin_cadence_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fiscal_year_start_month?: number
          checkin_cadence_days?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          title: string
          description: string | null
          icon: string
          owner_id: string
          parent_goal_id: string | null
          goal_type: 'company' | 'team' | 'individual'
          metric_name: string
          metric_target: number
          metric_current: number
          year: number
          quarter: number
          is_locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          icon?: string
          owner_id: string
          parent_goal_id?: string | null
          goal_type: 'company' | 'team' | 'individual'
          metric_name: string
          metric_target: number
          metric_current?: number
          year: number
          quarter: number
          is_locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          icon?: string
          owner_id?: string
          parent_goal_id?: string | null
          goal_type?: 'company' | 'team' | 'individual'
          metric_name?: string
          metric_target?: number
          metric_current?: number
          year?: number
          quarter?: number
          is_locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
      updates: {
        Row: {
          id: string
          goal_id: string
          metric_value: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          metric_value: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          metric_value?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "updates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme_preset: string
          color_mode: 'light' | 'dark' | 'system'
          font_family: string
          custom_primary: string | null
          custom_accent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme_preset?: string
          color_mode?: 'light' | 'dark' | 'system'
          font_family?: string
          custom_primary?: string | null
          custom_accent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme_preset?: string
          color_mode?: 'light' | 'dark' | 'system'
          font_family?: string
          custom_primary?: string | null
          custom_accent?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type OrgSettings = Database['public']['Tables']['org_settings']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Update = Database['public']['Tables']['updates']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']

export type GoalWithUpdates = Goal & {
  updates: Update[]
  owner: User
}

export type GoalWithParent = Goal & {
  updates: Update[]
  owner: User
  parent_goal: Goal | null
}
