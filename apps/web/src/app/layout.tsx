import type { Metadata } from "next";
import "./globals.css";
import "./login.css";

export const metadata: Metadata = {
  title: "Aegis M365 | Reporter 360",
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
