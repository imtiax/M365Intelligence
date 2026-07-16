import type { Metadata } from "next";
import "./landing.css";
import "./landing-human.css";

export const metadata: Metadata = {
  title: "Aegis M365 Intelligence | Govern Microsoft 365 with confidence",
  description:
    "A unified Microsoft 365 intelligence, security, reporting, compliance, and governed automation platform for regulated enterprises.",
  openGraph: {
    title: "Aegis M365 Intelligence",
    description:
      "Turn Microsoft 365 signals into governed, evidence-ready action.",
    type: "website",
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
