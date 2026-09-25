/** @type {import('next').NextConfig} */
// Merged: phase1 base config (reactStrictMode) + phase6 image remotePatterns.
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
