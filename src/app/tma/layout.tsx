import type { Metadata, Viewport } from "next";

import { TmaProvider } from "@/features/tma/ui/tma-provider";
import { TmaShell } from "@/features/tma/ui/tma-shell";

export const metadata: Metadata = {
  title: "ShelfLog Mini App",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function TmaLayout({ children }: { children: React.ReactNode }) {
  return (
    <TmaProvider>
      <TmaShell>{children}</TmaShell>
    </TmaProvider>
  );
}
