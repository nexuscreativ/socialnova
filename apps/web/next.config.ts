import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server build: simplifies the production container and
  // avoids shipping node_modules twice (used by the Fly.io deploy).
  output: "standalone",
  async headers() {
    return [
      {
        // Keep HTML fresh so stale builds are never served from browser cache
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ]
  },
}

export default nextConfig
