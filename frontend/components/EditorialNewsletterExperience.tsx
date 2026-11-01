"use client";

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { dismissNewsletter, markPopupShown, popupSuppressed } from "../lib/newsletter-preferences";
const Popup = lazy(() => import("./EditorialNewsletterPopup"));
const desktop = () => window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches;
const blocked = () => document.visibilityState !== "visible" || !desktop() || !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"], form[aria-busy="true"]') || !!document.activeElement?.closest('form, input, textarea, select, [contenteditable="true"]');

export default function EditorialNewsletterExperience() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => { dismissNewsletter(); setOpen(false); }, []);
  useEffect(() => {
    setOpen(false);
    if (!/^\/(news|blog)(\/[^/]+)?\/?$/.test(pathname) || popupSuppressed()) return;
    let engaged = 0;
    let last = performance.now();
    let lastInteraction = 0;
    let scrolled = false;
    const interaction = () => { lastInteraction = performance.now(); };
    const scroll = () => { scrolled = true; interaction(); };
    const tick = () => {
      const now = performance.now();
      const elapsed = Math.min(now - last, 1500);
      last = now;
      if (blocked() || popupSuppressed()) return;
      if (lastInteraction && now - lastInteraction < 60000) engaged += elapsed;
      const article = document.querySelector("main article");
      const isArticle = /^\/(news|blog)\/[^/]+\/?$/.test(pathname);
      const rect = article?.getBoundingClientRect();
      const progress = rect && rect.height > window.innerHeight ? (window.innerHeight - rect.top) / rect.height : 0;
      if (engaged >= 45000 || (isArticle && scrolled && engaged >= 3000 && progress >= 0.6)) {
        markPopupShown();
        setOpen(true);
      }
    };
    const timer = window.setInterval(tick, 1000);
    window.addEventListener("pointerdown", interaction, { passive: true });
    window.addEventListener("keydown", interaction);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", interaction);
      window.removeEventListener("keydown", interaction);
      window.removeEventListener("scroll", scroll);
    };
  }, [pathname]);
  useEffect(() => {
    const storage = () => { if (popupSuppressed()) setOpen(false); };
    window.addEventListener("storage", storage);
    return () => { window.removeEventListener("storage", storage); };
  }, []);
  return open ? <Suspense fallback={null}><Popup onClose={close} /></Suspense> : null;
}
