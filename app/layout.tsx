import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/retro.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/components/SettingsProvider";

export const viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://runen.no"),
  title: {
    default: "runen",
    template: "%s // runen", // Changed to double slash for a more technical feel
  },
  description: "A collection of digital tools and artifacts.",
  applicationName: "runen",

  // Clean robots instructions
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  // Discord & Facebook optimization
  openGraph: {
    type: "website",
    url: "https://runen.no",
    title: "runen",
    description: "Collection of varied digital utilities.",
    siteName: "runen",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },

  // Twitter/X optimization
  twitter: {
    card: "summary_large_image", // Shows a bigger card on Discord/Twitter
    title: "runen",
    description: "Digital tools & artifacts.",
    images: ["/og-image.png"],
  },

  // Additional UX tags
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const nostrutaru = localFont({
  src: "../public/fonts/Nosutaru-dotMPlusH-10-Regular.ttf",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className={`${nostrutaru.className} min-h-full flex flex-col`}>
        <ThemeProvider>
          <SettingsProvider>
            <div className="crt-overlay" aria-hidden="true" />
            <div className="crt-content flex-1">{children}</div>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
