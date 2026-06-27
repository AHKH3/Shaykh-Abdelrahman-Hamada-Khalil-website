"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import Header from "@/components/layout/Header";
import EngravedInput from "@/components/ui/EngravedInput";

export default function LoginPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      console.log("Supabase URL prefix:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15));
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Show raw error message for debugging
        setError(`${authError.message} (Status: ${authError.status})`);
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center px-4 pt-[var(--header-height)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="card-elevated bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-muted rounded-full mb-4">
                <Lock size={24} className="text-foreground" />
              </div>
              <h1 className="text-2xl font-bold font-['Amiri',serif]">
                {t.login.title}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  {t.login.email}
                </label>
                <div className="relative">
                  <EngravedInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    icon={<Mail size={16} />}
                    required
                    dir="ltr"
                    className="p-0 h-10 w-full"
                    containerClassName="w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                  {t.login.password}
                </label>
                <div className="relative">
                  <EngravedInput
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    icon={<Lock size={16} />}
                    required
                    dir="ltr"
                    className="p-0 h-10 w-full"
                    containerClassName="w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-anthropic w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {t.login.submit}
                    {locale === "ar" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </>
  );
}
