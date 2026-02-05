"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, Maximize2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import type { LibraryApp } from "@/lib/supabase/types";
import Header from "@/components/layout/Header";

export default function LibraryAppPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;
  const [app, setApp] = useState<LibraryApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadApp = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("library_apps")
        .select("*")
        .eq("id", appId)
        .single();

      if (data) {
        setApp(data);
        // Get the public URL for the HTML file
        const { data: urlData } = supabase.storage
          .from("library-apps")
          .getPublicUrl(data.file_path);
        setFileUrl(urlData?.publicUrl || null);
      }
      setLoading(false);
    };
    loadApp();
  }, [appId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!app || !fileUrl) {
    return (
      <>
        <Header />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">{t.common.error}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/library")}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowRight size={16} />
            </button>
            <span className="text-sm font-medium truncate">
              {locale === "ar" ? app.title : app.title_en || app.title}
            </span>
          </div>
          <a
            href={`/library/app/${app.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={locale === "ar" ? "فتح في نافذة جديدة" : "Open in new tab"}
          >
            <Maximize2 size={16} />
          </a>
        </div>

        {/* iframe */}
        <div className="flex-1">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={app.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </main>
    </>
  );
}
