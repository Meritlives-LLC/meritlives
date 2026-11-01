export const securityService = {
  slug: "security",
  href: "/services/security",
  name: "Security Audit & Hardening",
  description: "Authorized application, API and infrastructure assessments with practical risk prioritization, remediation planning and verification.",
};

export function securityServiceUrl(): string {
  const fallback = "https://meritlives.com";
  try {
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || fallback);
    return new URL(securityService.href, site.protocol === "https:" && !site.username && !site.password ? site.origin : fallback).toString();
  } catch {
    return new URL(securityService.href, fallback).toString();
  }
}

export function approvedSecurityMediaUrl(value?: string): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;
  if (candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\")) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
