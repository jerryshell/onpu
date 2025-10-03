"use client";

import { authClient } from "@/lib/auth-client";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="onpu-theme"
    >
      <AuthUIProvider
        authClient={authClient}
        navigate={router.push}
        replace={router.replace}
        onSessionChange={() => {
          router.refresh();
        }}
        social={{
          providers: ["github"],
        }}
        Link={Link}
      >
        {children}
      </AuthUIProvider>
    </ThemeProvider>
  );
}
