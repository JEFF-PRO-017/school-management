/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Désactiver en dev
  buildExcludes: [/middleware-manifest\.json$/],
})

const nextConfig = withPWA({
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  // Configuration Electron
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
})

module.exports = nextConfig
