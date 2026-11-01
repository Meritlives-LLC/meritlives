"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ApiError, apiPost, type FieldErrors } from "./api";

type Status = "idle" | "sending" | "success" | "error";
type Receipt = { data?: { id?: number; status?: string }; message?: string };

export function useFormSubmission(endpoint: "/contact" | "/newsletter") {
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const pending = useRef(false);
  const mounted = useRef(true);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const prefix = useId();
  const isPending = useCallback(() => pending.current, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (status === "success" || status === "error") feedbackRef.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    // React clears event.currentTarget after dispatch; retain the element before awaiting.
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    pending.current = true;
    setStatus("sending");
    setFeedback("");
    setErrors({});
    try {
      const receipt = await apiPost<Receipt>(endpoint, payload);
      const expected = endpoint === "/contact" ? "received" : "subscribed";
      if (!receipt || receipt.data?.status !== expected || !Number.isInteger(receipt.data.id) || receipt.data.id! <= 0) {
        throw new Error("We could not confirm the submission. Your details have been kept. Please contact us before trying again.");
      }
      if (!mounted.current) return;
      form.reset();
      setFeedback((typeof receipt.message === "string" && receipt.message.trim() ? receipt.message : undefined) || (endpoint === "/contact" ? "Your enquiry has been received." : "Your subscription has been confirmed."));
      setStatus("success");
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof ApiError && error.status === 422) {
        setErrors(error.errors);
        setFeedback(Object.keys(error.errors).length ? "Please correct the highlighted fields and submit again." : "Please check your details and submit again.");
      } else if (error instanceof ApiError && error.status === 429) {
        setFeedback("Too many requests. Please wait before trying again. Your details have been kept.");
      } else if (error instanceof ApiError) {
        setFeedback("We could not confirm your submission. Your details have been kept. Please try again later or contact us.");
      } else {
        setFeedback("We could not confirm your submission. Your details have been kept. Please check your connection or contact us before trying again.");
      }
      setStatus("error");
    } finally {
      pending.current = false;
    }
  }

  function field(name: string) {
    return {
      id: `${prefix}-${name}`,
      "aria-invalid": errors[name]?.length ? true as const : undefined,
      "aria-describedby": errors[name]?.length ? `${prefix}-${name}-error` : undefined,
    };
  }

  return { status, feedback, errors, submit, field, feedbackRef, isPending };
}
