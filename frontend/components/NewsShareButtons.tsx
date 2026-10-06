"use client";

import { useEffect, useRef, useState } from "react";

type NewsShareButtonsProps = {
  title: string;
  url: string;
};

function shareUrl(base: string, values: Record<string, string>) {
  const url = new URL(base);
  url.search = new URLSearchParams(values).toString();
  return url.toString();
}

function ShareIcon({ name }: { name: "x" | "facebook" | "linkedin" | "whatsapp" | "link" | "check" }) {
  if (name === "x") {
    return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.3L5.7 22H2.6l7.3-8.4L2 2h6.3l4.4 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" /></svg>;
  }

  if (name === "facebook") {
    return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.019 10.125 11.926v-8.432H7.078v-3.494h3.047V9.41c0-3.007 1.792-4.677 4.533-4.677 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.49 0-1.955.931-1.955 1.886v2.266h3.328l-.532 3.494h-2.796V24C19.612 23.092 24 18.093 24 12.073Z" /></svg>;
  }

  if (name === "linkedin") {
    return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" /></svg>;
  }

  if (name === "whatsapp") {
    return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.3 11.7a8.3 8.3 0 0 1-12.3 7.25L3.5 20l1.1-4.3A8.3 8.3 0 1 1 20.3 11.7Z" /><path d="M8.3 7.8c.2-.4.4-.4.65-.4h.48c.2 0 .4.05.55.4l.7 1.65c.08.2.05.4-.08.55l-.5.58c-.15.17-.16.35-.04.55.36.58.82 1.1 1.35 1.55.5.43 1.04.78 1.62 1.04.2.1.4.07.55-.1l.6-.66c.15-.17.37-.22.58-.13l1.57.75c.25.12.38.27.36.45-.04.4-.2.75-.5 1.02-.46.43-1.1.64-1.9.59-1.12-.07-2.34-.65-3.72-1.78a12.8 12.8 0 0 1-2.9-3.28c-.67-1.09-.96-2.05-.89-2.87.04-.4.2-.8.47-1.2Z" /></svg>;
  }

  if (name === "check") {
    return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7" /></svg>;
  }

  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13.5a4.5 4.5 0 0 0 6.36 0l3.18-3.18a4.5 4.5 0 0 0-6.36-6.36L11.36 5.8" /><path d="M14 10.5a4.5 4.5 0 0 0-6.36 0l-3.18 3.18a4.5 4.5 0 0 0 6.36 6.36l1.82-1.82" /></svg>;
}

export default function NewsShareButtons({ title, url }: NewsShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const shares = [
    {
      label: "X",
      accessibleLabel: "Share on X",
      href: shareUrl("https://twitter.com/intent/tweet", { text: title, url }),
    },
    {
      label: "Facebook",
      accessibleLabel: "Share on Facebook",
      href: shareUrl("https://www.facebook.com/sharer/sharer.php", { u: url }),
    },
    {
      label: "LinkedIn",
      accessibleLabel: "Share on LinkedIn",
      href: shareUrl("https://www.linkedin.com/sharing/share-offsite/", { url }),
    },
    {
      label: "WhatsApp",
      accessibleLabel: "Share on WhatsApp",
      href: shareUrl("https://api.whatsapp.com/send", { text: `${title} ${url}` }),
    },
  ];

  async function copyArticleLink() {
    let success = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        success = true;
      }
    } catch {
      // Fall through to the legacy clipboard method for restricted contexts.
    }

    if (!success) {
      const input = document.createElement("textarea");
      input.value = url;
      input.readOnly = true;
      input.setAttribute("aria-hidden", "true");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();

      try {
        success = document.execCommand("copy");
      } catch {
        success = false;
      } finally {
        input.remove();
      }
    }

    if (success) {
      setCopied(true);
      setCopyMessage("Article link copied.");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        setCopyMessage("");
      }, 1800);
      return;
    }

    window.prompt("Copy article link:", url);
    setCopyMessage("Use the dialog to copy the article link.");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopyMessage(""), 4000);
  }

  const linkClassName = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-[#DDE2ED] bg-white p-2.5 text-[#0D0D0D] transition-colors hover:border-[#CC1111] hover:bg-[#F2F4F8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3BBF]";

  return (
    <section aria-label="Share this article" className="mt-5 border-b border-[#DDE2ED] pb-5 sm:mt-6 sm:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <h2 className="shrink-0 text-sm font-semibold text-[#0D0D0D]">Share this article</h2>
        <div className="grid w-full grid-cols-5 gap-2 sm:flex sm:flex-wrap">
          {shares.map((share) => (
            <a
              key={share.label}
              href={share.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={share.accessibleLabel}
              title={share.accessibleLabel}
              className={linkClassName}
            >
              <ShareIcon name={share.label === "X" ? "x" : share.label === "Facebook" ? "facebook" : share.label === "LinkedIn" ? "linkedin" : "whatsapp"} />
            </a>
          ))}
          <button
            type="button"
            onClick={copyArticleLink}
            aria-label="Copy article link"
            title="Copy article link"
            className={linkClassName}
          >
            <ShareIcon name={copied ? "check" : "link"} />
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{copyMessage}</p>
    </section>
  );
}
