import type { Metadata } from "next";
import "./globals.css";
import "./showcase.css";
import "./login.css";
import "./login-status.css";
import "./suite.css";
import "./search.css";
import "./product-studio.css";
import "./interactions.css";
import "./report-output.css";
import "./runtime.css";
import "./commercial.css";

export const metadata: Metadata = {
  title: "Aegis M365 | Command Center",
  description:
    "Private Microsoft 365 intelligence and security operations platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
