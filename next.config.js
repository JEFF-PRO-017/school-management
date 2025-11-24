/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.BUILD_MOBILE ? 'export' : 'standalone',
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
}

module.exports = nextConfig
