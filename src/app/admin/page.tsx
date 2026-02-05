"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Library, BookOpen, LogOut, Users, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import Header from "@/components/layout/Header";

export default function AdminPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [stats, setStats] = useState({ students: 0, apps: 0, annotations: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient();
      const [students, apps, annotations] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("library_apps").select("id", { count: "exact", head: true }),
        supabase.from("annotations").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        students: students.count || 0,
        apps: apps.count || 0,
        annotations: annotations.count || 0,
      });
    };
    loadStats();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const cards = [
    {
      title: t.admin.manageStudents,
      description:
        locale === "ar"
          ? `${stats.students} طلاب | ${stats.annotations} ملاحظة`
          : `${stats.students} students | ${stats.annotations} annotations`,
      icon: Users,
      href: "/mushaf/students",
      color: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: t.admin.manageLibrary,
      description:
        locale === "ar"
          ? `${stats.apps} تطبيقات`
          : `${stats.apps} applications`,
      icon: Library,
      href: "/admin/library",
      color: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: t.nav.mushaf,
      description: locale === "ar" ? "فتح المصحف التفاعلي" : "Open Interactive Mushaf",
      icon: BookOpen,
      href: "/mushaf",
      color: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold font-['Amiri',serif] flex items-center gap-3">
                <Settings size={24} />
                {t.admin.title}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut size={16} />
              {t.nav.logout}
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={card.href}
                    className="block bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-all group"
                  >
                    <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon size={22} className="text-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{card.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
