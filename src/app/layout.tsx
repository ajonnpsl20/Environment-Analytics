import type { Metadata } from "next";
import { Public_Sans, Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EnviroHub",
    template: "%s · EnviroHub",
  },
  description:
    "Collect, validate, and analyze multi-site environmental performance data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Browser extensions inject attributes (bis_register, __processed_*) onto
          <body> before hydration; suppress the resulting attribute mismatch. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
