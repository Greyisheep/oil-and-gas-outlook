import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",       // self-contained server bundle for the container
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,   // no floating Next badge over the dashboard
};

export default nextConfig;
