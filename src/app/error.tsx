"use client";

import { AppRecovery } from "@/components/app-recovery";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <AppRecovery retry={reset} />;
}
