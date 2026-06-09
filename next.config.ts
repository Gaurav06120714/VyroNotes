import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  allowedDevOrigins: [
    "172.20.10.6",
    "172.20.10.*",
    "192.168.*",
    "10.0.*",
  ],
};

export default nextConfig;
