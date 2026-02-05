"use client";

import { motion } from "framer-motion";
import { Award, Link as LinkIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function IjazatSection() {
  const { t, locale } = useI18n();

  return (
    <section id="ijazat" className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-['Amiri',serif] mb-4">
            {t.ijazat.title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t.ijazat.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-16 h-0.5 bg-foreground/20 mx-auto mb-16"
        />

        {/* Ijazat Cards */}
        <div className="space-y-6">
          {t.ijazat.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 * i }}
              className="group"
            >
              <div className="bg-card rounded-2xl p-8 border border-border hover:border-foreground/20 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-muted rounded-xl shrink-0 group-hover:bg-foreground/5 transition-colors">
                    <Award size={24} className="text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold font-['Amiri',serif] mb-3 leading-relaxed">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LinkIcon size={14} />
                      <span>
                        {locale === "ar" ? "على يد" : "Under"}{" "}
                        <span className="text-foreground font-medium">
                          {item.sheikh}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
