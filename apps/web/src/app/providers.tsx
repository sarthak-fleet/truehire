"use client";

import { PostHogProvider } from "@saas-maker/posthog-client";
import { SessionProvider } from "next-auth/react";
import { useEffect, type ReactNode } from "react";

import { installBrowserMonitoring } from "@/lib/foundry-monitoring";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    return installBrowserMonitoring();
  }, []);

  return (
    <PostHogProvider
      apiKey="phc_qgiAarw4Co4pw9fz3Fxj4UJaHmqzFetqs4JrXhGc35Nd"
      host="https://us.i.posthog.com"
    >
      <SessionProvider>{children}</SessionProvider>
    </PostHogProvider>
  );
}
