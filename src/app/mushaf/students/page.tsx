"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, BookOpen, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import type { Student } from "@/lib/supabase/types";
import Header from "@/components/layout/Header";

export default function StudentsPage() {
  const { t, locale } = useI18n();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      setStudents(data || []);
      setLoading(false);
    };

    loadStudents();
  }, []);

  const addStudent = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const supabase = createClient();
    const { error } = await supabase.from("students").insert({ name: newName.trim() });
    if (!error) {
      setNewName("");
      const { data } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      setStudents(data || []);
    }
    setAdding(false);
  };

  const deleteStudent = async (id: string) => {
    if (!confirm(t.admin.confirmDelete)) return;
    const supabase = createClient();
    await supabase.from("annotations").delete().eq("student_id", id);
    await supabase.from("students").delete().eq("id", id);
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    setStudents(data || []);
  };

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users size={24} />
              <h1 className="text-2xl font-bold font-['Amiri',serif]">
                {t.mushaf.students}
              </h1>
            </div>
          </div>

          {/* Add Student */}
          <div className="mb-8 flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStudent()}
              placeholder={t.mushaf.studentName}
              className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <button
              onClick={addStudent}
              disabled={adding || !newName.trim()}
              className="btn-anthropic flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
            >
              <Plus size={16} />
              {t.mushaf.addStudent}
            </button>
          </div>

          {/* Students List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">
                {locale === "ar" ? "لا يوجد طلاب بعد" : "No students yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student, i) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-elevated-sm flex items-center justify-between bg-card border border-border rounded-xl p-4 group"
                >
                  <Link
                    href={`/mushaf/students/${student.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <BookOpen size={18} className="text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{student.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(student.created_at).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => deleteStudent(student.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
