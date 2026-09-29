import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack anchored to this app when other lockfiles exist above it.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
