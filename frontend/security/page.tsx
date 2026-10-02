import ServiceDetailPage from "../../../components/ServiceDetailPage";
import { servicePages } from "../../../lib/services";

export const metadata = {
  title: "Security & Hardening — Meritlives LLC",
  description:
    "Practical security reviews, website hardening, access controls and application security improvements.",
};

export default function Page() {
  return <ServiceDetailPage service={servicePages.security} />;
}