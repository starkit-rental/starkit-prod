/** @type {import('next').NextConfig} */

const nextConfig = {
  turbopack: {},
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'embla-carousel-react', 'next-themes'],
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
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
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io https://js.stripe.com https://*.inpost.pl https://cdn.jsdelivr.net https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com",
              "script-src-elem 'self' 'unsafe-inline' https://cdn.sanity.io https://js.stripe.com https://*.inpost.pl https://cdn.jsdelivr.net https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://*.inpost.pl https://cdn.jsdelivr.net https://fonts.googleapis.com",
              "style-src-elem 'self' 'unsafe-inline' https://*.inpost.pl https://cdn.jsdelivr.net https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://cdn.sanity.io https://*.inpost.pl https://*.tile.openstreetmap.org https://*.openstreetmap.org https://www.google-analytics.com",
              "font-src 'self' data: https://*.inpost.pl https://fonts.gstatic.com https://fonts.googleapis.com",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.inpost.pl https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com https://region1.analytics.google.com https://www.googletagmanager.com https://*.tile.openstreetmap.org",
              "frame-src 'self' https://js.stripe.com https://www.openstreetmap.org https://*.inpost.pl https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
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