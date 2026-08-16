import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hubbert/db", "@hubbert/discord"],
};

export default nextConfig;
