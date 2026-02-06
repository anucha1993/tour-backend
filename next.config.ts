import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
