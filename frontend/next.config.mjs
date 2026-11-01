/** @type {import('next').NextConfig} */
// Merged: phase1 base config (reactStrictMode) + phase6 image remotePatterns.
// Only the configured application storage origin may serve backend images.
// Never derive a production allowlist from a development/loopback API URL.
const development = process.env.NODE_ENV === "development";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || (development ? "http://127.0.0.1:8000/api/v1" : "");
const apiOrigin = apiUrl ? new URL(apiUrl) : null;
const productionHosts = new Set(["meritlives.com", "www.meritlives.com", "api.meritlives.com"]);
const storagePatterns = apiOrigin && productionHosts.has(apiOrigin.hostname)
  && apiOrigin.protocol === "https:" && apiOrigin.port === ""
  ? [{ protocol: "https", hostname: apiOrigin.hostname, port: "", pathname: "/storage/**", search: "" }]
  : development && apiOrigin && ["localhost", "127.0.0.1"].includes(apiOrigin.hostname)
    ? [{ protocol: "http", hostname: apiOrigin.hostname, port: apiOrigin.port, pathname: "/storage/**", search: "" }]
    : [];

const nextConfig = {
  reactStrictMode: true,
  // Allows local readiness builds to run beside an existing dev server
  // without either process overwriting the other's generated output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    cpus: 1,
    // Next 14 serializes unset incremental-cache IPC values as "undefined"
    // in worker threads, which breaks revalidateTag during static builds.
    webpackBuildWorker: false,
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", port: "", pathname: "/vi/**", search: "" },
      { protocol: "https", hostname: "img.youtube.com", port: "", pathname: "/vi/**", search: "" },
      ...storagePatterns,
    ],
  },
};

export default nextConfig;
