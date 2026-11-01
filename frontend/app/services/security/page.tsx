import type { Metadata } from "next";
import SecurityServicePage from "../../../components/SecurityServicePage";
import { securityService, securityServiceUrl } from "../../../lib/security-service";

export function generateMetadata(): Metadata {
  const canonical = securityServiceUrl();
  return {
    title: "Security Audit & Hardening",
    description: securityService.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: "Security Audit & Hardening | MERITLIVES LLC",
      description: securityService.description,
      url: canonical,
      images: [{ url: new URL("/security/team-assessment.jpg", canonical).toString(), alt: "Professionals collaborating at a computer in a modern office; illustrative stock photograph." }],
    },
  };
}

// Source-managed marketing content, independent of CMS records and their publication status.
export default function SecurityPage() {
  const url = securityServiceUrl();
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: securityService.name,
    serviceType: "Security assessment and hardening",
    description: securityService.description,
    url,
    provider: { "@type": "Organization", name: "MERITLIVES LLC", url: new URL("/", url).toString() },
  };
  return <>
    <SecurityServicePage />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service).replace(/</g, "\\u003c") }} />
  </>;
}
