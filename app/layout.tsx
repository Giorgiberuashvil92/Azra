import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AZLA | მოდულური ERP პლატფორმა",
  description:
    "AZLA არის თანამედროვე ქართული მოდულური ERP და ბიზნესის მართვის პლატფორმა.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ka" className="h-full antialiased">
      <body className="flex min-h-full w-full flex-col">{children}</body>
    </html>
  );
}
