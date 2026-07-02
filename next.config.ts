import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Team crest URLs come from whichever football data provider is configured.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
