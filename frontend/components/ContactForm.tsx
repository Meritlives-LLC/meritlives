 "use client";

import { FormEvent, useState } from "react";
import { apiPost } from "../lib/api";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await apiPost<{ message?: string }>("/contact", payload);
      setState("success");
      setMessage(response.message || "Your message has been received.");
      event.currentTarget.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <input name="name" required placeholder="Name" className="w-full rounded-xl border p-3" />
      <input name="email" required type="email" placeholder="Email" className="w-full rounded-xl border p-3" />
      <input name="company" placeholder="Company" className="w-full rounded-xl border p-3" />
      <input name="subject" required placeholder="Subject" className="w-full rounded-xl border p-3" />
      <textarea name="message" required rows={7} placeholder="How can we help?" className="w-full rounded-xl border p-3" />
      <button
        type="submit"
        disabled={state === "sending"}
        className="rounded-xl border px-6 py-3 font-medium disabled:opacity-50"
      >
        {state === "sending" ? "Sending..." : "Send Message"}
      </button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
