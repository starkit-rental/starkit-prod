/** @type {import('next').NextConfig} */

const nextConfig = {
  turbopack: {},
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'embla-carousel-react', 'next-themes'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
    ]
  },
  async headers() {
    // NOTE: Deployed on Vercel. Content-Security-Policy is defined here so that
    // Vercel applies it (Vercel does not read netlify.toml). This is the
    // authoritative CSP and includes all required domains (InPost, Smartsupp,
    // Turnstile, Stripe, Sanity, Google Analytics/Tag Manager, OpenStreetMap).
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io https://js.stripe.com https://*.inpost.pl https://cdn.jsdelivr.net https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://*.googleadservices.com https://www.smartsuppchat.com https://*.smartsuppchat.com https://*.smartsupcdn.com",
      "script-src-elem 'self' 'unsafe-inline' https://cdn.sanity.io https://js.stripe.com https://*.inpost.pl https://cdn.jsdelivr.net https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://*.googleadservices.com https://www.smartsuppchat.com https://*.smartsuppchat.com https://*.smartsupcdn.com",
      "style-src 'self' 'unsafe-inline' https://*.inpost.pl https://cdn.jsdelivr.net https://fonts.googleapis.com https://*.smartsupcdn.com",
      "style-src-elem 'self' 'unsafe-inline' https://*.inpost.pl https://cdn.jsdelivr.net https://fonts.googleapis.com https://*.smartsupcdn.com",
      "img-src 'self' data: blob: https://cdn.sanity.io https://*.inpost.pl https://*.tile.openstreetmap.org https://*.openstreetmap.org https://www.google-analytics.com https://googleads.g.doubleclick.net https://*.googleadservices.com https://www.smartsuppchat.com https://*.smartsuppchat.com https://*.smartsupp.com https://*.smartsupcdn.com",
      "font-src 'self' data: https://*.inpost.pl https://fonts.gstatic.com https://fonts.googleapis.com https://*.smartsupcdn.com",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.inpost.pl https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com https://region1.analytics.google.com https://www.googletagmanager.com https://googleads.g.doubleclick.net https://*.googleadservices.com https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://www.smartsuppchat.com https://*.smartsuppchat.com wss://www.smartsuppchat.com wss://*.smartsuppchat.com https://www.smartsupp.com https://*.smartsupp.com https://widget-v3.smartsupcdn.com https://*.smartsupcdn.com wss://*.smartsupcdn.com",
      "frame-src 'self' https://js.stripe.com https://www.openstreetmap.org https://*.inpost.pl https://challenges.cloudflare.com https://bid.g.doubleclick.net https://www.smartsuppchat.com https://*.smartsuppchat.com https://www.smartsupp.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Ignoruj błędy związane z brakującymi lokalizacjami w bluebird
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/pl-pl$/,
          contextRegExp: /bluebird/,
        })
      );
    }
    return config;
  },
};

export default nextConfig;