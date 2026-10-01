"use client";

import { startTransition } from "react";

/**
 * React 19 resets a <form action={...}> after every submission, which wipes
 * what the user typed when validation fails. Submitting through onSubmit
 * instead keeps the values; useActionState's `pending` still works.
 */
export function useFormSubmit(dispatch: (formData: FormData) => void) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };
}
