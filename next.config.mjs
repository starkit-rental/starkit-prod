/** @type {import('next').NextConfig} */

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
    ]
  },
  images: {
    unoptimized: true,
    qualities: [100],
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