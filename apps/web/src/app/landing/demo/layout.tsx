import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Explore Aegis | Guided synthetic demo",
  description:
    "Choose an enterprise persona and explore the Aegis Microsoft 365 operations platform using synthetic local data.",
  robots: { index: false, follow: false },
};

export default function GuidedDemoEntryLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
