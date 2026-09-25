import Hero from "../components/Hero";
import { FeaturedProducts, FeaturedServices, IntroSection } from "../components/HomeSections";
import { getProducts, getServices } from "../lib/queries";

export default async function HomePage() {
  const [products, services] = await Promise.allSettled([getProducts("?featured=1"), getServices("?featured=1")]);
  const productData = products.status === "fulfilled" ? products.value.data : [];
  const serviceData = services.status === "fulfilled" ? services.value.data : [];

  return <>
    <Hero />
    <IntroSection />
    <FeaturedProducts products={productData} />
    <FeaturedServices services={serviceData} />
    <section className="ml-section"><div className="ml-container rounded-[32px] bg-blue-950 px-8 py-14 text-white md:px-14"><p className="ml-eyebrow text-blue-300">Start a conversation</p><div className="mt-4 flex flex-col justify-between gap-8 md:flex-row md:items-end"><h2 className="max-w-2xl text-4xl font-extrabold tracking-tight">Have a challenge worth solving?</h2><a href="/contact" className="ml-btn ml-btn-light">Talk to MERITLIVES →</a></div></div></section>
  </>;
}
