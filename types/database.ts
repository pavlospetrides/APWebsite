export type ProjectStatus = 'draft' | 'published';
export type AppointmentStatus = 'new' | 'contacted' | 'completed';

export interface Database {
  public: {
    Tables: {
      admin_users: { Row: { user_id: string; created_at: string }; Insert: { user_id: string; created_at?: string }; Update: never; Relationships: [] };
      projects: { Row: { id: string; slug: string; title_el: string | null; title_en: string | null; description_el: string | null; description_en: string | null; category: string; year: number | null; location_el: string | null; location_en: string | null; cover_path: string | null; featured: boolean; status: ProjectStatus; created_at: string; updated_at: string }; Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>; Update: Partial<Database['public']['Tables']['projects']['Insert']>; Relationships: [] };
      project_images: { Row: { id: string; project_id: string; storage_path: string; cover_storage_path: string | null; alt_el: string | null; alt_en: string | null; sort_order: number; created_at: string }; Insert: Omit<Database['public']['Tables']['project_images']['Row'], 'id' | 'created_at'>; Update: Partial<Database['public']['Tables']['project_images']['Insert']>; Relationships: [] };
      appointment_requests: { Row: { id: string; name: string; phone: string; email: string | null; work_type: string; area: string; preferred_date: string | null; preferred_time: string | null; message: string; status: AppointmentStatus; created_at: string }; Insert: Omit<Database['public']['Tables']['appointment_requests']['Row'], 'id' | 'status' | 'created_at'>; Update: { status?: AppointmentStatus }; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin_mfa: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: { project_status: ProjectStatus; appointment_status: AppointmentStatus };
    CompositeTypes: Record<string, never>;
  };
}
