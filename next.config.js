/** @type {import('next').NextConfig} */

const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {

  // ── Output mode ────────────────────────────────────────────────────────────
  // Vercel:   undefined  → standard Next.js server (SSR + edge functions)
  // Capacitor: 'export'  → full static HTML/CSS/JS bundle → goes into out/ → synced to Android/iOS
  output:       isCapacitor ? 'export' : undefined,
  trailingSlash: isCapacitor,           // required for static export routing

  // ── Images ─────────────────────────────────────────────────────────────────
  images: {
    // Static export cannot use next/image optimisation — must be unoptimized
    unoptimized: isCapacitor,

    remotePatterns: [
      { protocol: 'https', hostname: 'assets.coingecko.com'       },
      { protocol: 'https', hostname: 'coin-images.coingecko.com'  },
      { protocol: 'https', hostname: 'via.placeholder.com'         },
    ],
  },

  // ── Security headers (applied on Vercel, not in static export) ────────────
  ...(isCapacitor ? {} : {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-DNS-Prefetch-Control',  value: 'on' },
            { key: 'X-Content-Type-Options',   value: 'nosniff' },
            { key: 'X-Frame-Options',          value: 'DENY' },
            { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          ],
        },
      ];
    },
  }),

  // ── Misc ───────────────────────────────────────────────────────────────────
  poweredByHeader: false,               // don't leak Next.js version
  reactStrictMode: true,

  // ── Environment variables (baked in at build time) ─────────────────────────
  // These become available as process.env.* in the browser bundle.
  // For Capacitor APK builds, set these in frontend/.env.production
  env: {
    NEXT_PUBLIC_BUILD_TARGET: isCapacitor ? 'capacitor' : 'web',
  },
};

module.exports = nextConfig;
