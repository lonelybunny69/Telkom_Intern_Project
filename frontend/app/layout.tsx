import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { DashboardProvider } from "../lib/dashboard-context";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Telkom Revenue Dashboard",
  description:
    "Dashboard analitik revenue Telkom — data SPK & transaksi 2020-2025.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
