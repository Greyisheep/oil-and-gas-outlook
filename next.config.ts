import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",       // self-contained server bundle for the container
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
