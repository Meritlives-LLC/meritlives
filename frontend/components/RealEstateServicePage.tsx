"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { ProjectEnquiryModal } from "./WebDevelopmentPage";

const solutions = [
  { icon: "website", title: "Real Estate Websites & Property Listings", description: "Present property information in a clear, responsive experience that teams can manage and visitors can explore." },
  { icon: "management", title: "Property Management Systems", description: "Scope tools for property records, maintenance requests, tenancy workflows and day-to-day operations." },
  { icon: "search", title: "Property Search & Enquiry Platforms", description: "Help visitors filter listings, find relevant properties and send enquiries through a simple journey." },
  { icon: "portals", title: "Agent and Tenant Portals", description: "Create role-appropriate access to updates, documents and operational tasks for agents and tenants." },
  { icon: "automation", title: "Real Estate Workflow Automation", description: "Coordinate enquiry routing, follow-ups and routine property workflows around your process." },
  { icon: "analytics", title: "Property Reporting & Analytics", description: "Bring agreed property and operational information together for review and decision support." },
];

const useCases = [
  "Manage property information and listings in an organised system.",
  "Route property enquiries to the right agent or team.",
  "Support tenant and agent communication across agreed channels.",
  "Track maintenance requests and operational workflows.",
  "Organise property-related reporting for teams and managers.",
];

const deliverySteps = [
  { title: "Discover business needs", description: "Understand your properties, users, processes and current systems." },
  { title: "Define the solution", description: "Agree on scope, capabilities, data needs and integration dependencies." },
  { title: "Design the user experience", description: "Plan clear experiences for customers, agents, tenants and staff." },
  { title: "Develop and integrate", description: "Build the agreed platform and connect supported systems where appropriate." },
  { title: "Test and validate", description: "Check key journeys, data handling, permissions and edge cases." },
  { title: "Launch and improve", description: "Prepare the release and use feedback to shape future improvements." },
];

const audiences = [
  "Real estate agencies and brokers",
  "Property developers",
  "Property management companies",
  "Landlords and rental operators",
  "Commercial property businesses",
];

const faqs = [
  { question: "Can you build a real estate website with property listings?", answer: "Yes. We can scope a responsive website with listing pages, property details and enquiry journeys based on your content, workflows and requirements." },
  { question: "Can you develop a property management platform?", answer: "We can assess the operations you need to support and scope a custom platform for suitable property records, requests, communications and reporting. The final feature set depends on your needs." },
  { question: "Can customers enquire about properties online?", answer: "Yes. An online enquiry form can collect relevant details and route them to an agreed team or system. Any connection depends on the tools and interfaces available." },
  { question: "Can you integrate existing business systems?", answer: "Potentially. We review the systems, APIs, data access and provider requirements before confirming an integration approach." },
  { question: "How do we get started?", answer: "Tell us about your property business, the features you need, existing systems and the outcomes you want. We can use that information to discuss a practical scope." },
];

// Configure an approved demonstration and optional captions in frontend/.env.local.
// NEXT_PUBLIC_REAL_ESTATE_SHOWCASE_VIDEO_URL and NEXT_PUBLIC_REAL_ESTATE_SHOWCASE_CAPTIONS_URL
const videoUrl = process.env.NEXT_PUBLIC_REAL_ESTATE_SHOWCASE_VIDEO_URL?.trim();
const captionsUrl = process.env.NEXT_PUBLIC_REAL_ESTATE_SHOWCASE_CAPTIONS_URL?.trim();

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">{children}</p>;
}

function SolutionIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    website: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5M7 13h4M7 16h7" /></>,
    management: <><path d="M3 20h18M5 20V8l7-4 7 4v12M9 12h.01M15 12h.01M9 16h.01M15 16h.01" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5M8 10h5M10.5 7.5v5" /></>,
    portals: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 5h5v8h-5zM18.5 13v3" /></>,
    automation: <><rect x="3" y="4" width="7" height="6" rx="1" /><rect x="14" y="14" width="7" height="6" rx="1" /><path d="M10 7h3a2 2 0 0 1 2 2v5M14 17h-3a2 2 0 0 1-2-2v-5" /></>,
    analytics: <><path d="M4 20V5M4 20h17" /><path d="m7 15 4-4 3 2 5-6" /><circle cx="19" cy="7" r="1" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function RealEstateServicePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111827]">
      {/* Hero */}
      <section className="bg-[#faf9f7]">
        <div className="ml-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[.98fr_1.02fr] lg:gap-10 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Real estate technology</Eyebrow>
            <h1 className="mt-5 font-[var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-[#111827] sm:text-6xl lg:text-[4.15rem]">Smarter Technology for Modern Real Estate.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#4b5563] sm:text-lg">We help real estate businesses improve property discovery, streamline property operations, and deliver better digital experiences through modern websites, property platforms, and connected business systems.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={openModal} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] motion-reduce:transition-none">Discuss Your Real Estate Project <span aria-hidden="true">&rarr;</span></button>
              <a href="#real-estate-solutions" className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#d1d5db] bg-white px-6 py-3 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] motion-reduce:transition-none">Explore Our Solutions <span aria-hidden="true">&darr;</span></a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-2xl lg:-mr-8 lg:max-w-none">
            <div className="absolute -right-6 top-8 h-36 w-36 rounded-full bg-[#d71920]/[.08] blur-2xl sm:h-48 sm:w-48" />
            <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(17,24,39,.10)]">
              <Image src="/real-estate-hero.png" alt="Conceptual property platform displayed beside modern residential buildings" width={1536} height={1024} priority sizes="(max-width: 1024px) 100vw, 55vw" className="aspect-[1.48/1] w-full object-cover" />
              <span className="absolute bottom-4 left-4 rounded-lg border border-[#e5e7eb] bg-white/95 px-4 py-3 text-xs font-semibold text-[#374151] shadow-sm sm:bottom-6 sm:left-6">Conceptual real estate technology visual</span>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="real-estate-solutions" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <div className="max-w-2xl"><Eyebrow>Real estate technology solutions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Digital tools for property discovery and operations.</h2><p className="mt-4 text-base leading-7 text-[#596273]">We scope websites, platforms and integrations around your property business, existing systems and user needs.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((solution) => <article key={solution.title} className="group rounded-xl border border-[#e5e7eb] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#efb8ba] hover:shadow-[0_16px_40px_rgba(17,24,39,.07)] sm:p-7 motion-reduce:transition-none"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff1f1] text-[#b9151b]"><SolutionIcon name={solution.icon} /></span><h3 className="mt-6 text-lg font-semibold tracking-[-.02em] text-[#202938]">{solution.title}</h3><p className="mt-3 text-sm leading-7 text-[#596273]">{solution.description}</p></article>)}
          </div>
        </div>
      </section>

      {/* Property operations */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[1.04fr_.96fr] lg:gap-16">
          <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_20px_55px_rgba(17,24,39,.09)]">
            <Image src="/real-estate-operations.png" alt="Real estate professionals reviewing property information on a tablet in a modern apartment" width={1536} height={1024} sizes="(max-width: 1024px) 100vw, 50vw" className="aspect-[1.42/1] w-full object-cover" />
            <span className="absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-xs font-semibold text-[#374151] shadow-sm sm:bottom-5 sm:left-5">Illustrative property setting</span>
          </div>
          <div><Eyebrow>Connect properties, people and operations</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Bring property work into clearer view.</h2><p className="mt-5 text-base leading-8 text-[#596273]">Thoughtful digital systems can help teams coordinate information and communication across property discovery, management and day-to-day operations.</p><ul className="mt-7 space-y-4">{useCases.map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#374151]"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#d71920]" />{item}</li>)}</ul></div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div><Eyebrow>How we deliver</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A clear path from business need to launch.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">We clarify business goals, users and dependencies, then validate the experience and core workflows as the solution takes shape.</p></div>
          <ol className="grid gap-3 sm:grid-cols-2">{deliverySteps.map((step, index) => <li key={step.title} className="flex gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">0{index + 1}</span><div><h3 className="font-semibold text-[#202938]">{step.title}</h3><p className="mt-1.5 text-sm leading-6 text-[#596273]">{step.description}</p></div></li>)}</ol>
        </div>
      </section>

      {/* Video showcase */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
          <div><Eyebrow>Video showcase</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">See Real Estate Technology in Action.</h2><p className="mt-5 max-w-lg text-base leading-8 text-[#596273]">A walkthrough can show how listings, property management and operational workflows connect. {videoUrl ? "An approved real estate demonstration is configured below." : "No approved MERITLIVES real estate walkthrough is available yet."}</p>{videoUrl ? <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#277547]"><span className="h-2 w-2 rounded-full bg-[#328b57]" />Video showcase available</p> : <p role="status" className="mt-5 inline-flex max-w-lg rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm leading-6 text-[#4b5563]">Video walkthrough coming soon. Configure an approved video with <code className="mx-1 rounded bg-[#f3f4f6] px-1.5 py-0.5 text-xs">NEXT_PUBLIC_REAL_ESTATE_SHOWCASE_VIDEO_URL</code> in frontend/.env.local.</p>}<p className="mt-3 text-xs leading-6 text-[#667085]">The dashboard image is conceptual artwork, not a real product screenshot. No video plays until an approved source is configured.</p></div>
          <div className="overflow-hidden rounded-2xl border border-[#e2e4e8] bg-white shadow-[0_18px_48px_rgba(17,24,39,.08)]">
            {videoUrl ? <div className="aspect-video bg-[#f1f2f3]"><video className="h-full w-full" controls playsInline preload="none" poster="/real-estate-video-poster.png"><source src={videoUrl} />{captionsUrl && <track kind="captions" src={captionsUrl} srcLang="en" label="English captions" default />}Your browser does not support HTML video.</video></div> : <div className="relative aspect-video"><Image src="/real-estate-video-poster.png" alt="Conceptual property listings and management dashboard on a laptop, used as the video poster" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /><div className="absolute inset-0 bg-[#111827]/25" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#111827]/80 to-transparent p-5 pt-14 sm:p-7 sm:pt-16"><p className="text-sm font-semibold text-white">Property platform walkthrough</p><p className="mt-1 text-xs text-white/85">Video walkthrough coming soon</p></div></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-5 py-4 sm:px-6"><span className="text-xs font-semibold text-[#374151]">Real estate technology showcase</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7a8290]">{videoUrl ? "Controls enabled · No autoplay" : "No video source configured"}</span></div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div><Eyebrow>Who we help</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Technology shaped around your property business.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">The right tools depend on your portfolio, people and the way your operations work today.</p></div>
          <ul className="grid gap-3 sm:grid-cols-2">{audiences.map((audience, index) => <li key={audience} className="flex items-start gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff1f1] text-sm font-semibold text-[#b9151b]">0{index + 1}</span><span className="pt-1 text-sm font-medium leading-6 text-[#374151]">{audience}</span></li>)}</ul>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
          <div><Eyebrow>Frequently asked questions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A few things to consider.</h2></div>
          <div className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">{faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-[#202938] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] [&::-webkit-details-marker]:hidden">{faq.question}<span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#d1d5db] text-[#b9151b] transition group-open:rotate-45 motion-reduce:transition-none">+</span></summary><p className="max-w-2xl pb-1 pr-10 pt-3 text-sm leading-7 text-[#596273]">{faq.answer}</p></details>)}</div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#d71920] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><Eyebrow>Start a conversation</Eyebrow><h2 className="mt-4 max-w-4xl font-[var(--font-heading)] text-4xl font-semibold leading-[1.02] tracking-[-.05em] text-white sm:text-5xl lg:text-6xl">Ready to Modernise Your Real Estate Business?</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white">Tell us about your property business, the features you need, existing systems and goals. We can help identify a practical next step.</p></div><button type="button" onClick={openModal} className="inline-flex min-h-12 w-fit items-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#b9151b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff3f3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none">Discuss Your Project <span aria-hidden="true">&rarr;</span></button></div>
      </section>

      {modalOpen && <ProjectEnquiryModal subject="Real Estate Technology Project Enquiry" onClose={() => setModalOpen(false)} />}
    </main>
  );
}
