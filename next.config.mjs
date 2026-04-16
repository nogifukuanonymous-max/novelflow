/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "r2.novelflow.app" },
      { protocol: "https", hostname: "cdn.novelflow.app" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
