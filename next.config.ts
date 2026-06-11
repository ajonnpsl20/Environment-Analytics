import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The old overview route was removed in the 2026-06-11 simplification.
      // Redirect any lingering bookmarks / shared demo links / cached bundles
      // to the new landing page instead of 404ing.
      { source: "/dashboard", destination: "/air-emissions", permanent: false },
    ];
  },
};

export default nextConfig;
