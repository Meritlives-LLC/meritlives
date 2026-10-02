import { notFound } from "next/navigation";
import { getService } from "../../../lib/queries";

export default async function ServicePage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const result = await getService(params.slug);
    const service = result.data;

    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider">Service</p>
        <h1 className="mt-3 text-5xl font-bold">{service.name}</h1>
        {service.short_description && (
          <p className="mt-5 max-w-3xl text-xl opacity-75">{service.short_description}</p>
        )}
        {service.description && (
          <div
            className="prose mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: service.description }}
          />
        )}
      </main>
    );
  } catch {
    notFound();
  }
}
