"use client";

import { motion } from "framer-motion";
import { Award, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function IjazatSection() {
  const { t, locale } = useI18n();

  return (
    <section id="ijazat" className="py-24 w-full overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 w-full">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-['Amiri',serif] mb-6 text-foreground">
            {t.ijazat.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            {t.ijazat.subtitle}
          </p>
          <div className="w-20 h-1 bg-secondary mx-auto rounded-full" />
        </motion.div>

        {/* Ijazat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.ijazat.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * i }}
              className="relative group"
            >
              <div className="card-elevated h-full bg-card rounded-2xl p-8 border border-border">
                {/* Icon Badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-muted mb-6">
                  <BookOpen size={32} className="text-foreground" />
                </div>

                {/* Ijazah Title */}
                <h3 className="text-lg font-bold font-['Amiri',serif] mb-6 leading-relaxed text-foreground">
                  {item.title}
                </h3>

                {/* Sheikh Info */}
                <div className="flex items-center gap-2 text-base">
                  <Award size={18} className="text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {locale === "ar" ? "على يد:" : "From:"}
                  </span>
                  <span className="font-semibold text-foreground">
                    {item.sheikh}
                  </span>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
            {locale === "ar"
              ? "جميع الإجازات بالسند المتصل إلى رسول الله ﷺ"
              : "All Ijazahs with connected chains of narration to Prophet Muhammad ﷺ"}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
