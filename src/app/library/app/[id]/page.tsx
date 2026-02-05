"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LibraryApp } from "@/lib/supabase/types";

export default function StandaloneAppPage() {
  const params = useParams();
  const appId = params.id as string;
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApp = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("library_apps")
        .select("file_path")
        .eq("id", appId)
        .single();

      if (data) {
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Application not found</p>
      </div>
    );
  }

  return (
    <iframe
      src={fileUrl}
      className="w-screen h-screen border-0"
      title="Application"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
