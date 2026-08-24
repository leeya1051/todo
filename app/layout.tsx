import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "할 일 관리",
  description:
    "일일 할 일을 주간 계획과 1년 목표에 연결하는 개인 업무 관리 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            <AppNav />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
