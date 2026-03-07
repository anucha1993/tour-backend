import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: produces a self-contained build that doesn't
  // require static HTML export (fixes _global-error prerender bug in Next.js 16)
  output: 'standalone',
  async rewrites() {
    const apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-6e73c358eb3f4b91990ac2309aa0e232.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
