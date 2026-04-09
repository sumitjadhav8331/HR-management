export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_date: string;
          created_at: string;
          created_by: string;
          employee_id: string;
          id: string;
          login_time: string;
          logout_time: string | null;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          total_hours: number | null;
          updated_at: string;
        };
        Insert: {
          attendance_date?: string;
          created_at?: string;
          created_by?: string;
          employee_id: string;
          id?: string;
          login_time: string;
          logout_time?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          total_hours?: number | null;
          updated_at?: string;
        };
        Update: {
          attendance_date?: string;
          created_at?: string;
          created_by?: string;
          employee_id?: string;
          id?: string;
          login_time?: string;
          logout_time?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          total_hours?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          call_date: string;
          call_status: "interested" | "not_interested" | "follow_up";
          created_at: string;
          created_by: string;
          expected_joining_date: string | null;
          final_status: "joined" | "not_joined" | "pending";
          id: string;
          name: string;
          phone: string;
          position: string;
          response: string | null;
          updated_at: string;
        };
        Insert: {
          call_date?: string;
          call_status: "interested" | "not_interested" | "follow_up";
          created_at?: string;
          created_by?: string;
          expected_joining_date?: string | null;
          final_status: "joined" | "not_joined" | "pending";
          id?: string;
          name: string;
          phone: string;
          position: string;
          response?: string | null;
          updated_at?: string;
        };
        Update: {
          call_date?: string;
          call_status?: "interested" | "not_interested" | "follow_up";
          created_at?: string;
          created_by?: string;
          expected_joining_date?: string | null;
          final_status?: "joined" | "not_joined" | "pending";
          id?: string;
          name?: string;
          phone?: string;
          position?: string;
          response?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          created_at: string;
          created_by: string;
          email: string | null;
          id: string;
          joining_date: string;
          name: string;
          password_hash: string | null;
          phone: string;
          role: string;
          salary: number;
          department: string;
          profile_photo_url: string | null;
          user_id: string | null;
          status: "active" | "not_joined" | "left";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          email?: string | null;
          id?: string;
          joining_date: string;
          name: string;
          password_hash?: string | null;
          phone: string;
          role: string;
          salary?: number;
          department?: string;
          profile_photo_url?: string | null;
          user_id?: string | null;
          status: "active" | "not_joined" | "left";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          email?: string | null;
          id?: string;
          joining_date?: string;
          name?: string;
          password_hash?: string | null;
          phone?: string;
          role?: string;
          salary?: number;
          department?: string;
          profile_photo_url?: string | null;
          user_id?: string | null;
          status?: "active" | "not_joined" | "left";
          updated_at?: string;
        };
        Relationships: [];
      };
      leaves: {
        Row: {
          created_at: string;
          created_by: string;
          date: string;
          employee_id: string;
          id: string;
          reason: string;
          status: "pending" | "approved" | "rejected";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          date: string;
          employee_id: string;
          id?: string;
          reason: string;
          status?: "pending" | "approved" | "rejected";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          date?: string;
          employee_id?: string;
          id?: string;
          reason?: string;
          status?: "pending" | "approved" | "rejected";
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          content: string;
          created_at: string;
          created_by: string;
          id: string;
          kind: "daily_note" | "self_task";
          note_date: string;
          status: "open" | "done";
          title: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          kind: "daily_note" | "self_task";
          note_date: string;
          status?: "open" | "done";
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          kind?: "daily_note" | "self_task";
          note_date?: string;
          status?: "open" | "done";
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      salaries: {
        Row: {
          amount: number;
          bonus: number;
          created_at: string;
          created_by: string;
          deduction: number;
          employee_id: string;
          id: string;
          month: string;
          notes: string | null;
          payment_status: "pending" | "paid";
          updated_at: string;
        };
        Insert: {
          amount: number;
          bonus?: number;
          created_at?: string;
          created_by?: string;
          deduction?: number;
          employee_id: string;
          id?: string;
          month: string;
          notes?: string | null;
          payment_status?: "pending" | "paid";
          updated_at?: string;
        };
        Update: {
          amount?: number;
          bonus?: number;
          created_at?: string;
          created_by?: string;
          deduction?: number;
          employee_id?: string;
          id?: string;
          month?: string;
          notes?: string | null;
          payment_status?: "pending" | "paid";
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          created_by: string;
          date: string;
          id: string;
          pdf_url: string;
          summary_json: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          date: string;
          id?: string;
          pdf_url: string;
          summary_json: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          date?: string;
          id?: string;
          pdf_url?: string;
          summary_json?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string;
          assigned_to: string | null;
          deadline: string | null;
          description: string | null;
          completion_notes: string | null;
          id: string;
          priority: "low" | "medium" | "high" | "urgent";
          status: "pending" | "completed";
          title: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          assigned_to?: string | null;
          deadline?: string | null;
          description?: string | null;
          completion_notes?: string | null;
          id?: string;
          priority: "low" | "medium" | "high" | "urgent";
          status?: "pending" | "completed";
          title: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          assigned_to?: string | null;
          deadline?: string | null;
          description?: string | null;
          completion_notes?: string | null;
          id?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "pending" | "completed";
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: "hr" | "employee";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: "hr" | "employee";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: "hr" | "employee";
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
