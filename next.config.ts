import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Shared-hosting account can't spawn additional child processes at all
    // (EAGAIN) — run the webpack compiler and static-generation workers
    // in-process instead of forking separate worker processes.
    cpus: 1,
    webpackBuildWorker: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
