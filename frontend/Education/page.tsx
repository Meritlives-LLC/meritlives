import ServiceDetailPage from "../../../components/ServiceDetailPage";
import { servicePages } from "../../../lib/services";

export const metadata = {
  title: "Education Management — Meritlives LLC",
  description:
    "Digital education management systems for students, institutions, staff, admissions, results and administration.",
};

export default function Page() {
  return <ServiceDetailPage service={servicePages.education} />;
}