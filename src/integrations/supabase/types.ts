export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          target_type: string | null
          target_id: string | null
          details: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: number
          created_at: string
          updated_at: string | null
          pickup_location: string
          destination_location: string
          from_ksar: string | null
          passenger_id: string | null
          driver_id: string | null
          trip_id: string | null
          seats_booked: number | null
          total_amount: number | null
          payment_method: string | null
          notes: string | null
          pickup_time: string | null
          special_requests: string | null
          status: string
        }
        Insert: {
          id?: never
          created_at?: string
          updated_at?: string | null
          pickup_location: string
          destination_location: string
          from_ksar?: string | null
          passenger_id?: string | null
          driver_id?: string | null
          trip_id?: string | null
          seats_booked?: number | null
          total_amount?: number | null
          payment_method?: string | null
          notes?: string | null
          pickup_time?: string | null
          special_requests?: string | null
          status?: string
        }
        Update: {
          id?: never
          created_at?: string
          updated_at?: string | null
          pickup_location?: string
          destination_location?: string
          from_ksar?: string | null
          passenger_id?: string | null
          driver_id?: string | null
          trip_id?: string | null
          seats_booked?: number | null
          total_amount?: number | null
          payment_method?: string | null
          notes?: string | null
          pickup_time?: string | null
          special_requests?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          }
        ]
      }
      driver_locations: {
        Row: {
          driver_id: string
          lat: number
          lng: number
          heading: number | null
          speed: number | null
          accuracy: number | null
          updated_at: string | null
        }
        Insert: {
          driver_id: string
          lat: number
          lng: number
          heading?: number | null
          speed?: number | null
          accuracy?: number | null
          updated_at?: string | null
        }
        Update: {
          driver_id?: string
          lat?: number
          lng?: number
          heading?: number | null
          speed?: number | null
          accuracy?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string | null
          is_read: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string | null
          is_read?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string | null
          is_read?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          phone: string | null
          role: string | null
          avatar_url: string | null
          wilaya: string | null
          commune: string | null
          address: string | null
          date_of_birth: string | null
          is_verified: boolean | null
          language: string | null
          age: number | null
          ksar: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          avatar_url?: string | null
          wilaya?: string | null
          commune?: string | null
          address?: string | null
          date_of_birth?: string | null
          is_verified?: boolean | null
          language?: string | null
          age?: number | null
          ksar?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          avatar_url?: string | null
          wilaya?: string | null
          commune?: string | null
          address?: string | null
          date_of_birth?: string | null
          is_verified?: boolean | null
          language?: string | null
          age?: number | null
          ksar?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: Json
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          id: string
          driver_id: string | null
          vehicle_id: string | null
          from_wilaya_id: number
          to_wilaya_id: number
          from_wilaya_name: string | null
          to_wilaya_name: string | null
          from_ksar: string | null
          to_ksar: string | null
          departure_date: string
          departure_time: string
          price_per_seat: number
          total_seats: number
          available_seats: number
          description: string | null
          status: string
          is_demo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          driver_id?: string | null
          vehicle_id?: string | null
          from_wilaya_id: number
          to_wilaya_id: number
          from_wilaya_name?: string | null
          to_wilaya_name?: string | null
          from_ksar?: string | null
          to_ksar?: string | null
          departure_date: string
          departure_time: string
          price_per_seat: number
          total_seats: number
          available_seats?: number
          description?: string | null
          status?: string
          is_demo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          driver_id?: string | null
          vehicle_id?: string | null
          from_wilaya_id?: number
          to_wilaya_id?: number
          from_wilaya_name?: string | null
          to_wilaya_name?: string | null
          from_ksar?: string | null
          to_ksar?: string | null
          departure_date?: string
          departure_time?: string
          price_per_seat?: number
          total_seats?: number
          available_seats?: number
          description?: string | null
          status?: string
          is_demo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicles: {
        Row: {
          id: string
          driver_id: string | null
          make: string
          model: string
          year: number | null
          color: string | null
          license_plate: string | null
          seats: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          driver_id?: string | null
          make: string
          model: string
          year?: number | null
          color?: string | null
          license_plate?: string | null
          seats?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          driver_id?: string | null
          make?: string
          model?: string
          year?: number | null
          color?: string | null
          license_plate?: string | null
          seats?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    Enums: {},
  },
} as const
