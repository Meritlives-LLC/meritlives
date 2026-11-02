"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormSubmission } from "../lib/use-form-submission";
import FormFieldError from "./FormFieldError";
import type { Service } from "../types/api";
import modal from "./WebDevelopmentEnquiryModal.module.css";

type Props = { service?: Service };

const offerings = [
  { number: "01", title: "Business websites", description: "Clear, responsive websites that help customers understand your offer and take the next step." },
  { number: "02", title: "Custom web applications", description: "Purpose built tools shaped around your workflows, users and business requirements." },
  { number: "03", title: "E-commerce", description: "Online storefronts with thoughtful product discovery, checkout and operations in mind." },
  { number: "04", title: "Portals & learning platforms", description: "Secure spaces for members, teams, students and the information they need." },
  { number: "05", title: "CRM & ERP solutions", description: "Connected business systems that make everyday processes easier to manage." },
  { number: "06", title: "Maintenance & support", description: "Ongoing improvements, updates and practical technical support as your product grows." },
];

const benefits = [
  { title: "Responsive design", description: "Layouts adapt to the screens and contexts your customers use." },
  { title: "User experience", description: "Content and interactions are planned around what people need to do." },
  { title: "Maintainability", description: "Structured code helps teams understand and extend the product over time." },
  { title: "Performance", description: "We make practical choices to keep pages and workflows feeling efficient." },
  { title: "Security", description: "We consider data, access and common risks throughout the build." },
  { title: "Scalability", description: "Architecture is shaped to support future needs without overbuilding today." },
];

const developmentSteps = [
  { title: "Discovery", description: "Align on the goals, users, requirements and constraints." },
  { title: "Design", description: "Shape the information, journeys and interface before implementation." },
  { title: "Development", description: "Build the agreed experience in reviewable increments." },
  { title: "Testing", description: "Check key flows, responsive layouts and quality before release." },
  { title: "Launch", description: "Prepare the release and help bring the product online." },
  { title: "Support", description: "Continue improvements and maintenance as your needs change." },
];

const faqs = [
  { question: "What kind of web project can we discuss?", answer: "We can discuss business websites, custom web applications, e-commerce, portals and learning platforms, or improvements to an existing product. We will first understand the users, requirements and outcome you have in mind." },
  { question: "How long does a web development project take?", answer: "Timing depends on scope, integrations, content and review needs. After an initial conversation, we can clarify the work and agree on a realistic plan before development begins." },
  { question: "Can you maintain a website or application after launch?", answer: "Yes. We can discuss ongoing support, maintenance and product improvements based on your platform and team needs." },
  { question: "How do I get started?", answer: "Use the project enquiry form to tell us what you are trying to build or improve. We will review the details and follow up to understand the next steps." },
];

const technologies = ["Next.js", "React", "TypeScript", "Laravel", "PHP", "REST APIs"];

// Optional approved media can be configured in frontend/.env.local.
// NEXT_PUBLIC_WEB_DEVELOPMENT_VIDEO_URL and NEXT_PUBLIC_WEB_DEVELOPMENT_CAPTIONS_URL
const showcaseVideoUrl = process.env.NEXT_PUBLIC_WEB_DEVELOPMENT_VIDEO_URL?.trim();
const showcaseCaptionsUrl = process.env.NEXT_PUBLIC_WEB_DEVELOPMENT_CAPTIONS_URL?.trim();

