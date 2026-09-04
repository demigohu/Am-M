import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Roboto_Slab } from "next/font/google";
import "./globals.css";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["500", "800"],
  variable: "--font-roboto-slab",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Am-M — Hire a DeFi agent. You keep the keys.",
  description:
    "Agent marketplace on BNB Chain. Pick a job, grant a bounded session, let the agent transact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body className={`${robotoSlab.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
