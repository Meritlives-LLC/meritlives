"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { ProjectEnquiryModal } from "./WebDevelopmentPage";

const solutions = [
  { icon: "admission", title: "Online Admission Management", description: "Shape applicant forms, review steps and communications around your institution's admissions process." },
  { icon: "portals", title: "Student & Staff Portals", description: "Give each institutional group access to relevant information, tasks and updates." },
  { icon: "academic", title: "Academic Administration", description: "Organise records, departments, courses, sessions and semesters around your academic structure." },
  { icon: "results", title: "Result Processing & Reporting", description: "Support result entry, review, processing and reporting with suitable validation and permissions." },
  { icon: "fees", title: "Fee & Payment Workflow Integration", description: "Connect fee-related records and status updates with supported third-party payment services where appropriate." },
  { icon: "dashboard", title: "Institutional Dashboards", description: "Bring agreed operational information together for staff review and institutional reporting." },
];

const operations = [
  "Manage applicants and admission steps in one defined workflow.",
  "Give staff and students role-appropriate portal access.",
  "Coordinate academic records and result review processes.",
  "Connect existing school systems where suitable APIs and data access are available.",
];

const steps = [
  { title: "Discover", description: "Understand institutional roles, existing tools and the workflows staff need to manage." },
  { title: "Design", description: "Plan system structure, user journeys, access and information needs." },
  { title: "Develop", description: "Build the agreed portal features and integrations in practical stages." },
  { title: "Validate", description: "Review workflows, permissions, data handling and edge cases with stakeholders." },
  { title: "Launch", description: "Prepare the release and support a considered transition into use." },
  { title: "Improve", description: "Use feedback and operational needs to guide future refinements." },
];

// Add an approved institutional administration video and optional captions in frontend/.env.local.
// NEXT_PUBLIC_EDUCATION_SHOWCASE_VIDEO_URL and NEXT_PUBLIC_EDUCATION_SHOWCASE_CAPTIONS_URL
const videoUrl = process.env.NEXT_PUBLIC_EDUCATION_SHOWCASE_VIDEO_URL?.trim();
const captionsUrl = process.env.NEXT_PUBLIC_EDUCATION_SHOWCASE_CAPTIONS_URL?.trim();

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">{children}</p>;
}

