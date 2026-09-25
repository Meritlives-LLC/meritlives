import ProductsList from "../../components/ProductsList";
import ApiError from "../../components/ApiError";
import { getProducts } from "../../lib/queries";

export const metadata = {
  title: "Products | MERITLIVES LLC",
  description: "Explore MERITLIVES products.",
};

export default async function ProductsPage() {
  try {
    const result = await getProducts();
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <header className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider">Products</p>
          <h1 className="mt-2 text-4xl font-bold">Solutions built for practical impact.</h1>
        </header>
        <ProductsList products={result.data} />
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <ApiError message={error instanceof Error ? error.message : undefined} />
      </main>
    );
  }
}
