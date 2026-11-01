"use client";

import { useEffect, useId, useRef } from "react";
import NewsletterForm from "./NewsletterForm";

export default function EditorialNewsletterPopup({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current!;
    element.showModal();
    const focusable = () => Array.from(element.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
    )).filter(target => target.getClientRects().length > 0);
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const targets = focusable();
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (!first || !last) { event.preventDefault(); element.focus(); return; }
      if (!element.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !element.contains(event.target)) focusable()[0]?.focus();
    };
    document.addEventListener("keydown", trapTab);
    document.addEventListener("focusin", containFocus);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", trapTab);
      document.removeEventListener("focusin", containFocus);
      element.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialog} aria-labelledby={title} aria-describedby={description} aria-modal="true" onCancel={event => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-[#DDE2ED] bg-white p-6 text-[#0D0D0D] shadow-xl backdrop:bg-black/35 sm:p-10">
    <button type="button" autoFocus onClick={onClose} aria-label="Close newsletter" className="float-right -mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl focus-visible:outline-2 focus-visible:outline-[#D71920]">&times;</button>
    <p className="pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D71920]">MERITLIVES INSIGHTS</p>
    <h2 id={title} className="mt-5 clear-both text-3xl font-semibold leading-tight tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Great ideas deserve to be shared.</h2>
    <p id={description} className="mb-7 mt-4 leading-7 text-[#4B5260]">Join readers exploring technology, AI, business innovation and the future of digital products.</p>
    <NewsletterForm emailOnly buttonLabel="Get the latest insights" />
    <p className="mt-5 text-sm leading-6 text-[#4B5260]">No spam. Unsubscribe anytime. <a href="/privacy" className="underline underline-offset-4">Privacy Policy</a></p>
  </dialog>;
}
