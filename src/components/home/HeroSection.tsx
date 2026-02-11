"use client";

import { motion } from "framer-motion";
import { ArrowDown, Mail, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";

export default function HeroSection() {
  const { t } = useI18n();

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 w-full overflow-hidden">
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/10 border border-secondary/30 text-base text-secondary">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            {t.hero.greeting}
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold font-['Amiri',serif] leading-tight mb-8 text-foreground"
        >
          {t.hero.name}
        </motion.h1>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl text-muted-foreground mb-6 font-medium"
        >
          {t.hero.title}
        </motion.p>

        {/* Subtitle - Bio */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-muted-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          {t.about.bio}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
        >
          <a
            href="#contact"
            className="btn-anthropic inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary-hover min-w-[160px]"
          >
            <Mail size={18} />
            {t.contact.title}
          </a>
          <Link
            href="/mushaf"
            className="btn-anthropic inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg text-base font-medium hover:bg-secondary-hover min-w-[160px]"
          >
            <BookOpen size={18} />
            {t.nav.mushaf}
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute -bottom-16 start-0 end-0 mx-auto"
        >
          <motion.a
            href="#ijazat"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-sm">{t.hero.cta}</span>
            <ArrowDown size={18} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
