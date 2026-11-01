"use client";

import { useFormSubmission } from "../lib/use-form-submission";
import FormFieldError from "./FormFieldError";

const fields = [
  { name: "name", label: "Name", required: true, maxLength: 150, autoComplete: "name" },
  { name: "email", label: "Email", required: true, maxLength: 255, autoComplete: "email", type: "email" },
  { name: "company", label: "Company (optional)", maxLength: 150, autoComplete: "organization" },
  { name: "subject", label: "Subject", required: true, maxLength: 200 },
  { name: "message", label: "How can we help?", required: true, maxLength: 10000 },
];

export default function ContactForm() {
  const form = useFormSubmission("/contact");
  const sending = form.status === "sending";
  const inputClass = "mt-2 block min-h-11 w-full min-w-0 rounded-xl border p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700";

  return (
    <form onSubmit={form.submit} aria-label="Contact us" aria-busy={sending} className="space-y-5">
      <fieldset disabled={sending} className="min-w-0 space-y-5 border-0 p-0">
        <legend className="sr-only">Your contact details and message</legend>
        {fields.map(({ name, label, ...attributes }) => {
          const accessibility = form.field(name);
          return (
            <div key={name}>
              <label htmlFor={accessibility.id} className="block text-sm font-medium">{label}</label>
              {name === "message"
                ? <textarea {...attributes} {...accessibility} name={name} rows={7} className={inputClass} />
                : <input {...attributes} {...accessibility} name={name} className={inputClass} />}
              <FormFieldError id={accessibility["aria-describedby"]} messages={form.errors[name]} />
            </div>
          );
        })}
        <button type="submit" disabled={sending} className="min-h-11 rounded-xl border px-6 py-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-50">
          {sending ? "Sending..." : "Send Message"}
        </button>
      </fieldset>
      {sending && <p role="status" className="text-sm">Sending your message. Please wait.</p>}
      {form.feedback && <p ref={form.feedbackRef} tabIndex={-1} role={form.status === "error" ? "alert" : "status"} className="text-sm">{form.feedback}</p>}
    </form>
  );
}
