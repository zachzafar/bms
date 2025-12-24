import type { Metadata } from "next";
import { ThemeProvider } from "@/components/auth/theme-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "BookOS - Authentication & Admin",
  description: "Centralized authentication and administration for BookOS applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
  );
}
