"use client";

import { useFormSubmission } from "../lib/use-form-submission";
import FormFieldError from "./FormFieldError";
import { newsletterSubscribed } from "../lib/newsletter-preferences";
import { useEffect } from "react";

export default function NewsletterForm({ emailOnly = false, buttonLabel = "Subscribe" }: { emailOnly?: boolean; buttonLabel?: string }) {
  const form = useFormSubmission("/newsletter");
  const sending = form.status === "sending";
  useEffect(() => { if (form.status === "success") newsletterSubscribed(); }, [form.status]);

  return (
    <form onSubmit={form.submit} aria-label="Newsletter subscription" aria-busy={sending} className="space-y-3">
      <fieldset disabled={sending} className="flex min-w-0 flex-col gap-3 border-0 p-0 sm:flex-row sm:items-start">
        <legend className="sr-only">Newsletter subscription details</legend>
        {([{ name: "name", label: "Name (optional)", maxLength: 150, autoComplete: "name", required: false, type: "text" },
          { name: "email", label: "Email address", maxLength: 255, autoComplete: "email", required: true, type: "email" }] as const).filter(field => !emailOnly || field.name === "email").map(({ name, label, ...attributes }) => {
          const accessibility = form.field(name);
          return <div key={name} className="min-w-0 flex-1">
            <label htmlFor={accessibility.id} className="block text-sm font-medium">{label}</label>
            <input {...attributes} {...accessibility} name={name} placeholder={name === "email" ? "Enter your email address" : undefined} className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-[#8892A4] bg-white p-3 text-[#0D0D0D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" />
            <FormFieldError id={accessibility["aria-describedby"]} messages={form.errors[name]} />
          </div>;
        })}
        <button type="submit" disabled={sending} className="min-h-11 shrink-0 rounded-xl bg-[#D71920] px-5 py-3 font-medium text-[#FFFFFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-50 sm:mt-7">
          {sending ? "Subscribing..." : buttonLabel}
        </button>
      </fieldset>
      {sending && <p role="status" className="text-sm">Confirming your subscription. Please wait.</p>}
      {form.feedback && <p ref={form.feedbackRef} tabIndex={-1} role={form.status === "error" ? "alert" : "status"} className="text-sm">{form.feedback}</p>}
    </form>
  );
}
