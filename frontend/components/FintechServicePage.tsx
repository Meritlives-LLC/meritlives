"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ProjectEnquiryModal } from "./WebDevelopmentPage";

const solutions = [
  { number: "01", title: "Digital payments", description: "Connect payment journeys to third-party providers and reflect their transaction statuses in your application." },
  { number: "02", title: "Digital financial platforms", description: "Build the digital services, account experiences and operational tools that support your financial product." },
  { number: "03", title: "Financial workflow automation", description: "Reduce repetitive handoffs with clear approval, transaction and exception workflows." },
  { number: "04", title: "Financial dashboards & reporting", description: "Bring relevant operational and financial information together for review and decision support." },
];

const integrations = [
  { title: "Payment gateway integration", detail: "Connect an application to a selected provider's documented API and supported payment flow." },
  { title: "API integration", detail: "Exchange the data your teams need with connected services and internal systems." },
  { title: "Transaction status workflows", detail: "Represent pending, completed, failed or reversed states clearly, based on provider responses." },
  { title: "Reconciliation support", detail: "Organise transaction records and exceptions to support review against provider or internal reports." },
  { title: "Reporting", detail: "Prepare useful views and exports around agreed data definitions and operational questions." },
];

const safeguards = [
  { title: "Authentication & access", detail: "Design sign-in and role-based access around the intended users and responsibilities." },
  { title: "Data protection", detail: "Limit, handle and transmit information according to the project requirements and chosen providers." },
  { title: "Validation & auditability", detail: "Validate inputs and make important actions and state changes easier to review." },
  { title: "Testing & maintainability", detail: "Exercise key workflows and build a structure teams can understand and maintain." },
];

const projectSteps = [
  { title: "Understand the business", detail: "Clarify the service, stakeholders, users and operational context." },
  { title: "Plan the solution", detail: "Define scope, integrations, data flows and delivery considerations." },
  { title: "Design", detail: "Map the customer journey and the staff workflows behind it." },
  { title: "Build & integrate", detail: "Develop the agreed interfaces, APIs and operational features." },
  { title: "Test & validate", detail: "Review expected flows, edge cases and provider responses." },
  { title: "Launch & support", detail: "Prepare the release and discuss the support needed after launch." },
];

const audiences = [
  "Businesses adding payments to digital services",
  "Organisations digitising financial workflows",
  "Startups developing fintech products",
  "Teams that need clearer financial reporting",
];

const questions = [
  { question: "Does MERITLIVES process or hold customer funds?", answer: "No. MERITLIVES builds software and integrations. Payment processing, custody and settlement remain with the payment provider or financial institution you select." },
  { question: "Can you connect our product to a payment gateway?", answer: "We can assess a provider's available APIs and integration requirements, then scope a connection for your application. The provider's eligibility, commercial terms and supported capabilities still apply." },
  { question: "Can you integrate with our existing systems?", answer: "Potentially. We first review the systems, available interfaces, data requirements and operational constraints to determine a suitable integration approach." },
  { question: "How do you approach security and compliance?", answer: "We can implement project-appropriate authentication, access control, validation, data handling and audit features. Regulatory obligations and independent compliance reviews must be assessed with your qualified advisers; we do not claim certification." },
  { question: "What should we prepare before getting started?", answer: "A useful starting point is your customer or staff workflow, the systems or providers involved, the information you need to manage, and the outcome you want to improve. We can clarify the rest together." },
];

const technologies = ["Next.js", "React", "TypeScript", "Laravel", "PHP", "REST APIs"];

// Configure an approved video and optional captions in frontend/.env.local.
// NEXT_PUBLIC_FINTECH_SHOWCASE_VIDEO_URL and NEXT_PUBLIC_FINTECH_SHOWCASE_CAPTIONS_URL
const videoUrl = process.env.NEXT_PUBLIC_FINTECH_SHOWCASE_VIDEO_URL?.trim();
const captionsUrl = process.env.NEXT_PUBLIC_FINTECH_SHOWCASE_CAPTIONS_URL?.trim();

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">{children}</p>;
}

