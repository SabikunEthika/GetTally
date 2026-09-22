import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GetTally — Voice-first order manager",
  description: "Track social selling orders, returns, and profit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
