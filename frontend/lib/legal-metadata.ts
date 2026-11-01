import type { Metadata } from "next";
export function legalMetadata(path: "/privacy" | "/terms" | "/cookies", title: string, description: string): Metadata {
  let origin = "https://meritlives.com";
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || origin);
    if (url.protocol === "https:" && !url.username && !url.password && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) origin = url.origin;
  } catch { /* Use the established corporate origin when configuration is invalid. */ }
  const canonical = origin + path;
  return { title, description, alternates: { canonical }, openGraph: { title: `${title} | MERITLIVES LLC`, description, url: canonical, type: "website" }, robots: { index: false, follow: true } };
}
