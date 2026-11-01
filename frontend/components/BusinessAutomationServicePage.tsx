"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ProjectEnquiryModal } from "./WebDevelopmentPage";

const solutions = [
  { icon: "workflow", title: "Workflow Automation", description: "Connect routine steps, approvals and follow-ups into workflows shaped around your process." },
  { icon: "message", title: "Messaging & Notifications", description: "Connect supported messaging channels to relevant alerts, reminders and customer updates." },
  { icon: "integration", title: "Application Integration", description: "Move agreed information between applications when their APIs and access permissions support it." },
  { icon: "spark", title: "AI-Assisted Automation", description: "Explore focused AI assistance for suitable tasks, with review and human oversight where needed." },
  { icon: "people", title: "Customer Communication", description: "Coordinate enquiry acknowledgements, status updates and follow-ups across customer touchpoints." },
  { icon: "report", title: "Monitoring & Reporting", description: "Make workflow status, exceptions and activity easier for teams to monitor and review." },
];

const useCases = [
  "Route incoming enquiries to the right person or system.",
  "Send notifications and reminders at useful points in a process.",
  "Synchronise selected data between supported applications.",
  "Coordinate routine approvals and follow-ups.",
  "Reduce repeated data entry and manual hand-offs.",
];

const automationSteps = [
  { title: "Discover", description: "Understand the process, people, tools and outcomes involved." },
  { title: "Map", description: "Document steps, decision points, exceptions and data needs." },
  { title: "Integrate", description: "Confirm available APIs, permissions and provider requirements." },
  { title: "Automate", description: "Implement the agreed workflow and communication logic." },
  { title: "Test", description: "Validate expected paths, edge cases and failure handling." },
  { title: "Improve", description: "Use feedback and workflow observations to guide refinements." },
];

const audiences = [
  "Small and medium-sized businesses",
  "Sales and customer support teams",
  "Educational institutions and training providers",
  "Service businesses managing appointments and enquiries",
  "Organisations connecting multiple software platforms",
];

const faqs = [
  { question: "What types of business processes can you automate?", answer: "We can assess repeatable tasks such as enquiry routing, notifications, approvals, follow-ups and data hand-offs. We first review the process and decide what is suitable to automate." },
  { question: "Can you integrate messaging tools into existing systems?", answer: "Potentially. Integrations depend on the messaging provider's APIs, account permissions, available features and your existing systems. We confirm those requirements before agreeing on scope." },
  { question: "Can automation connect our CRM and website?", answer: "It may be possible where the CRM and website expose suitable APIs or integration options and the required access is available. We assess the data flow and permissions first." },
  { question: "Can AI be used in business automation?", answer: "AI assistance can be considered for suitable tasks, such as categorising or summarising information. Use cases need clear review rules, data handling and human oversight where decisions require it." },
  { question: "How do we get started?", answer: "Describe a repetitive process, the applications involved, who participates and what outcome you want. We can then assess feasibility and outline a practical scope." },
];

// Configure an approved demonstration and optional captions in frontend/.env.local.
// NEXT_PUBLIC_BUSINESS_AUTOMATION_VIDEO_URL and NEXT_PUBLIC_BUSINESS_AUTOMATION_CAPTIONS_URL
const videoUrl = process.env.NEXT_PUBLIC_BUSINESS_AUTOMATION_VIDEO_URL?.trim();
const captionsUrl = process.env.NEXT_PUBLIC_BUSINESS_AUTOMATION_CAPTIONS_URL?.trim();
const SESSION_KEY = "ml-business-automation-enquiry-shown";

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">{children}</p>;
}

function SolutionIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    workflow: <><rect x="3" y="4" width="7" height="6" rx="1" /><rect x="14" y="14" width="7" height="6" rx="1" /><path d="M10 7h3a2 2 0 0 1 2 2v5M14 17h-3a2 2 0 0 1-2-2v-5" /></>,
    message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h8M8 14h5" /></>,
    integration: <><circle cx="6" cy="12" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="m9 11 6-4M9 13l6 4" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6" /></>,
    report: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /><circle cx="19" cy="7" r="1" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function BusinessAutomationServicePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => {
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    setModalOpen(true);
  }, []);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") return;
      const timer = window.setTimeout(() => {
        if (window.sessionStorage.getItem(SESSION_KEY) === "1") return;
        window.sessionStorage.setItem(SESSION_KEY, "1");
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
      {/* Hero */}
      <section className="bg-[#faf9f7]">
        <div className="ml-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[.98fr_1.02fr] lg:gap-10 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Business automation &amp; messaging tools</Eyebrow>
            <h1 className="mt-5 font-[var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-[#111827] sm:text-6xl lg:text-[4.2rem]">Work Smarter. Automate More. Grow Faster.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#4b5563] sm:text-lg">We help businesses reduce repetitive work, connect digital tools, and automate everyday operations through intelligent workflows, messaging integrations, and business process automation.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={openModal} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-[#ffffff] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Automate Your Business <span aria-hidden="true">&rarr;</span></button>
              <a href="#automation-solutions" className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#d1d5db] bg-white px-6 py-3 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Explore Our Solutions <span aria-hidden="true">&darr;</span></a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-2xl lg:-mr-10 lg:max-w-none">
            <div className="absolute -right-6 top-8 h-36 w-36 rounded-full bg-[#d71920]/[.08] blur-2xl sm:h-48 sm:w-48" />
            <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(17,24,39,.10)]">
              <Image src="/business-automation-hero.png" alt="Conceptual illustration of connected business apps, messages and workflow steps" width={1536} height={1024} priority sizes="(max-width: 1024px) 100vw, 56vw" className="aspect-[1.48/1] w-full object-cover" />
              <div className="absolute bottom-4 left-4 rounded-lg border border-[#e5e7eb] bg-white/95 px-4 py-3 shadow-sm sm:bottom-6 sm:left-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#b9151b]">Workflows, connected</p><p className="mt-1 text-sm font-semibold text-[#202938]">People - Tools - Processes</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="automation-solutions" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <div className="max-w-2xl"><Eyebrow>Our business automation solutions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Make everyday operations flow more smoothly.</h2><p className="mt-4 text-base leading-7 text-[#596273]">We assess your process and applications first, then scope practical automation around the integrations and permissions available.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((solution) => <article key={solution.title} className="group rounded-xl border border-[#e5e7eb] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#efb8ba] hover:shadow-[0_16px_40px_rgba(17,24,39,.07)] sm:p-7"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff1f1] text-[#b9151b]"><SolutionIcon name={solution.icon} /></span><h3 className="mt-6 text-lg font-semibold tracking-[-.02em] text-[#202938]">{solution.title}</h3><p className="mt-3 text-sm leading-7 text-[#596273]">{solution.description}</p></article>)}
          </div>
        </div>
      </section>

      {/* Operations use cases */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[1.04fr_.96fr] lg:gap-16">
          <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_20px_55px_rgba(17,24,39,.09)]">
            <Image src="/business-automation-operations.png" alt="Colleagues discussing connected digital workflows on a laptop" width={1536} height={1024} sizes="(max-width: 1024px) 100vw, 50vw" className="aspect-[1.42/1] w-full object-cover" />
            <span className="absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-xs font-semibold text-[#374151] shadow-sm sm:bottom-5 sm:left-5">Illustrative business setting</span>
          </div>
          <div><Eyebrow>Connect your tools. Simplify your operations.</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Spend less time moving work by hand.</h2><p className="mt-5 text-base leading-8 text-[#596273]">Thoughtful automation can coordinate routine steps while keeping people informed and exceptions visible.</p><ul className="mt-7 space-y-4">{useCases.map((useCase) => <li key={useCase} className="flex items-start gap-3 text-sm leading-6 text-[#374151]"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#d71920]" />{useCase}</li>)}</ul></div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div><Eyebrow>How we automate your business</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A clear path from process to improvement.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">We look at the full workflow, including permissions, data movement and what should happen when a step needs attention.</p></div>
          <ol className="grid gap-3 sm:grid-cols-2">{automationSteps.map((step, index) => <li key={step.title} className="flex gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">0{index + 1}</span><div><h3 className="font-semibold text-[#202938]">{step.title}</h3><p className="mt-1.5 text-sm leading-6 text-[#596273]">{step.description}</p></div></li>)}</ol>
        </div>
      </section>

      {/* Video showcase */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
          <div><Eyebrow>Video showcase</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">See Automation in Action</h2><p className="mt-5 max-w-lg text-base leading-8 text-[#596273]">A workflow demonstration can show how applications and notifications work together. {videoUrl ? "An approved demonstration is configured below." : "We couldnÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢t find an approved MERITLIVES automation video to feature yet."}</p><p role="status" className="mt-5 inline-flex max-w-lg rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm leading-6 text-[#4b5563]">This dashboard visual is conceptual artwork, not a live product screenshot.{videoUrl ? " Use the player controls to view the configured demonstration." : " No video is currently playing."}</p></div>
          <div className="overflow-hidden rounded-2xl border border-[#e2e4e8] bg-white shadow-[0_18px_48px_rgba(17,24,39,.08)]">
            {videoUrl ? <div className="aspect-video bg-[#f1f2f3]"><video className="h-full w-full" controls playsInline preload="none" poster="/business-automation-video-poster.png"><source src={videoUrl} />{captionsUrl && <track kind="captions" src={captionsUrl} srcLang="en" label="English captions" default />}Your browser does not support HTML video.</video></div> : <div className="relative aspect-video"><Image src="/business-automation-video-poster.png" alt="Conceptual workflow automation dashboard illustration used as a video poster" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /><div className="absolute inset-0 bg-[#111827]/35" /><div className="absolute inset-0 flex items-end p-5 sm:p-7"><p className="max-w-sm rounded-lg border border-white/30 bg-[#111827]/75 px-4 py-3 text-sm font-medium text-[#ffffff] backdrop-blur-sm">No approved business automation demonstration is available.</p></div></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-5 py-4 sm:px-6"><span className="text-xs font-semibold text-[#374151]">{videoUrl ? "MERITLIVES automation walkthrough" : "Business automation showcase"}</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7a8290]">{videoUrl ? "Controls enabled - No autoplay" : "No video source configured"}</span></div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div><Eyebrow>Who can benefit?</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">For teams coordinating work across people and tools.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">The right opportunities depend on your processes, platforms and the way your team works today.</p></div>
          <ul className="grid gap-3 sm:grid-cols-2">{audiences.map((audience, index) => <li key={audience} className="flex items-start gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff1f1] text-sm font-semibold text-[#b9151b]">0{index + 1}</span><span className="pt-1 text-sm font-medium leading-6 text-[#374151]">{audience}</span></li>)}</ul>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
          <div><Eyebrow>Frequently asked questions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A few things to consider.</h2></div>
          <div className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">{faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-[#202938] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] [&::-webkit-details-marker]:hidden">{faq.question}<span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#d1d5db] text-[#b9151b] transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-1 pr-10 pt-3 text-sm leading-7 text-[#596273]">{faq.answer}</p></details>)}</div>
        </div>
      </section>

      {/* Final project CTA */}
      <section className="bg-[#d71920] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><Eyebrow>Ready to automate your business?</Eyebrow><h2 className="mt-4 max-w-4xl font-[var(--font-heading)] text-4xl font-semibold leading-[1.02] tracking-[-.05em] text-[#ffffff] sm:text-5xl lg:text-6xl">Ready to Automate Your Business?</h2><p className="mt-5 max-w-2xl text-base leading-7 text-[#ffffff]">Tell us about your current workflow, the applications and communication channels involved, and the outcome you want. We can help identify a practical next step.</p></div><button type="button" onClick={openModal} className="inline-flex min-h-12 w-fit items-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#b9151b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff3f3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Automate Your Business <span aria-hidden="true">&rarr;</span></button></div>
      </section>

      {modalOpen && <ProjectEnquiryModal subject="Business Automation Project Enquiry" onClose={() => setModalOpen(false)} />}
    </main>
  );
}
