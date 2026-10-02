import ServiceDetailPage from "../../../components/ServiceDetailPage";
import { servicePages } from "../../../lib/services";

export const metadata = {
  title: "Maintenance & Development — Meritlives LLC",
  description:
    "Ongoing website maintenance, application development, bug fixing, improvements and technical support.",
};

export default function Page() {
  return (
    <ServiceDetailPage
      service={servicePages["ongoing-maintenance"]}
    />
  );
}