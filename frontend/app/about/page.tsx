import type { Metadata } from "next";
import AboutPage from "../../components/AboutPage";
import { aboutImage, getAboutPageData } from "../../lib/about";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getAboutPageData();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://meritlives.com";
  const canonical = new URL("/about", site).href;
  const image = new URL(aboutImage(content.social_image || content.hero_image, "/security/stakeholder-review.jpg"), site).href;
  return {
    title: content.seo_title, description: content.seo_description, alternates: { canonical },
    openGraph: { type: "website", siteName: "MERITLIVES LLC", title: content.seo_title, description: content.seo_description, url: canonical, images: [{ url: image, alt: content.hero_image_alt }] },
    twitter: { card: "summary_large_image", title: content.seo_title, description: content.seo_description, images: [image] },
  };
}
export default async function Page() { return <AboutPage {...await getAboutPageData()} />; }
