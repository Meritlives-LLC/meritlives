import { notFound } from "next/navigation";
import { getService } from "../../../lib/queries";
import WebDevelopmentPage from "../../../components/WebDevelopmentPage";
import FintechServicePage from "../../../components/FintechServicePage";
import EdTechServicePage from "../../../components/EdTechServicePage";
import EducationServicePage from "../../../components/EducationServicePage";
import BusinessAutomationServicePage from "../../../components/BusinessAutomationServicePage";
import RealEstateServicePage from "../../../components/RealEstateServicePage";

export default async function ServicePage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromise;
  if (params.slug.toLowerCase() === "web-development") {
    // The existing page remains available even when its optional CMS copy is unavailable.
    const result = await getService("web-development").catch(() => null);
    return <WebDevelopmentPage service={result?.data} />;
  }

  if (params.slug.toLowerCase() === "fintech") {
    return <FintechServicePage />;
  }

  if (params.slug.toLowerCase() === "edtech") {
    return <EdTechServicePage />;
  }

  if (params.slug.toLowerCase() === "education") {
    return <EducationServicePage />;
  }

  if (params.slug.toLowerCase() === "business-automation") {
    return <BusinessAutomationServicePage />;
  }

  if (params.slug.toLowerCase() === "real-estate") {
    return <RealEstateServicePage />;
  }

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
