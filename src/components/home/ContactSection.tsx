"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function ContactSection() {
  const { t, locale } = useI18n();

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
      value: "+201001947998",
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
    <section id="contact" className="py-24 bg-muted/30">
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
            {t.contact.title}
          </h2>
          <div className="w-16 h-0.5 bg-foreground/20 mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          {contactItems.map((item, i) => {
            const Icon = item.icon;
            const content = (
              <>
                <div className="p-2.5 bg-muted rounded-lg group-hover:bg-foreground/5 transition-colors">
                  <Icon size={20} className="text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate" dir="ltr">
                    {item.value}
                  </p>
                </div>
                {item.href && (
                  <ExternalLink
                    size={16}
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
                    className="flex items-start gap-4 bg-card rounded-xl p-6 border border-border hover:border-foreground/20 transition-colors group cursor-pointer"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex items-start gap-4 bg-card rounded-xl p-6 border border-border hover:border-foreground/20 transition-colors group cursor-pointer">
                    {content}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Social Media */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-border"
          >
            <p className="text-xs text-muted-foreground mb-4">
              {t.contact.social}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-lg text-sm text-foreground hover:bg-foreground/5 transition-colors"
                >
                  <span>{social.name}</span>
                  <ExternalLink size={12} className="text-muted-foreground" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
