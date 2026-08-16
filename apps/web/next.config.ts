import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hubbert/db", "@hubbert/discord", "@hubbert/modules"],
  outputFileTracingIncludes: {
    "/*": ["../../packages/db/generated/client/**/*"],
  },
};

export default nextConfig;
