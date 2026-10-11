import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Default is 300s: the previous 30s revalidated static pages on nearly
    // every revisit, flashing loading states on a fully static site.
    staleTimes: {
      static: 300,
    },
    // framer-motion ships many modules; only bundle the ones in use.
    // (lucide-react is already optimized by default — and currently unused.)
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
