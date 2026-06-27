import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Research Workspace V1",
  description: "A local-first research workspace for students and researchers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-6">
            <div className="mb-4">
              <SidebarTrigger />
            </div>
            {children}
          </main>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
