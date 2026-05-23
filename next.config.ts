import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN IPs (so phone testing works) — Next 16 requires explicit allowlist
  allowedDevOrigins: [
    "172.20.10.6",
    "172.20.10.*",
    "192.168.*",
    "10.0.*",
  ],
};

export default nextConfig;
