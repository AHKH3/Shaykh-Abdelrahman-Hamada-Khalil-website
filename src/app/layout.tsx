import type { Metadata } from "next";
import { Amiri, Noto_Naskh_Arabic } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-noto-naskh-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "الشيخ عبد الرحمن حماده خليل | Shaykh Abdelrahman Hamada Khalil",
  description:
    "معلم قرآن كريم مجاز بالسند المتصل - Certified Quran Teacher with Connected Chains of Narration",
  keywords: ["قرآن", "Quran", "قرآن كريم", "Holy Quran", "إجازات", "Ijazat", "تعليم القرآن", "Quran Teaching"],
  authors: [{ name: "Shaykh Abdelrahman Hamada Khalil" }],
  creator: "Shaykh Abdelrahman Hamada Khalil",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "الشيخ عبد الرحمن حماده خليل | Shaykh Abdelrahman Hamada Khalil",
    description: "معلم قرآن كريم مجاز بالسند المتصل - Certified Quran Teacher with Connected Chains of Narration",
    type: "website",
    locale: "ar_AR",
    alternateLocale: ["en_US"],
    siteName: "Shaykh Abdelrahman Hamada Khalil",
  },
  twitter: {
    card: "summary_large_image",
    title: "الشيخ عبد الرحمن حماده خليل | Shaykh Abdelrahman Hamada Khalil",
    description: "معلم قرآن كريم مجاز بالسند المتصل - Certified Quran Teacher with Connected Chains of Narration",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${amiri.variable} ${notoNaskhArabic.variable}`}>
        <Providers>
          <a href="#main-content" className="skip-to-content">
            انتقل إلى المحتوى الرئيسي
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
