 "use client";

import { FormEvent, useState } from "react";
import { apiPost } from "../lib/api";

export default function NewsletterForm() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const result = await apiPost<{ message?: string }>("/newsletter", {
        email: form.get("email"),
        name: form.get("name"),
      });
      setMessage(result.message || "Subscription received.");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to subscribe.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <input name="name" placeholder="Name" className="rounded-xl border p-3" />
      <input name="email" required type="email" placeholder="Email address" className="rounded-xl border p-3" />
      <button type="submit" className="rounded-xl border px-5 py-3 font-medium">
        Subscribe
      </button>
      {message && <span className="sr-only" aria-live="polite">{message}</span>}
    </form>
  );
}
