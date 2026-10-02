import ServiceDetailPage from "../../../components/ServiceDetailPage";
import { servicePages } from "../../../lib/services";

export const metadata = {
  title: "Real Estate Technology — Meritlives LLC",
  description:
    "Property platforms, listings, portals, property management and real estate technology solutions.",
};

export default function Page() {
  return <ServiceDetailPage service={servicePages["real-estate"]} />;
}