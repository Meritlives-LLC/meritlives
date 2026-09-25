import ServicesList from "../../components/ServicesList";
import ApiError from "../../components/ApiError";
import { getServices } from "../../lib/queries";

export const metadata = {
  title: "Services | MERITLIVES LLC",
  description: "Explore MERITLIVES services.",
};

export default async function ServicesPage() {
  try {
    const result = await getServices();
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <header className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider">Services</p>
          <h1 className="mt-2 text-4xl font-bold">Technology, digital and innovation services.</h1>
        </header>
        <ServicesList services={result.data} />
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
