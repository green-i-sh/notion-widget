import { useState } from "react";

/** Collapsed-by-default state for a widget's inline "add" form. */
export function useAddForm() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}
