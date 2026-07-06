export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          total_points: number
          global_rank: number | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          total_points?: number
          global_rank?: number | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          avatar_url?: string | null
          total_points?: number
          global_rank?: number | null
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          home_team: string
          away_team: string
          home_team_logo: string
          away_team_logo: string
          competition: string
          kickoff_time: string
          status: MatchStatus
          home_score: number | null
          away_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          home_team: string
          away_team: string
          home_team_logo?: string
          away_team_logo?: string
          competition?: string
          kickoff_time: string
          status?: MatchStatus
          home_score?: number | null
          away_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          home_team?: string
          away_team?: string
          home_team_logo?: string
          away_team_logo?: string
          competition?: string
          kickoff_time?: string
          status?: MatchStatus
          home_score?: number | null
          away_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          match_id: string
          home_prediction: number
          away_prediction: number
          points_earned: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          home_prediction: number
          away_prediction: number
          points_earned?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          home_prediction?: number
          away_prediction?: number
          points_earned?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      leagues: {
        Row: {
          id: string
          name: string
          description: string
          invite_code: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          invite_code: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string
          updated_at?: string
        }
        Relationships: []
      }
      league_members: {
        Row: {
          id: string
          league_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          joined_at?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']
export type League = Database['public']['Tables']['leagues']['Row']
export type LeagueMember = Database['public']['Tables']['league_members']['Row']

export type MatchWithPrediction = Match & {
  userPrediction?: Prediction | null
}

export type LeaderboardEntry = Profile & {
  rank: number
}

export type LeagueWithMembers = League & {
  member_count: number
  members?: (LeagueMember & { profile: Profile })[]
}
