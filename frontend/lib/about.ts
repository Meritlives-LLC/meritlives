import { cache } from "react";
import defaults from "../../content/about.json";
import { apiFetch } from "./api";
import { getProduct, getService } from "./queries";
import { featuredServices, otherServices } from "./service-catalogue";
import { productCatalogue } from "./product-catalogue";

export type AboutContent = Omit<typeof defaults, "hero_image" | "section_image" | "social_image"> & {
  hero_image: string | null; section_image: string | null; social_image: string | null;
};
export type AboutCard = { slug: string; title: string; description: string; href: string; image: string; imageAlt: string };
export const aboutDefaults: AboutContent = defaults;
const labels: Record<string, string> = {
  "web-development": "Web Development", fintech: "Fintech Solutions", edtech: "EdTech Solutions",
  "business-automation": "Business Automation", education: "Education Technology Services",
  "real-estate": "Real Estate Technology", security: "Security Technology", "ongoing-maintenance": "Ongoing Maintenance and Support",
};

export function aboutImage(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").origin;
    const url = new URL(value, origin + "/storage/");
    return url.origin === origin && url.pathname.startsWith("/storage/") ? url.href : fallback;
  } catch { return fallback; }
}

export const getAboutPageData = cache(async () => {
  const pageResult = await apiFetch<{ data: AboutContent }>("/pages/about", { cache: "no-store" }).catch(() => ({ data: defaults }));
  const content: AboutContent = { ...defaults, ...pageResult.data };
  const catalogueServices = [...featuredServices, ...otherServices];
  // Resolve selected CMS records individually: selections must not disappear beyond an API's first page.
  const [productResults, serviceResults] = await Promise.all([
    Promise.allSettled(content.product_slugs.filter(slug => !productCatalogue.some(item => item.slug === slug)).map(getProduct)),
    Promise.allSettled(content.service_slugs.filter(slug => !catalogueServices.some(item => item.slug === slug)).map(getService)),
  ]);
  const products = productResults.flatMap(result => result.status === "fulfilled" ? [result.value.data] : []);
  const services = serviceResults.flatMap(result => result.status === "fulfilled" ? [result.value.data] : []);
  const serviceCards: AboutCard[] = content.service_slugs.flatMap(slug => {
    const known = catalogueServices.find(item => item.slug === slug);
    if (known) return [{ slug, title: labels[slug] || known.title, description: known.description, href: known.href, image: known.image, imageAlt: known.imageAlt }];
    const item = services.find(item => item.slug === slug && item.status === "published");
    return item ? [{ slug, title: item.name, description: item.short_description || "Practical technology services shaped around your business needs.", href: `/services/${encodeURIComponent(slug)}`, image: "/security/team-assessment.jpg", imageAlt: "Professionals collaborating on a project; illustrative stock photography." }] : [];
  });
  const productCards: AboutCard[] = content.product_slugs.flatMap(slug => {
    const known = productCatalogue.find(item => item.slug === slug);
    if (known) return [{ slug, title: known.name, description: known.description, href: `/products/${encodeURIComponent(slug)}`, image: known.image, imageAlt: known.imageAlt }];
    const item = products.find(item => item.slug === slug && item.status === "published");
    return item ? [{ slug, title: item.name, description: item.short_description || "Explore this MERITLIVES product.", href: `/products/${encodeURIComponent(slug)}`, image: aboutImage(item.cover_image, "/security/team-assessment.jpg"), imageAlt: `${item.name} product illustration.` }] : [];
  });
  return { content, serviceCards, productCards };
});
