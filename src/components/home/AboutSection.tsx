"use client";

import { motion } from "framer-motion";
import { GraduationCap, Briefcase, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function AboutSection() {
  const { t, locale } = useI18n();

  return (
    <section id="about" className="py-24 bg-muted/20 w-full overflow-x-hidden">
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
            {t.about.title}
          </h2>
          <div className="w-20 h-1.5 bg-accent mx-auto rounded-full" />
        </motion.div>

        {/* Education Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-accent/10 rounded-xl">
                <GraduationCap size={28} className="text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {locale === "ar" ? "التعليم" : "Education"}
              </h3>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground">
                {locale === "ar" ? "جامعة الأزهر الشريف" : "Al-Azhar University"}
              </p>
              <p className="text-base text-muted-foreground">
                {locale === "ar"
                  ? "كلية اللغات والترجمة - قسم اللغة الصينية وآدابها"
                  : "Faculty of Languages & Translation - Chinese Literature Department"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Experience Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Briefcase size={28} className="text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              {t.about.experience}
            </h3>
          </div>

          <div className="space-y-6">
            {t.about.experienceItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: locale === "ar" ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="relative"
              >
                {/* Timeline Line */}
                {i < t.about.experienceItems.length - 1 && (
                  <div className="absolute start-5 top-14 bottom-0 w-px bg-border" />
                )}

                <div className="flex gap-5">
                  {/* Timeline Dot */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-accent border-4 border-background flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent-foreground" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-10">
                    <div className="bg-card rounded-2xl p-6 border border-border hover:border-accent/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <h4 className="text-lg font-bold text-foreground">
                          {item.role}
                        </h4>
                        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full whitespace-nowrap">
                          <Calendar size={14} />
                          {item.period}
                        </span>
                      </div>
                      <p className="text-base text-muted-foreground">{item.place}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
