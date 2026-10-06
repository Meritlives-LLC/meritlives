import Hero from "../components/Hero";
import { FeaturedStories, MeritlivesWatch } from "../components/HomeSections";
import { getNews, getProducts, getServices } from "../lib/queries";

export default async function HomePage() {
  const [products, services, news] = await Promise.allSettled([
    getProducts("?featured=1"),
    getServices("?featured=1"),
    getNews("?featured=1"),
  ]);

  const productData = products.status === "fulfilled" ? products.value.data : [];
  const serviceData = services.status === "fulfilled" ? services.value.data : [];
  const newsData = news.status === "fulfilled" ? news.value.data : [];

  return (
    <>
      <Hero products={productData} services={serviceData} news={newsData} />
      <FeaturedStories stories={newsData} />
      <MeritlivesWatch />
    </>
  );
}
