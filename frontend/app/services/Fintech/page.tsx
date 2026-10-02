import ServiceDetailPage from "../../../components/ServiceDetailPage";
import { servicePages } from "../../../lib/services";

export const metadata = {
  title: "Fintech & Trading Systems — Meritlives LLC",
  description:
    "Financial technology, payment systems, transaction platforms and trading-related digital solutions.",
};

export default function Page() {
  return <ServiceDetailPage service={servicePages.fintech} />;
}