export function ProjectEnquiryModal({ onClose, subject = "Web Development Project Enquiry" }: { onClose: () => void; subject?: string }) {
  const form = useFormSubmission("/contact");
  const sending = form.status === "sending";
  const { isPending } = form;
  const firstField = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const titleId = form.field("title").id;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstField.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isPending()) onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog.current) return;
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
      ));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, isPending]);

  const fields = [
    { name: "name", label: "Your name", required: true, maxLength: 150, autoComplete: "name", placeholder: "Full name" },
    { name: "email", label: "Work email", required: true, type: "email", maxLength: 255, autoComplete: "email", placeholder: "you@company.com" },
    { name: "company", label: "Company (optional)", maxLength: 150, autoComplete: "organization", placeholder: "Company or organisation" },
    { name: "phone", label: "Phone (optional)", type: "tel", maxLength: 40, autoComplete: "tel", placeholder: "Phone number" },
    { name: "subject", label: "What do you need?", required: true, maxLength: 200, defaultValue: subject },
    { name: "message", label: "A little about the project", required: true, maxLength: 10000, placeholder: "What would you like to build or improve?" },
  ];

  function renderField({ name, label, ...attributes }: typeof fields[number]) {
    const accessibility = form.field(name);
    return <div key={name}>
      <label htmlFor={accessibility.id} className={modal.label}>{label}</label>
      {name === "message"
        ? <textarea {...attributes} {...accessibility} name={name} rows={4} className={`${modal.input} ${modal.textarea}`} />
        : <input {...attributes} {...accessibility} ref={name === "name" ? firstField : undefined} name={name} className={modal.input} />}
      <FormFieldError id={accessibility["aria-describedby"]} messages={form.errors[name]} className={modal.fieldError} />
    </div>;
  }

  return (
    <div className={modal.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending()) onClose(); }}>
      <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={sending} className={`ml-enquiry-modal ${modal.dialog}`}>
        <div className={modal.accent} />
        <div className={modal.content}>
          <header className={modal.header}>
            <div>
              <p className={modal.eyebrow}>MERITLIVES / PROJECTS</p>
              <h2 id={titleId} className={modal.heading}>Let&apos;s talk about your project.</h2>
              <p className={modal.intro}>Share a few details and our team will follow up.</p>
            </div>
            <button type="button" onClick={onClose} disabled={sending} aria-label="Close enquiry form" className={modal.close}><span aria-hidden="true">&times;</span></button>
          </header>
          {form.status === "success" ? (
            <div className={modal.success}>
              <p className={modal.successTitle}>Enquiry received</p>
              <p ref={form.feedbackRef} role="status" tabIndex={-1} className={modal.feedback}>{form.feedback}</p>
              <button type="button" onClick={onClose} className={modal.secondaryButton}>Done</button>
            </div>
          ) : (
            <form onSubmit={form.submit} aria-label="Project enquiry" aria-busy={sending} className={modal.form}>
              <fieldset disabled={sending} className={modal.fields}>
                <legend className="sr-only">Your project and contact details</legend>
                <div className={modal.fieldGrid}>{fields.slice(0, 2).map(renderField)}</div>
                <div className={modal.fieldGrid}>{fields.slice(2, 4).map(renderField)}</div>
                {fields.slice(4).map(renderField)}
                <button type="submit" disabled={sending} className={modal.submit}>{sending ? "Sending enquiry..." : "Send project enquiry"}<span aria-hidden="true">&#8599;</span></button>
              </fieldset>
              {sending && <p role="status" className={modal.feedback}>Sending your enquiry. Please keep this window open.</p>}
              {form.feedback && <p ref={form.feedbackRef} tabIndex={-1} role="alert" className={modal.error}>{form.feedback}</p>}
              <p className={modal.privacy}>Your details are used to respond to this enquiry.</p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">{eyebrow}</p><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">{title}</h2>{children && <div className="mt-4 text-base leading-7 text-[#596273]">{children}</div>}</div>;
}

export default function WebDevelopmentPage({ service }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => {
    try { window.sessionStorage.setItem("ml-web-development-enquiry-shown", "1"); } catch {}
    setModalOpen(true);
  }, []);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("ml-web-development-enquiry-shown") === "1") return;
      const timer = window.setTimeout(() => {
        if (window.sessionStorage.getItem("ml-web-development-enquiry-shown") === "1") return;
        window.sessionStorage.setItem("ml-web-development-enquiry-shown", "1");
        setModalOpen(true);
      }, 10_000);
      return () => window.clearTimeout(timer);
    } catch {
      const timer = window.setTimeout(() => setModalOpen(true), 10_000);
      return () => window.clearTimeout(timer);
    }
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111827]">
      <section className="relative isolate overflow-hidden bg-[#faf9f7]">
        <div className="ml-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[.96fr_1.04fr] lg:gap-8 lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <p className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]"><span className="h-[2px] w-8 bg-[#d71920]" />Web development / Digital products</p>
            <h1 className="mt-6 font-[var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-[#111827] sm:text-6xl lg:text-[4.35rem]">We Build Digital Experiences That Move Businesses Forward.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#4b5563] sm:text-lg">We design and develop websites, applications and online platforms around the people who use them and the goals your business is working toward.</p>
            {service?.short_description && <p className="mt-3 max-w-xl text-sm leading-7 text-[#667085]">{service.short_description}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={openModal} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Start a Project <span aria-hidden="true">↗</span></button>
              <a href="#featured-projects" className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#d1d5db] bg-white px-6 py-3 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">View Our Portfolio <span aria-hidden="true">↓</span></a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[#667085]"><span>Designed around your users</span><span className="text-[#b9151b]">/</span><span>Built for practical needs</span><span className="text-[#b9151b]">/</span><span>Ready to evolve</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-2xl lg:-mr-12 lg:max-w-none">
            <div className="absolute -right-5 top-8 h-32 w-32 rounded-full bg-[#d71920]/[.08] blur-2xl sm:-right-8 sm:h-48 sm:w-48" />
            <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(17,24,39,.10)]">
              <Image src="/web-development-hero.png" alt="Conceptual artwork of responsive web and mobile interfaces, created for the MERITLIVES web development page" width={1536} height={1024} priority sizes="(max-width: 1024px) 100vw, 58vw" className="aspect-[1.48/1] w-full object-cover object-center" />
              <div className="absolute bottom-4 left-4 rounded-lg border border-[#e5e7eb] bg-white/95 px-4 py-3 shadow-sm sm:bottom-6 sm:left-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#b9151b]">Digital, made useful</p><p className="mt-1 text-sm font-semibold text-[#202938]">Websites · Platforms · Applications</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <SectionHeading eyebrow="What we build" title="Web solutions shaped around your work.">Start with a clear requirement. We can help scope the right website, platform or application for it.</SectionHeading>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((item) => <article key={item.number} className="group rounded-xl border border-[#e5e7eb] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#efb8ba] hover:shadow-[0_16px_40px_rgba(17,24,39,.07)] sm:p-7"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">{item.number}</span><span aria-hidden="true" className="text-lg text-[#c4c9d1] transition group-hover:translate-x-1 group-hover:text-[#d71920]">↗</span></div><h3 className="mt-7 text-xl font-semibold tracking-[-.02em] text-[#202938]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#596273]">{item.description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="video-showcase" className="scroll-mt-20 bg-[#f7f7f6] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
          <div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">A look behind the build</p><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">See How We Build</h2><p className="mt-5 max-w-lg text-base leading-8 text-[#596273]">A good build is a series of clear decisions: understand the need, shape the experience, then test and improve the details.</p>{showcaseVideoUrl ? <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#277547]"><span className="h-2 w-2 rounded-full bg-[#328b57]" />Video showcase available</p> : <p role="status" className="mt-6 inline-flex max-w-md items-start gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm leading-6 text-[#4b5563]"><span aria-hidden="true" className="mt-0.5 font-bold text-[#b9151b]">i</span><span>No approved MERITLIVES walkthrough is published yet. This section will play the configured showcase when one is available.</span></p>}</div>
          <div className="overflow-hidden rounded-2xl border border-[#e2e4e8] bg-white shadow-[0_18px_48px_rgba(17,24,39,.08)]">
            {showcaseVideoUrl ? <div className="aspect-video bg-[#f1f2f3]"><video className="h-full w-full" controls playsInline preload="none" poster="/web-development-hero.png"><source src={showcaseVideoUrl} />{showcaseCaptionsUrl && <track kind="captions" src={showcaseCaptionsUrl} srcLang="en" label="English captions" default />}Your browser does not support HTML video.</video></div> : <div className="relative aspect-video"><Image src="/web-development-hero.png" alt="Concept artwork used as a poster while a MERITLIVES project walkthrough is unavailable" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover object-center" /><div className="absolute inset-0 bg-[#111827]/40" /><div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center"><span className="grid h-14 w-14 place-items-center rounded-full border border-white/70 bg-white/15 text-[#ffffff] backdrop-blur"><svg aria-hidden="true" viewBox="0 0 24 24" className="ml-1 h-5 w-5 fill-current"><path d="M8 5v14l11-7z" /></svg></span><p className="mt-4 text-sm font-semibold text-[#ffffff]">Walkthrough video coming soon</p><p className="mt-1 text-xs text-[#ffffff]">No video is playing in this preview.</p></div></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-5 py-4 sm:px-6"><span className="text-xs font-semibold text-[#374151]">{showcaseVideoUrl ? "MERITLIVES web development walkthrough" : "Project showcase"}</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7a8290]">{showcaseVideoUrl ? "Controls enabled · No autoplay" : "Video source not configured"}</span></div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24"><div className="ml-container grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-16"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Built with care</p><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A stronger foundation for what comes next.</h2><p className="mt-5 max-w-md text-base leading-8 text-[#596273]">We make considered choices around people, performance and the day-to-day life of the product.</p></div><div className="grid gap-x-8 sm:grid-cols-2">{benefits.map((benefit, index) => <article key={benefit.title} className="border-t border-[#e5e7eb] py-5"><p className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#b9151b]">0{index + 1}</p><h3 className="mt-2 font-semibold text-[#202938]">{benefit.title}</h3><p className="mt-2 text-sm leading-6 text-[#596273]">{benefit.description}</p></article>)}</div></div></section>

      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24"><div className="ml-container"><div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Our process</p><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">From first question to launch and support.</h2><p className="mt-5 text-sm leading-7 text-[#596273]">Each stage gives us a chance to align, review and make thoughtful progress.</p></div><ol className="grid gap-3 sm:grid-cols-2">{developmentSteps.map((stage, index) => <li key={stage.title} className="flex gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">0{index + 1}</span><div><h3 className="font-semibold text-[#202938]">{stage.title}</h3><p className="mt-1.5 text-sm leading-6 text-[#596273]">{stage.description}</p></div></li>)}</ol></div></div></section>

      <section id="featured-projects" className="scroll-mt-20 py-16 sm:py-20 lg:py-24"><div className="ml-container"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Featured projects</p><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Work worth sharing, with context.</h2></div><p className="max-w-xl text-sm leading-7 text-[#596273]">We don&apos;t have approved public case studies or project screenshots to feature here yet. We&apos;ll add work when its details and imagery are cleared to share.</p></div><div className="mt-8 flex flex-col gap-5 rounded-2xl border border-dashed border-[#d1d5db] bg-[#fafafa] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff1f1] text-[#b9151b]"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]"><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></svg></span><div><p className="font-semibold text-[#202938]">A public project gallery is in the works.</p><p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#596273]">Until then, tell us about your requirements and we&apos;ll discuss relevant experience during the conversation.</p></div></div><button type="button" onClick={openModal} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-md border border-[#d71920] px-4 py-2.5 text-sm font-semibold text-[#b9151b] transition hover:bg-[#fff1f1] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d71920] sm:self-auto">Discuss a project <span aria-hidden="true">↗</span></button></div></div></section>

      <section className="bg-[#f7f7f6] py-16 sm:py-20"><div className="ml-container grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-16"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Technology</p><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827]">A practical, supported stack.</h2><p className="mt-4 max-w-md text-sm leading-7 text-[#596273]">Our current platform uses these technologies across its frontend, backend and API.</p></div><ul aria-label="Technologies used by MERITLIVES" className="flex flex-wrap content-center gap-3">{technologies.map((technology) => <li key={technology} className="rounded-full border border-[#e0e2e6] bg-white px-5 py-3 text-sm font-semibold text-[#374151] shadow-sm">{technology}</li>)}</ul></div></section>

      <section className="py-16 sm:py-20 lg:py-24"><div className="ml-container grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-16"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">Frequently asked questions</p><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A few helpful answers.</h2></div><div className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">{faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-[#202938] marker:hidden focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] [&::-webkit-details-marker]:hidden">{faq.question}<span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#d1d5db] text-[#b9151b] transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-1 pr-10 pt-3 text-sm leading-7 text-[#596273]">{faq.answer}</p></details>)}</div></div></section>

      <section className="bg-[#d71920] py-16 sm:py-20 lg:py-24"><div className="ml-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#ffffff]">Have a project in mind?</p><h2 className="mt-4 max-w-4xl font-[var(--font-heading)] text-4xl font-semibold leading-[1.02] tracking-[-.05em] text-[#ffffff] sm:text-5xl lg:text-6xl">Let&apos;s talk about what you want to build.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-[#ffffff]">Share the opportunity or challenge in front of you. We&apos;ll help you explore a practical next step.</p></div><button type="button" onClick={openModal} className="inline-flex min-h-12 w-fit items-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#b9151b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff3f3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start a Project <span aria-hidden="true">↗</span></button></div></section>
      {modalOpen && <ProjectEnquiryModal onClose={() => setModalOpen(false)} />}
    </main>
  );
}
