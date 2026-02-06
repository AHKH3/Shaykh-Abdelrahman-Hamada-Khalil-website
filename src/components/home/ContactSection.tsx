"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, ExternalLink, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function ContactSection() {
  const { t } = useI18n();

  const contactItems = [
    {
      icon: Mail,
      label: t.contact.email,
      value: "abdelrahmanhamada3342@gmail.com",
      href: "mailto:abdelrahmanhamada3342@gmail.com",
    },
    {
      icon: Phone,
      label: t.contact.whatsapp,
      value: "+20 100 194 7998",
      href: "https://wa.me/201001947998",
    },
    {
      icon: MapPin,
      label: t.contact.location,
      value: t.contact.locationValue,
      href: null,
    },
  ];

  const socials = [
    {
      name: "Facebook",
      href: "https://facebook.com/shaykh.abdelrahman",
    },
    {
      name: "Instagram",
      href: "https://instagram.com/shaykh.abdelrahman",
    },
    {
      name: "YouTube",
      href: "https://youtube.com/shaykh.abdelrahman",
    },
    {
      name: "TikTok",
      href: "https://tiktok.com/@shaykh.abdelrahman",
    },
  ];

  return (
    <section id="contact" className="py-24 bg-muted/20 w-full overflow-x-hidden">
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
            {t.contact.title}
          </h2>
          <div className="w-20 h-1.5 bg-accent mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            {contactItems.map((item, i) => {
              const Icon = item.icon;
              const content = (
                <>
                  <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                    <Icon size={24} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.label}
                    </p>
                    <p className="text-lg font-semibold text-foreground truncate" dir="ltr">
                      {item.value}
                    </p>
                  </div>
                  {item.href && (
                    <ExternalLink
                      size={18}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
                    />
                  )}
                </>
              );

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex items-start gap-5 bg-card rounded-2xl p-6 border border-border hover:border-accent/30 transition-all group cursor-pointer"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="flex items-start gap-5 bg-card rounded-2xl p-6 border border-border">
                      {content}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Social Media */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-card rounded-2xl p-8 border border-border"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-accent/10 rounded-xl">
                <Share2 size={24} className="text-accent" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {t.contact.social}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-4 bg-muted/50 rounded-xl text-base text-foreground hover:bg-accent/10 hover:text-accent transition-all"
                >
                  <span>{social.name}</span>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
