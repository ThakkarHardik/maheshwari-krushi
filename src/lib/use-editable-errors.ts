"use client";

import { useState } from "react";

type Errors = Record<string, string> | undefined;

/**
 * Hides a field's error as soon as the user edits that field, instead of
 * waiting for the next submit. A new errors object (next validation) shows
 * everything again. Form-level errors (`_form`) stay until then.
 */
export function useEditableErrors(source: Errors) {
  const [edited, setEdited] = useState<{ source: Errors; names: string[] }>({ source, names: [] });
  const names = edited.source === source ? edited.names : [];

  const visible = source
    ? Object.fromEntries(Object.entries(source).filter(([key]) => key === "_form" || !names.includes(key)))
    : undefined;

  function markEdited(event: React.FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name;
    if (name && source?.[name] && !names.includes(name)) setEdited({ source, names: [...names, name] });
  }

  return [visible && Object.keys(visible).length > 0 ? visible : undefined, markEdited] as const;
}
