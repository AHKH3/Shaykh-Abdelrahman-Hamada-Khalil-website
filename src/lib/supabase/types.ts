export interface Student {
  id: string;
  name: string;
  created_at: string;
}

export interface Annotation {
  id: string;
  student_id: string;
  page_number: number;
  verse_key?: string;
  start_offset: number;
  end_offset: number;
  comment: string | null;
  color: string;
  is_temporary: boolean;
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  last_page: number;
  last_surah: number;
  last_ayah: number;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student;
        Insert: Omit<Student, "id" | "created_at">;
        Update: Partial<Omit<Student, "id" | "created_at">>;
      };
      annotations: {
        Row: Annotation;
        Insert: Omit<Annotation, "id" | "created_at">;
        Update: Partial<Omit<Annotation, "id" | "created_at">>;
      };
      reading_progress: {
        Row: ReadingProgress;
        Insert: Omit<ReadingProgress, "id" | "updated_at">;
        Update: Partial<Omit<ReadingProgress, "id" | "updated_at">>;
      };
    };
  };
}
