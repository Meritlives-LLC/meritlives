import Link from "next/link";
import type { Product, Service } from "../types/api";
import ProductsList from "./ProductsList";
import ServicesList from "./ServicesList";

export function IntroSection() {
  return (
    <section className="ml-section bg-slate-50">
      <div className="ml-container grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
        <div><p className="ml-eyebrow">What we do</p><h2 className="mt-4 text-4xl font-extrabold tracking-tight">Practical technology for real-world challenges.</h2></div>
        <div className="text-lg leading-8 text-slate-600"><p>We work across technology, digital innovation and learning to create solutions that are useful, accessible and built around the people who use them.</p><Link href="/services" className="mt-7 inline-flex font-bold text-blue-700">Discover our capabilities →</Link></div>
      </div>
    </section>
  );
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  return <section className="ml-section"><div className="ml-container"><div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="ml-eyebrow">Our products</p><h2 className="mt-3 text-4xl font-extrabold tracking-tight">Tools designed to create value.</h2></div><Link href="/products" className="font-bold text-blue-700">View all →</Link></div><ProductsList products={products.slice(0,3)} /></div></section>;
}

export function FeaturedServices({ services }: { services: Service[] }) {
  return <section className="ml-section bg-slate-50"><div className="ml-container"><div className="mb-10"><p className="ml-eyebrow">Our services</p><h2 className="mt-3 text-4xl font-extrabold tracking-tight">From strategy to implementation.</h2></div><ServicesList services={services.slice(0,3)} /></div></section>;
}
