"use client";

import { AppRecovery } from "@/components/app-recovery";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0 }}><AppRecovery retry={reset} /></body></html>;
}
