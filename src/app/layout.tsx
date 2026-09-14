import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Execution Dashboard",
  description: "A focused daily planner for turning intentions into the next action.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}