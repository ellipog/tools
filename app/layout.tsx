import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/app/retro.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import PwaProvider from "@/components/PwaProvider";

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://runen.no"),
  title: {
    default: "runen",
    template: "%s // runen",
  },
  applicationName: "runen",
  manifest: "/manifest.webmanifest",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  openGraph: {
    type: "website",
    url: "https://runen.no",
    title: "runen",
    siteName: "runen",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },

  twitter: {
    card: "summary_large_image",
    title: "runen",
    images: ["/og-image.png"],
  },

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
    <html lang="en" className={`h-full antialiased`} suppressHydrationWarning>
      <body className={`${nostrutaru.className} min-h-full flex flex-col`}>
        <script dangerouslySetInnerHTML={{ __html: `try{(localStorage.getItem("aaenz:crt")||"on")!=="off"&&document.documentElement.classList.add("crt-on")}catch(e){}` }} />
        <ThemeProvider>
          <SettingsProvider>
            <PwaProvider>
              <div className="crt-overlay" aria-hidden="true" />
              <div className="crt-content flex-1">{children}</div>
            </PwaProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