function SolutionIcon({ name }: { name: string }) {
  const iconPaths: Record<string, ReactNode> = {
    admission: <><path d="M8 3h8l4 4v14H4V3h4Z" /><path d="M14 3v5h6M8 13h8M8 17h5" /><path d="M9 9h.01" /></>,
    portals: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M17 11h4M19 9v4" /></>,
    academic: <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 11v5c3 3 7 3 10 0v-5M21 9v6" /></>,
    results: <><path d="M4 20V5M4 20h17" /><path d="m7 15 4-4 3 2 5-6" /><circle cx="19" cy="7" r="1" /></>,
    fees: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    dashboard: <><rect x="3" y="4" width="8" height="7" rx="1" /><rect x="13" y="4" width="8" height="4" rx="1" /><rect x="13" y="10" width="8" height="10" rx="1" /><rect x="3" y="13" width="8" height="7" rx="1" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

export default function EducationServicePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111827]">
      {/* Hero */}
      <section className="bg-[#faf9f7]">
        <div className="ml-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[.98fr_1.02fr] lg:gap-10 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Education &amp; portal management</Eyebrow>
            <h1 className="mt-5 font-[var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-[#111827] sm:text-6xl lg:text-[4.1rem]">Manage Your Institution with Smarter Digital Systems.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#4b5563] sm:text-lg">MERITLIVES helps educational institutions digitise administrative and academic workflows through student portals, admission systems, records management, result processing and integrated institutional platforms.</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#667085]">We scope each system around existing policies, roles and tools. Features are planned to fit your institution rather than assumed to be a ready-made product.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={openModal} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] motion-reduce:transition-none">Discuss Your Education Project <span aria-hidden="true">&rarr;</span></button>
              <a href="#education-solutions" className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#d1d5db] bg-white px-6 py-3 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] motion-reduce:transition-none">Explore Solutions <span aria-hidden="true">&darr;</span></a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-2xl lg:-mr-8 lg:max-w-none">
            <div className="absolute -right-6 top-8 h-36 w-36 rounded-full bg-[#d71920]/[.08] blur-2xl sm:h-48 sm:w-48" />
            <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(17,24,39,.10)]">
              <Image src="/education-portal-hero.png" alt="Conceptual campus scene with an administrator and student reviewing an institutional portal" width={1536} height={1024} priority sizes="(max-width: 1024px) 100vw, 55vw" className="aspect-[1.48/1] w-full object-cover" />
              <span className="absolute bottom-4 left-4 rounded-lg border border-[#e5e7eb] bg-white/95 px-4 py-3 text-xs font-semibold text-[#374151] shadow-sm sm:bottom-6 sm:left-6">Illustrative institutional setting</span>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="education-solutions" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <div className="max-w-2xl"><Eyebrow>Education &amp; portal management solutions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Support the systems behind your institution.</h2><p className="mt-4 text-base leading-7 text-[#596273]">We plan administrative platforms around your processes, access needs and existing tools. The features below are areas we can scope together.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((solution) => <article key={solution.title} className="group rounded-xl border border-[#e5e7eb] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#efb8ba] hover:shadow-[0_16px_40px_rgba(17,24,39,.07)] sm:p-7 motion-reduce:transition-none"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff1f1] text-[#b9151b]"><SolutionIcon name={solution.icon} /></span><h3 className="mt-6 text-lg font-semibold tracking-[-.02em] text-[#202938]">{solution.title}</h3><p className="mt-3 text-sm leading-7 text-[#596273]">{solution.description}</p></article>)}
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-6 text-[#667085]">MERITLIVES develops software and integrations. Payment processing, settlement and other financial services remain with the third-party providers or institutions you select.</p>
        </div>
      </section>

      {/* Institutional operations */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[1.04fr_.96fr] lg:gap-16">
          <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_20px_55px_rgba(17,24,39,.09)]">
            <Image src="/education-operations.png" alt="University staff reviewing institutional records together on a tablet" width={1536} height={1024} sizes="(max-width: 1024px) 100vw, 50vw" className="aspect-[1.42/1] w-full object-cover" />
            <span className="absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-xs font-semibold text-[#374151] shadow-sm sm:bottom-5 sm:left-5">Conceptual institutional operations scene</span>
          </div>
          <div><Eyebrow>Institutional operations</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Bring academic administration into clearer workflows.</h2><p className="mt-5 text-base leading-8 text-[#596273]">A well-scoped institutional system can help staff coordinate admissions, records, results and everyday administrative work across the tools they already use.</p><ul className="mt-7 space-y-4">{operations.map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#374151]"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#d71920]" />{item}</li>)}</ul></div>
        </div>
      </section>

      {/* Cross-link to EdTech */}
      <section className="py-12 sm:py-14">
        <div className="ml-container grid gap-6 rounded-2xl border border-[#f0c5c7] bg-[#fff8f8] p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><Eyebrow>Digital learning delivery</Eyebrow><h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] text-[#111827] sm:text-4xl">Need a Digital Learning Platform?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#596273]">MERITLIVES also supports LMS platforms, online courses, digital assessments and virtual learning.</p></div>
          <Link href="/services/EdTech" className="inline-flex min-h-11 w-fit items-center gap-3 rounded-md border border-[#d71920] bg-white px-5 py-2.5 text-sm font-semibold text-[#b9151b] transition hover:bg-[#fff1f1] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d71920] motion-reduce:transition-none">Explore EdTech services <span aria-hidden="true">&rarr;</span></Link>
        </div>
      </section>

      {/* Education portal video */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
          <div><Eyebrow>Institutional portal showcase</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Explore an Education Portal</h2><p className="mt-5 max-w-lg text-base leading-8 text-[#596273]">A walkthrough can show how admissions, student records, result processing and school dashboards fit into an institutional workflow.</p>{videoUrl ? <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#277547]"><span className="h-2 w-2 rounded-full bg-[#328b57]" />Approved administration video configured</p> : <p role="status" className="mt-5 inline-flex max-w-lg rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm leading-6 text-[#4b5563]">Video walkthrough coming soon. Add an approved administration video URL in <code className="mx-1 rounded bg-[#f3f4f6] px-1.5 py-0.5 text-xs">NEXT_PUBLIC_EDUCATION_SHOWCASE_VIDEO_URL</code> in frontend/.env.local.</p>}<p className="mt-3 text-xs leading-6 text-[#667085]">The portal image is conceptual artwork, not a verified client screenshot. No video plays until an approved source is configured.</p></div>
          <div className="overflow-hidden rounded-2xl border border-[#e2e4e8] bg-white shadow-[0_18px_48px_rgba(17,24,39,.08)]">
            {videoUrl ? <div className="aspect-video bg-[#f1f2f3]"><video className="h-full w-full" controls playsInline preload="none" poster="/education-portal-video-poster.png"><source src={videoUrl} />{captionsUrl && <track kind="captions" src={captionsUrl} srcLang="en" label="English captions" default />}Your browser does not support HTML video.</video></div> : <div className="relative aspect-video"><Image src="/education-portal-video-poster.png" alt="Conceptual school administration dashboard on a laptop, used as an education portal video poster" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /><div className="absolute inset-0 bg-[#111827]/25" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#111827]/80 to-transparent p-5 pt-14 sm:p-7 sm:pt-16"><p className="text-sm font-semibold text-white">Education portal walkthrough</p><p className="mt-1 text-xs text-white/85">Video walkthrough coming soon</p></div></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-5 py-4 sm:px-6"><span className="text-xs font-semibold text-[#374151]">Institutional administration showcase</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7a8290]">{videoUrl ? "Controls enabled · No autoplay" : "No video source configured"}</span></div>
          </div>
        </div>
      </section>

      {/* Development process */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div><Eyebrow>Our development process</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A considered route from discovery to improvement.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">We clarify institutional needs and dependencies before shaping the work, then validate decisions with the people who will use the system.</p></div>
          <ol className="grid gap-3 sm:grid-cols-2">{steps.map((step, index) => <li key={step.title} className="flex gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">0{index + 1}</span><div><h3 className="font-semibold text-[#202938]">{step.title}</h3><p className="mt-1.5 text-sm leading-6 text-[#596273]">{step.description}</p></div></li>)}</ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#d71920] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><Eyebrow>Plan an institutional system</Eyebrow><h2 className="mt-4 max-w-4xl font-[var(--font-heading)] text-4xl font-semibold leading-[1.02] tracking-[-.05em] text-white sm:text-5xl lg:text-6xl">Let&apos;s improve the workflows behind your institution.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white">Tell us about your current processes, systems and priorities. We can help identify a practical next step.</p></div><button type="button" onClick={openModal} className="inline-flex min-h-12 w-fit items-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#b9151b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff3f3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none">Discuss Your Education Project <span aria-hidden="true">&rarr;</span></button></div>
      </section>

      {modalOpen && <ProjectEnquiryModal subject="Education & Portal Management Project Enquiry" onClose={() => setModalOpen(false)} />}
    </main>
  );
}
