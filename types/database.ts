export type ProjectStatus = 'draft' | 'published';
export type AppointmentStatus = 'new' | 'contacted' | 'completed';

export interface Database {
  public: {
    Tables: {
      admin_users: { Row: { user_id: string; created_at: string }; Insert: { user_id: string; created_at?: string }; Update: never; Relationships: [] };
      projects: { Row: { id: string; slug: string; title_el: string; title_en: string; description_el: string; description_en: string; category: string; year: number | null; location_el: string | null; location_en: string | null; cover_path: string | null; featured: boolean; status: ProjectStatus; created_at: string; updated_at: string }; Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>; Update: Partial<Database['public']['Tables']['projects']['Insert']>; Relationships: [] };
      project_images: { Row: { id: string; project_id: string; storage_path: string; alt_el: string; alt_en: string; sort_order: number; created_at: string }; Insert: Omit<Database['public']['Tables']['project_images']['Row'], 'id' | 'created_at'>; Update: Partial<Database['public']['Tables']['project_images']['Insert']>; Relationships: [] };
      appointment_requests: { Row: { id: string; name: string; phone: string; email: string | null; work_type: string; area: string; preferred_date: string | null; preferred_time: string | null; message: string; status: AppointmentStatus; created_at: string }; Insert: Omit<Database['public']['Tables']['appointment_requests']['Row'], 'id' | 'status' | 'created_at'>; Update: { status?: AppointmentStatus }; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
