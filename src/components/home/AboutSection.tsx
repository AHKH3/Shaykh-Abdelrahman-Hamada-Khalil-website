"use client";

import { motion } from "framer-motion";
import { Briefcase, GraduationCap, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function AboutSection() {
  const { t, locale } = useI18n();

  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-['Amiri',serif] mb-4">
            {t.about.title}
          </h2>
          <div className="w-16 h-0.5 bg-foreground/20 mx-auto" />
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-muted rounded-xl">
                <GraduationCap size={24} className="text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {locale === "ar" ? "جامعة الأزهر الشريف" : "Al-Azhar University"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "كلية اللغات والترجمة - قسم اللغة الصينية وآدابها"
                    : "Faculty of Languages & Translation - Chinese Literature Department"}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t.about.bio}
            </p>
          </div>
        </motion.div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-xl font-bold font-['Amiri',serif] mb-8 flex items-center gap-3">
            <Briefcase size={20} />
            {t.about.experience}
          </h3>

          <div className="space-y-4">
            {t.about.experienceItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: locale === "ar" ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="relative bg-card rounded-xl p-6 border border-border hover:border-foreground/20 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground group-hover:text-foreground transition-colors">
                      {item.role}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin size={14} />
                      <span>{item.place}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full whitespace-nowrap">
                    {item.period}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
