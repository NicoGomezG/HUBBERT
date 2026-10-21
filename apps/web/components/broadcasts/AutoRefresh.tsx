"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Vuelve a pedir la página cada `ms` mientras `active` sea true (para ver avanzar un envío). */
export function AutoRefresh({ active, ms = 5_000 }: { active: boolean; ms?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [active, ms, router]);

  return null;
}
