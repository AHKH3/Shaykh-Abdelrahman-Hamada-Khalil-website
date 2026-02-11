"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/lib/theme/context";

export default function Footer() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 w-full">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Image
              src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
              alt={locale === "ar" ? "الشيخ عبد الرحمن حماده خليل" : "Shaykh Abdelrahman Hamada Khalil"}
              width={160}
              height={64}
              className="h-14 w-auto object-contain mb-4"
            />
            <p className="text-base text-muted-foreground leading-relaxed">
              {locale === "ar"
                ? "معلم قرآن كريم مجاز بالسند المتصل"
                : "Certified Quran Teacher with Connected Chains of Narration"}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-bold mb-4 text-foreground">
              {locale === "ar" ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-base text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link
                  href="/mushaf"
                  className="text-base text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.nav.mushaf}
                </Link>
              </li>
              <li>
                <Link
                  href="/library"
                  className="text-base text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.nav.library}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base font-bold mb-4 text-foreground">
              {t.contact.title}
            </h4>
            <ul className="space-y-3 text-base text-muted-foreground">
              <li>
                <a
                  href="mailto:abdelrahmanhamada3342@gmail.com"
                  className="hover:text-foreground transition-colors"
                >
                  abdelrahmanhamada3342@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/201001947998"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  +201001947998
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {year}{" "}
            {locale === "ar"
              ? "الشيخ عبد الرحمن حماده خليل"
              : "Shaykh Abdelrahman Hamada Khalil"}
            . {t.footer.rights}.
          </p>
          <div className="flex items-center gap-6">
            {[
              {
                href: "https://facebook.com/shaykh.abdelrahman",
                label: "Facebook",
              },
              {
                href: "https://instagram.com/shaykh.abdelrahman",
                label: "Instagram",
              },
              {
                href: "https://youtube.com/shaykh.abdelrahman",
                label: "YouTube",
              },
              {
                href: "https://tiktok.com/@shaykh.abdelrahman",
                label: "TikTok",
              },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
