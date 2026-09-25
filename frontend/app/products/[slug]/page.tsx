import { notFound } from "next/navigation";
import { getProduct } from "../../../lib/queries";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const result = await getProduct(params.slug);
    const product = result.data;

    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider">Product</p>
        <h1 className="mt-3 text-5xl font-bold">{product.name}</h1>
        {product.short_description && (
          <p className="mt-5 max-w-3xl text-xl opacity-75">{product.short_description}</p>
        )}
        {product.description && (
          <div
            className="prose mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}
        {product.features?.length ? (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Features</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {product.features.map((feature) => (
                <div key={feature.id} className="rounded-2xl border p-5">
                  <h3 className="font-semibold">{feature.name}</h3>
                  {feature.description && (
                    <p className="mt-2 opacity-75">{feature.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    );
  } catch {
    notFound();
  }
}
