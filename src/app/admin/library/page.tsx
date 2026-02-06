"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Upload,
  X,
  Library,
  AppWindow,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import type { LibraryApp } from "@/lib/supabase/types";
import Header from "@/components/layout/Header";

interface AppForm {
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  file: File | null;
  icon: File | null;
}

const emptyForm: AppForm = {
  title: "",
  title_en: "",
  description: "",
  description_en: "",
  file: null,
  icon: null,
};

export default function AdminLibraryPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const [apps, setApps] = useState<LibraryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const loadApps = async () => {
    const { data } = await supabase
      .from("library_apps")
      .select("*")
      .order("created_at", { ascending: false });
    setApps(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || (!form.file && !editingId)) return;
    setSaving(true);

    try {
      let filePath = "";
      let iconUrl: string | null = null;

      // Upload HTML file
      if (form.file) {
        const fileName = `${Date.now()}-${form.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("library-apps")
          .upload(fileName, form.file, { contentType: "text/html" });
        if (uploadError) throw uploadError;
        filePath = fileName;
      }

      // Upload icon
      if (form.icon) {
        const iconName = `icons/${Date.now()}-${form.icon.name}`;
        const { error: iconError } = await supabase.storage
          .from("library-apps")
          .upload(iconName, form.icon);
        if (iconError) throw iconError;
        const { data: iconData } = supabase.storage
          .from("library-apps")
          .getPublicUrl(iconName);
        iconUrl = iconData?.publicUrl || null;
      }

      if (editingId) {
        // Update
        const updateData: Record<string, string | null> = {
          title: form.title,
          title_en: form.title_en || null,
          description: form.description,
          description_en: form.description_en || null,
        };
        if (filePath) updateData.file_path = filePath;
        if (iconUrl) updateData.icon_url = iconUrl;

        await supabase.from("library_apps").update(updateData).eq("id", editingId);
      } else {
        // Insert
        await supabase.from("library_apps").insert({
          title: form.title,
          title_en: form.title_en || null,
          description: form.description,
          description_en: form.description_en || null,
          file_path: filePath,
          icon_url: iconUrl,
        });
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadApps();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (app: LibraryApp) => {
    setEditingId(app.id);
    setForm({
      title: app.title,
      title_en: app.title_en || "",
      description: app.description,
      description_en: app.description_en || "",
      file: null,
      icon: null,
    });
    setShowForm(true);
  };

  const deleteApp = async (app: LibraryApp) => {
    if (!confirm(t.admin.confirmDelete)) return;
    // Delete file from storage
    if (app.file_path) {
      await supabase.storage.from("library-apps").remove([app.file_path]);
    }
    await supabase.from("library_apps").delete().eq("id", app.id);
    loadApps();
  };

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin")}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowRight size={16} />
              </button>
              <h1 className="text-xl font-bold font-['Amiri',serif] flex items-center gap-2">
                <Library size={20} />
                {t.admin.manageLibrary}
              </h1>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              {t.admin.addApp}
            </button>
          </div>

          {/* Apps List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <AppWindow size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">{t.library.noApps}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between bg-card border border-border rounded-xl p-4 group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
                      {app.icon_url ? (
                        <Image
                          src={app.icon_url}
                          alt=""
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <AppWindow size={18} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{app.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(app)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteApp(app)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add/Edit Form Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
                onClick={() => setShowForm(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl max-h-[90vh] overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold font-['Amiri',serif]">
                      {editingId ? t.admin.editApp : t.admin.addApp}
                    </h2>
                    <button onClick={() => setShowForm(false)}>
                      <X size={18} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t.admin.appTitle} (عربي) *
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t.admin.appTitle} (English)
                      </label>
                      <input
                        type="text"
                        value={form.title_en}
                        onChange={(e) =>
                          setForm({ ...form, title_en: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t.admin.appDescription} (عربي)
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none h-16"
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t.admin.appDescription} (English)
                      </label>
                      <textarea
                        value={form.description_en}
                        onChange={(e) =>
                          setForm({ ...form, description_en: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none h-16"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t.admin.appFile} (HTML) {!editingId && "*"}
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".html,.htm"
                        onChange={(e) =>
                          setForm({
                            ...form,
                            file: e.target.files?.[0] || null,
                          })
                        }
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                      >
                        <Upload size={16} />
                        {form.file
                          ? form.file.name
                          : locale === "ar"
                          ? "اختر ملف HTML"
                          : "Choose HTML file"}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t.admin.appIcon}
                      </label>
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setForm({
                            ...form,
                            icon: e.target.files?.[0] || null,
                          })
                        }
                        className="hidden"
                      />
                      <button
                        onClick={() => iconInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                      >
                        <Upload size={16} />
                        {form.icon
                          ? form.icon.name
                          : locale === "ar"
                          ? "اختر صورة"
                          : "Choose image"}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleSubmit}
                      disabled={saving || !form.title.trim() || (!form.file && !editingId)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={14} />
                          {t.admin.save}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                    >
                      {t.admin.cancel}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
