import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hubbert/db", "@hubbert/discord", "@hubbert/modules"],
};

export default nextConfig;
