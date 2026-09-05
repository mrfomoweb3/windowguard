import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
