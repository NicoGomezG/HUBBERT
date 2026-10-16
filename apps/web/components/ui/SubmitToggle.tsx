"use client";

import { useFormStatus } from "react-dom";
import { Toggle } from "./settings";

/** Toggle que envía el <form action> que lo contiene; mientras se procesa ya muestra el estado nuevo. */
export function SubmitToggle({ checked, label }: { checked: boolean; label: string }) {
  const { pending } = useFormStatus();
  return <Toggle type="submit" checked={pending ? !checked : checked} disabled={pending} label={label} />;
}
