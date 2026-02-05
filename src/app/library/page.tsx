"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Library, ExternalLink, Copy, Check, AppWindow } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import type { LibraryApp } from "@/lib/supabase/types";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function LibraryPage() {
  const { t, locale } = useI18n();
  const [apps, setApps] = useState<LibraryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadApps = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("library_apps")
        .select("*")
        .order("created_at", { ascending: false });
      setApps(data || []);
      setLoading(false);
    };
    loadApps();
  }, []);

  const copyShareLink = async (appId: string) => {
    const url = `${window.location.origin}/library/app/${appId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(appId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold font-['Amiri',serif] mb-3">
              {t.library.title}
            </h1>
            <p className="text-muted-foreground">{t.library.subtitle}</p>
            <div className="w-16 h-0.5 bg-foreground/20 mx-auto mt-4" />
          </motion.div>

          {/* Apps Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Library size={48} className="mx-auto mb-4 opacity-30" />
              <p>{t.library.noApps}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-foreground/20 transition-all group"
                >
                  {/* Icon/Preview */}
                  <div className="h-32 bg-muted flex items-center justify-center">
                    {app.icon_url ? (
                      <img
                        src={app.icon_url}
                        alt=""
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <AppWindow
                        size={40}
                        className="text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1">
                      {locale === "ar" ? app.title : app.title_en || app.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                      {locale === "ar"
                        ? app.description
                        : app.description_en || app.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/library/${app.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-foreground text-background rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        <ExternalLink size={12} />
                        {t.library.openApp}
                      </Link>
                      <button
                        onClick={() => copyShareLink(app.id)}
                        className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
                        title={t.library.shareApp}
                      >
                        {copiedId === app.id ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
