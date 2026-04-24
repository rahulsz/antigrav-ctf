import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side external packages for Shiki
  serverExternalPackages: ["shiki"],
};

export default nextConfig;
