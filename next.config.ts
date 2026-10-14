import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  reactStrictMode: false,
  async headers() {
    return ["/sw.js", "/tablet-check.html"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
    }));
  },
};

export default nextConfig;
