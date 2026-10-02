import ServiceDetailPage from "../../../components/ServiceDetailPage";
import { servicePages } from "../../../lib/services";

export const metadata = {
  title: "Business Automation — Meritlives LLC",
  description:
    "Business automation, workflow systems, dashboards, CRM and operational technology solutions.",
};

export default function Page() {
  return (
    <ServiceDetailPage
      service={servicePages["business-automation"]}
    />
  );
}