import "./portal.css";
import { ReporterPortal } from "@/components/ReporterPortal";

export const metadata = {
  title: "Reporter 360 | M365 Intelligence",
  description: "Microsoft 365 reporting, auditing, and alerting workspace for customer-controlled deployments.",
};

export default function PortalPage() {
  return <ReporterPortal />;
}