export default function FintechServicePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111827]">
      <section className="bg-[#faf9f7]">
        <div className="ml-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[.98fr_1.02fr] lg:gap-10 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Fintech &amp; financial technology</Eyebrow>
            <h1 className="mt-5 font-[var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-[#111827] sm:text-6xl lg:text-[4.25rem]">Building Smarter Financial Experiences.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#4b5563] sm:text-lg">MERITLIVES helps businesses plan and implement digital financial technology, integrations and workflows around the way they serve customers and operate.</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#667085]">From payment journeys and financial platforms to automation and reporting, we focus on practical software that connects people, providers and business processes.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={openModal} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-[#ffffff] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Discuss Your Fintech Project <span aria-hidden="true">↗</span></button>
              <a href="#fintech-solutions" className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#d1d5db] bg-white px-6 py-3 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Explore solutions <span aria-hidden="true">↓</span></a>
            </div>
            <p className="mt-7 text-xs leading-6 text-[#667085]">Software and integration services. Financial services remain with the providers and institutions you choose.</p>
          </div>
          <div className="relative mx-auto w-full max-w-2xl lg:-mr-10 lg:max-w-none">
            <div className="absolute -right-6 top-8 h-36 w-36 rounded-full bg-[#d71920]/[.08] blur-2xl sm:h-48 sm:w-48" />
            <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(17,24,39,.10)]">
              <Image src="/fintech-service-hero.png" alt="Conceptual fintech artwork showing a phone, contactless terminal and abstract financial dashboard" width={1536} height={1024} priority sizes="(max-width: 1024px) 100vw, 56vw" className="aspect-[1.48/1] w-full object-cover" />
              <div className="absolute bottom-4 left-4 rounded-lg border border-[#e5e7eb] bg-white/95 px-4 py-3 shadow-sm sm:bottom-6 sm:left-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#b9151b]">Connected financial workflows</p><p className="mt-1 text-sm font-semibold text-[#202938]">Payments · Platforms · Reporting</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="fintech-solutions" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <div className="max-w-2xl"><Eyebrow>Fintech solutions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Digital financial tools for real workflows.</h2><p className="mt-4 text-base leading-7 text-[#596273]">We help shape the software around the service, the people using it and the systems it needs to connect with.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {solutions.map((solution) => <article key={solution.number} className="group rounded-xl border border-[#e5e7eb] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#efb8ba] hover:shadow-[0_16px_40px_rgba(17,24,39,.07)] sm:p-8"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">{solution.number}</span><span aria-hidden="true" className="text-lg text-[#c4c9d1] transition group-hover:translate-x-1 group-hover:text-[#d71920]">↗</span></div><h3 className="mt-8 text-xl font-semibold tracking-[-.02em] text-[#202938]">{solution.title}</h3><p className="mt-3 max-w-xl text-sm leading-7 text-[#596273]">{solution.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div><Eyebrow>Integrations &amp; operations</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Connect the steps behind each transaction.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">A payment flow involves more than a button. We consider the provider connection, the status updates and the records your team needs to review.</p></div>
          <ol className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">
            {integrations.map((item, index) => <li key={item.title} className="grid gap-3 py-5 sm:grid-cols-[52px_1fr]"><span className="font-mono text-xs font-semibold text-[#b9151b]">0{index + 1}</span><div><h3 className="font-semibold text-[#202938]">{item.title}</h3><p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#596273]">{item.detail}</p></div></li>)}
          </ol>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div><Eyebrow>Security &amp; reliability</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Consider the details that make systems dependable.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">Controls and review are shaped to the product, the data it handles and the requirements agreed for the project. No software approach can promise zero risk or replace the compliance advice your organisation needs.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">{safeguards.map((item, index) => <article key={item.title} className="rounded-xl border border-[#e5e7eb] bg-white p-6"><span className="font-mono text-[10px] font-bold tracking-[.12em] text-[#b9151b]">PRACTICE / 0{index + 1}</span><h3 className="mt-4 font-semibold text-[#202938]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#596273]">{item.detail}</p></article>)}</div>
          </div>
        </div>
      </section>

      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div><Eyebrow>Development process</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A considered path from need to launch.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">We work through the business context, product experience and technical connections before preparing for release.</p></div>
          <ol className="grid gap-3 sm:grid-cols-2">{projectSteps.map((step, index) => <li key={step.title} className="flex gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">0{index + 1}</span><div><h3 className="font-semibold text-[#202938]">{step.title}</h3><p className="mt-1.5 text-sm leading-6 text-[#596273]">{step.detail}</p></div></li>)}</ol>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
          <div><Eyebrow>Video showcase</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">See a fintech workflow in action.</h2><p className="mt-5 max-w-lg text-base leading-8 text-[#596273]">We looked for an approved MERITLIVES fintech demo in the local media and published video catalogue, but none is available to show yet.</p><p role="status" className="mt-5 inline-flex max-w-lg rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-4 py-3 text-sm leading-6 text-[#4b5563]">This section will play an approved demonstration when a video is configured. The image is illustrative and no video is currently playing.</p></div>
          <div className="overflow-hidden rounded-2xl border border-[#e2e4e8] bg-white shadow-[0_18px_48px_rgba(17,24,39,.08)]">
            {videoUrl ? <div className="aspect-video bg-[#f1f2f3]"><video className="h-full w-full" controls playsInline preload="none" poster="/fintech-service-hero.png"><source src={videoUrl} />{captionsUrl && <track kind="captions" src={captionsUrl} srcLang="en" label="English captions" default />}Your browser does not support HTML video.</video></div> : <div className="relative aspect-video"><Image src="/fintech-service-hero.png" alt="Illustrative fintech artwork shown instead of an unavailable product video" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /><div className="absolute inset-0 bg-[#111827]/35" /><div className="absolute inset-0 flex items-end p-5 sm:p-7"><p className="max-w-sm rounded-lg border border-white/30 bg-[#111827]/75 px-4 py-3 text-sm font-medium text-[#ffffff] backdrop-blur-sm">No approved fintech product or workflow video is currently available.</p></div></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-5 py-4 sm:px-6"><span className="text-xs font-semibold text-[#374151]">{videoUrl ? "MERITLIVES fintech walkthrough" : "Fintech product showcase"}</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7a8290]">{videoUrl ? "Controls enabled · No autoplay" : "No video source configured"}</span></div>
          </div>
        </div>
      </section>

      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div><Eyebrow>Who we help</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">For teams making financial services more useful.</h2></div>
          <ul className="grid gap-3 sm:grid-cols-2">{audiences.map((audience, index) => <li key={audience} className="flex items-start gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff1f1] text-sm font-semibold text-[#b9151b]">0{index + 1}</span><span className="pt-1 text-sm font-medium leading-6 text-[#374151]">{audience}</span></li>)}</ul>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
          <div><Eyebrow>Frequently asked questions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A few things to know.</h2></div>
          <div className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">{questions.map((item) => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-[#202938] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] [&::-webkit-details-marker]:hidden">{item.question}<span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#d1d5db] text-[#b9151b] transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-1 pr-10 pt-3 text-sm leading-7 text-[#596273]">{item.answer}</p></details>)}</div>
        </div>
      </section>

      <section className="bg-[#d71920] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><Eyebrow>Have a fintech project in mind?</Eyebrow><h2 className="mt-4 max-w-4xl font-[var(--font-heading)] text-4xl font-semibold leading-[1.02] tracking-[-.05em] text-[#ffffff] sm:text-5xl lg:text-6xl">Discuss Your Fintech Project.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-[#ffffff]">Tell us about the service, workflows and systems you are looking to connect. We can help clarify a practical starting point.</p></div><button type="button" onClick={openModal} className="inline-flex min-h-12 w-fit items-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#b9151b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff3f3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Discuss Your Fintech Project <span aria-hidden="true">↗</span></button></div>
      </section>
      {modalOpen && <ProjectEnquiryModal subject="Fintech Project Enquiry" onClose={() => setModalOpen(false)} />}
    </main>
  );
}
