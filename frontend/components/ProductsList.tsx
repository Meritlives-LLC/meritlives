import Link from "next/link";
import type { Product } from "../types/api";

export default function ProductsList({ products }: { products: Product[] }) {
  if (!products.length) {
    return <p>No products are available yet.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article key={product.id} className="rounded-2xl border p-6">
          {product.logo && (
            <img
              src={product.logo}
              alt={`${product.name} logo`}
              className="mb-5 h-16 w-auto object-contain"
            />
          )}
          <h2 className="text-xl font-semibold">{product.name}</h2>
          {product.short_description && (
            <p className="mt-2 opacity-75">{product.short_description}</p>
          )}
          <Link
            href={`/products/${product.slug}`}
            className="mt-5 inline-block font-medium underline"
          >
            {product.cta_text || "Learn More"}
          </Link>
        </article>
      ))}
    </div>
  );
}
