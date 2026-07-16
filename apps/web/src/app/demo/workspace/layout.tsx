import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Synthetic product demo | Aegis M365 Intelligence',
  robots: { index: false, follow: false, nocache: true },
};

export default function PublicDemoWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
