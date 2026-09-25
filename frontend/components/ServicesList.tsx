import Link from "next/link";
import type { Service } from "../types/api";

export default function ServicesList({ services }: { services: Service[] }) {
  if (!services.length) return <p>No services are available yet.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <article key={service.id} className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">{service.name}</h2>
          {service.short_description && (
            <p className="mt-2 opacity-75">{service.short_description}</p>
          )}
          <Link href={`/services/${service.slug}`} className="mt-5 inline-block underline">
            Explore Service
          </Link>
        </article>
      ))}
    </div>
  );
}
