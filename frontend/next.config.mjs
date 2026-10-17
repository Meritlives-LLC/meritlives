/** @type {import('next').NextConfig} */
// Merged: phase1 base config (reactStrictMode) + phase6 image remotePatterns.
const apiOrigin = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL)
  : null;

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      ...(apiOrigin
        ? [{ protocol: apiOrigin.protocol.replace(":", ""), hostname: apiOrigin.hostname }]
        : []),
    ],
  },
};

export default nextConfig;
