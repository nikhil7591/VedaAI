import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hide dev tooling output (source maps / devtool) in development builds.
  webpack(config, { dev }) {
    if (dev && config) {
      config.devtool = false;
    }
    return config;
  },
  // Silence Next.js workspace-root inference warnings in this nested workspace.
  outputFileTracingRoot: path.join(__dirname, '..'),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
};

export default nextConfig;
