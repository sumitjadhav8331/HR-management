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
          phone: string;
          role: string;
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
          phone: string;
          role: string;
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
          phone?: string;
          role?: string;
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
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          date: string;
          employee_id: string;
          id?: string;
          reason: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          date?: string;
          employee_id?: string;
          id?: string;
          reason?: string;
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
          deadline: string | null;
          description: string | null;
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
          deadline?: string | null;
          description?: string | null;
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
          deadline?: string | null;
          description?: string | null;
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
          role: "hr";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: "hr";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: "hr";
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
