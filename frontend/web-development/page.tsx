import ServiceDetailPage from "../../../components/ServiceDetailPage";
import { servicePages } from "../../../lib/services";

export const metadata = {
  title: "Web & SaaS Development — Meritlives LLC",
  description:
    "Websites, SaaS platforms, web applications, portals and digital products built by Meritlives.",
};

export default function Page() {
  return <ServiceDetailPage service={servicePages["web-development"]} />;
}