import type { Service } from "../types/api";

export type CatalogueService = {
  slug: string;
  href: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
  capabilities: readonly string[];
};

// Source-managed marketing entries, not synthetic CMS records. Copy follows the existing service pages.
export const featuredServices: readonly CatalogueService[] = [
  {
    slug: "web-development", href: "/services/web-development", title: "Web & SaaS Development",
    description: "Build a useful digital experience around your customers, your team and the way your business works. From business websites to custom web applications, we help turn requirements into maintainable software.",
    image: "/security/team-assessment.jpg", imageAlt: "Two professionals reviewing a computer project together in an office; illustrative stock photograph.",
    capabilities: ["Business websites & custom applications", "E-commerce & digital portals", "CRM & ERP solutions"],
  },
  {
    slug: "fintech", href: "/services/fintech", title: "Fintech & Trading Systems",
    description: "Connect financial journeys with the software and workflows behind them. We help teams develop digital financial platforms, integrate provider APIs and bring operational information into clearer focus.",
    image: "/services/financial-review.jpg", imageAlt: "A professional examining financial documents at a desk with a laptop; illustrative stock photograph.",
    capabilities: ["Payment provider integrations", "Financial workflows & reporting", "APIs & operational tools"],
  },
  {
    slug: "edtech", href: "/services/EdTech", title: "EdTech & E-Learning",
    description: "Make learning easier to deliver, manage and access. We help education teams shape digital platforms around their programmes, learners and day-to-day teaching needs.",
    image: "/security/stakeholder-review.jpg", imageAlt: "A presenter leading a collaborative session with participants using laptops; illustrative stock photograph.", imagePosition: "center 66%",
    capabilities: ["Learning platforms & LMS integrations", "Course content & assessment tools", "Learner administration & analytics"],
  },
  {
    slug: "business-automation", href: "/services/business-automation", title: "Business Automation",
    description: "Give your team more time for work that matters. We assess repeatable processes and connect suitable workflows, messaging channels and applications around your business requirements.",
    image: "/security/professional-review.jpg", imageAlt: "A professional working at a laptop in a modern office; illustrative stock photograph.", imagePosition: "center 48%",
    capabilities: ["Workflow & approval automation", "Messaging & notification integrations", "CRM & application connections"],
  },
];

export const otherServices: readonly CatalogueService[] = [
  { slug: "education", href: "/services/Education", title: "Education & Portal Management", description: "Connect admissions, student records, results and institutional workflows through practical digital portals.", image: "/security/stakeholder-review.jpg", imageAlt: "Professionals taking part in a presentation around a conference table; illustrative stock photograph.", imagePosition: "center 66%", capabilities: [] },
  { slug: "real-estate", href: "/services/real-estate", title: "Real Estate Technology", description: "Bring property listings, management and operational workflows together through useful digital tools.", image: "/services/property-consultation.jpg", imageAlt: "A real estate professional discussing a property handover with another person; illustrative stock photograph.", capabilities: [] },
  { slug: "security", href: "/services/security", title: "Security Audit & Hardening", description: "Assess agreed application and infrastructure risks, prioritize findings and plan practical security improvements.", image: "/security/professional-review.jpg", imageAlt: "A professional reviewing work on a laptop at an office desk; illustrative stock photograph.", imagePosition: "center 45%", capabilities: [] },
];

const curatedSlugs = new Set([...featuredServices, ...otherServices].map(service => service.slug));
const excludedSlugs = new Set(["ongoing-maintenance"]);

export function additionalPublishedServices(services: readonly Service[], existing: readonly Service[] = []): Service[] {
  const result = [...existing];
  const seen = new Set(existing.map(service => service.slug.trim().toLowerCase()));
  for (const service of services) {
    const slug = service.slug?.trim().toLowerCase();
    if (service.status !== "published" || !slug || curatedSlugs.has(slug) || excludedSlugs.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    result.push(service);
  }
  return result;
}
