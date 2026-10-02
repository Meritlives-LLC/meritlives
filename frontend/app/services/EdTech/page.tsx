import ServiceDetailPage from "../../../components/ServiceDetailPage";
import { servicePages } from "../../../lib/services";

export const metadata = {
  title: "EdTech & E-Learning — Meritlives LLC",
  description:
    "Learning management systems, online academies, course platforms and digital education solutions.",
};

export default function Page() {
  return <ServiceDetailPage service={servicePages.edtech} />;
}