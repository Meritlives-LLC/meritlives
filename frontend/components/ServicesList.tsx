import Image from "next/image";
import Link from "next/link";
import type { Service } from "../types/api";
import { featuredServices, otherServices, type CatalogueService } from "../lib/service-catalogue";
import AdditionalServices from "./AdditionalServices";

function ServiceLink({ service }: { service: CatalogueService }) {
  return <Link href={service.href} style={{ color: "#ffffff" }} className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-[#ffffff] transition hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] motion-reduce:transition-none">Explore Service<span className="sr-only">: {service.title}</span><span aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none">&rarr;</span></Link>;
}

export default function ServicesList({ services, pagination, unavailable = false }: {
  services: Service[];
  pagination?: { current_page?: number; last_page?: number };
  unavailable?: boolean;
}) {
  return <>
    <div aria-label="Featured services">
      {featuredServices.map((service, index) => <section key={service.slug} data-service={service.slug} aria-labelledby={`service-${service.slug}`} className={`border-t border-[#eceef1] py-14 sm:py-20 lg:py-24 ${index % 2 ? "bg-[#fafafa]" : "bg-white"}`}>
        <div className="ml-container grid items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-16">
          <div className={`relative min-w-0 overflow-hidden rounded-xl bg-[#f1f2f3] ${index % 2 ? "md:order-2" : ""}`}>
            <Image src={service.image} alt={service.imageAlt} width={1600} height={1067} priority={index === 0} sizes="(max-width: 767px) 100vw, 50vw" className="aspect-[4/3] w-full object-cover" style={{ objectPosition: service.imagePosition || "center" }} />
          </div>
          <div className={`min-w-0 ${index % 2 ? "md:order-1" : ""}`}>
            <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">0{index + 1} / {service.title}</p>
            <h2 id={`service-${service.slug}`} className="mt-4 font-[var(--font-heading)] text-3xl font-semibold leading-[1.12] tracking-[-.045em] text-[#111827] sm:text-4xl lg:text-5xl">{service.title}</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#596273]">{service.description}</p>
            <ul className="mt-6 space-y-3">{service.capabilities.map(capability => <li key={capability} className="flex items-start gap-3 text-sm leading-7 text-[#374151]"><svg aria-hidden="true" viewBox="0 0 20 20" className="mt-1 h-5 w-5 shrink-0 fill-none stroke-[#d71920] stroke-2"><path d="m4 10 4 4 8-8" /></svg>{capability}</li>)}</ul>
            <ServiceLink service={service} />
          </div>
        </div>
      </section>)}
    </div>

    <section aria-labelledby="other-services-title" className="border-t border-[#eceef1] bg-white py-14 sm:py-20 lg:py-24">
      <div className="ml-container">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Built around your next step</p>
        <h2 id="other-services-title" className="mt-4 max-w-3xl font-[var(--font-heading)] text-3xl font-semibold leading-tight tracking-[-.04em] text-[#111827] sm:text-4xl lg:text-5xl">More ways we help you move forward.</h2>
        <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {otherServices.map(service => <article key={service.slug} data-service={service.slug} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#d71920]/40 hover:shadow-[0_12px_35px_rgba(17,24,39,.06)] focus-within:border-[#d71920] focus-within:shadow-[0_12px_35px_rgba(17,24,39,.06)] motion-reduce:transform-none motion-reduce:transition-none">
            <div className="overflow-hidden bg-[#f1f2f3]"><Image src={service.image} alt={service.imageAlt} width={800} height={600} sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw" className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none" style={{ objectPosition: service.imagePosition || "center" }} /></div>
            <div className="flex flex-1 flex-col p-6"><h3 className="text-xl font-semibold leading-7 tracking-[-.025em] text-[#111827]">{service.title}</h3><p className="mb-5 mt-3 text-sm leading-7 text-[#596273]">{service.description}</p><Link href={service.href} style={{ color: "#b9151b" }} className="mt-auto inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-[#b9151b] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Explore Service<span className="sr-only">: {service.title}</span><span aria-hidden="true">&rarr;</span></Link></div>
          </article>)}
        </div>
        <p className="mt-6 text-xs leading-6 text-[#667085]">Illustrative stock photography. People pictured are not presented as MERITLIVES staff or customers.</p>
      </div>
    </section>
    <AdditionalServices key={`${pagination?.current_page ?? 0}-${unavailable}`} services={services} pagination={pagination} unavailable={unavailable} />
  </>;
}
