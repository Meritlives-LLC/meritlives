"use client";

import Image from "next/image";
import { useCallback, useState, type ReactNode } from "react";
import { ProjectEnquiryModal } from "./WebDevelopmentPage";
import { approvedSecurityMediaUrl } from "../lib/security-service";

const services = [
  { icon: "application", title: "Web Application Security Assessment", description: "Review authentication, authorization, session handling and application behavior to identify weaknesses within an agreed scope." },
  { icon: "api", title: "API Security Review", description: "Assess access controls, input validation, data exposure and request protections across your approved API endpoints." },
  { icon: "scan", title: "Vulnerability Assessment", description: "Identify known weaknesses in agreed systems and dependencies, validate relevant findings and put them in context." },
  { icon: "cloud", title: "Cloud & Server Configuration Review", description: "Examine approved cloud and server settings, identity permissions, exposed services, TLS and operational safeguards." },
  { icon: "server", title: "Infrastructure Hardening", description: "Strengthen agreed configurations through least privilege, reduced exposure, secure defaults and controlled changes." },
  { icon: "risk", title: "Security Posture & Risk Review", description: "Connect technical findings with business impact, ownership and practical priorities for your next security decisions." },
] as const;

const stages = [
  { title: "Discovery & Scope", purpose: "Understand your systems, business priorities and assessment boundaries.", output: "An agreed scope, system inventory and rules of engagement." },
  { title: "Authorized Assessment", purpose: "Review approved targets using methods and safeguards agreed with your team.", output: "Evidence-based observations from the authorized assessment." },
  { title: "Findings & Risk Prioritization", purpose: "Validate findings and consider likelihood, exposure and business impact.", output: "A prioritized findings register with supporting evidence and context." },
  { title: "Remediation Planning", purpose: "Translate risks into actionable changes your team can plan and own.", output: "Recommended fixes, dependencies, owners and practical next steps." },
  { title: "Security Hardening", purpose: "Implement agreed improvements through your change-control process.", output: "Documented configuration or application changes and recovery considerations." },
  { title: "Verification & Reporting", purpose: "Recheck agreed fixes and explain outcomes to technical and business stakeholders.", output: "Verification results, remaining risks and a clear management summary." },
];

const benefits = ["Reduced exposure to known vulnerabilities", "Improved visibility into security risks", "Practical remediation priorities", "Stronger application and infrastructure controls", "Greater operational confidence", "Clear technical and management reporting"];
const industries = ["Financial Technology", "Education & Learning Platforms", "SaaS & Web Applications", "E-commerce", "Professional Services", "Digital Infrastructure"];
const faqs = [
  { question: "What does a security audit cover?", answer: "An audit can cover agreed application, API, server, cloud and operational controls. We identify what matters to your systems and business before confirming the assessment scope. It is not a guarantee that every vulnerability will be found." },
  { question: "How is an assessment scoped?", answer: "We agree the systems, environments, access, permitted methods, exclusions, timing and deliverables with an authorized representative. Written authorization and rules of engagement are established before testing begins." },
  { question: "Will an assessment affect live systems?", answer: "We agree safeguards, testing windows, monitoring, escalation contacts and stop conditions before any testing. Staging or non-production environments are preferred where appropriate. Any permitted work on live systems requires explicit authorization and an agreed risk-management plan; disruptive testing is not assumed." },
  { question: "What will we receive?", answer: "The agreed deliverables typically include a management summary, prioritized technical findings, evidence, business context and recommended remediation. The report also records scope limitations and residual risks so decisions remain grounded in what was assessed." },
  { question: "Can MERITLIVES help with remediation?", answer: "Yes. We can scope application fixes and infrastructure hardening alongside your team. Changes require approval, suitable access and your agreed testing, backup and change-control process. Remediation can also be delivered by your own team." },
  { question: "How does follow-up verification work?", answer: "We agree which findings will be rechecked, the environment and the permitted methods. Verification records whether the agreed fixes address the original findings and identifies remaining concerns. A recheck is limited to its agreed scope and does not certify the entire system." },
];

const videoUrl = approvedSecurityMediaUrl(process.env.NEXT_PUBLIC_SECURITY_SHOWCASE_VIDEO_URL);
const captionsUrl = approvedSecurityMediaUrl(process.env.NEXT_PUBLIC_SECURITY_SHOWCASE_CAPTIONS_URL);
const primary = "inline-flex min-h-12 items-center justify-center gap-3 rounded-md border border-[#d71920] bg-[#d71920] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] motion-reduce:transition-none";
const secondary = "inline-flex min-h-12 items-center justify-center gap-3 rounded-md border border-[#d1d5db] bg-white px-6 py-3 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] motion-reduce:transition-none";

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">{children}</p>;
}

function SecurityIcon({ name }: { name: typeof services[number]["icon"] }) {
  const paths: Record<typeof name, ReactNode> = {
    application: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01M8 13l-2 2 2 2m8-4 2 2-2 2m-3-5-2 6" /></>,
    api: <><path d="M8 4H6a2 2 0 0 0-2 2v3l-2 3 2 3v3a2 2 0 0 0 2 2h2m8-16h2a2 2 0 0 1 2 2v3l2 3-2 3v3a2 2 0 0 1-2 2h-2M10 12h4" /></>,
    scan: <><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m8 0h4a1 1 0 0 0 1-1v-4" /><circle cx="11" cy="11" r="4" /><path d="m14 14 4 4" /></>,
    cloud: <><path d="M7 18H6a4 4 0 0 1-.5-8A6.5 6.5 0 0 1 18 8a5 5 0 0 1 1 10h-1" /><path d="m12 12 4 2v3c0 2-2 3.5-4 4-2-.5-4-2-4-4v-3l4-2Z" /></>,
    server: <><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.01M7 17.5h.01M12 6.5h5M12 17.5h5" /></>,
    risk: <><path d="M14 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9l-6-6Zm0 0v6h6M8 14h8M8 17h5" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.6]" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Check() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 fill-none stroke-[#d71920] stroke-2"><path d="m4 10 4 4 8-8" /></svg>;
}

export default function SecurityServicePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111827]">
      <section className="border-b border-[#eceef1] bg-[#faf9f7]">
        <div className="ml-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:gap-14 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Security Audit &amp; Hardening</Eyebrow>
            <h1 className="mt-5 font-[var(--font-heading)] text-5xl font-semibold leading-[1.05] tracking-[-.055em] text-[#111827] sm:text-6xl lg:text-[clamp(3rem,4.5vw,4.8rem)]">Find vulnerabilities.<br />Reduce risk.<br /><span className="text-[#d71920]">Build with confidence.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#596273]">Security is essential to building trustworthy digital products. MERITLIVES helps organizations assess application and infrastructure risks, identify weaknesses, strengthen security controls and establish a practical roadmap toward more resilient digital operations.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={openModal} className={primary}>Request a Security Audit <span aria-hidden="true">&rarr;</span></button>
              <a href="#security-approach" className={secondary}>Explore Our Approach <span aria-hidden="true">&darr;</span></a>
            </div>
            <p className="mt-5 text-xs leading-6 text-[#667085]">Authorized. Scoped. Focused on practical improvements.</p>
          </div>
          <figure className="relative min-w-0">
            <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#e8e5e0] shadow-[0_24px_70px_rgba(17,24,39,.10)]">
              <Image src="/security/professional-review.jpg" alt="A professional reviewing work on a laptop at an office desk; illustrative stock photograph." width={1600} height={2397} priority sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/3] w-full object-cover object-[center_38%] lg:aspect-[4/4.7]" />
            </div>
            <figcaption className="mt-3 text-xs leading-5 text-[#667085]">People, systems and informed security decisions. Illustrative stock photograph.</figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="security-services-title" className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <div className="max-w-3xl"><Eyebrow>What we assess</Eyebrow><h2 id="security-services-title" className="mt-4 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] sm:text-4xl lg:text-5xl">Comprehensive Security for Modern Digital Systems</h2><p className="mt-5 text-base leading-8 text-[#596273]">From application behavior to infrastructure settings, we help you understand where attention is needed and what to do next.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map(item => <article key={item.title} className="group rounded-xl border border-[#e5e7eb] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#d71920]/40 hover:shadow-[0_12px_35px_rgba(17,24,39,.06)] motion-reduce:transform-none motion-reduce:transition-none sm:p-7"><div className="grid h-12 w-12 place-items-center rounded-lg bg-[#fff1f1] text-[#b9151b]"><SecurityIcon name={item.icon} /></div><h3 className="mt-6 text-lg font-semibold leading-7 text-[#111827]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#596273]">{item.description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="security-approach" aria-labelledby="security-approach-title" className="scroll-mt-28 border-y border-[#eceef1] bg-[#fafafa] py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div><Eyebrow>Our approach</Eyebrow><h2 id="security-approach-title" className="mt-4 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] sm:text-4xl lg:text-5xl">A Structured Approach to Stronger Security</h2><p className="mt-5 text-base leading-8 text-[#596273]">Clear boundaries make assessments more useful. We agree objectives, authorization, permitted methods and safeguards before any testing, then work with your team on a practical path forward.</p><div className="mt-6 rounded-lg border-l-4 border-[#d71920] bg-white p-5"><p className="text-sm font-semibold text-[#111827]">Your systems. Your agreed boundaries.</p><p className="mt-2 text-sm leading-7 text-[#596273]">Testing windows, sensitive data handling, escalation contacts and stop conditions are established together. Disruptive testing is never assumed.</p></div></div>
            <figure><Image src="/security/team-assessment.jpg" alt="Two colleagues discussing work together at a computer in a bright office; illustrative stock photograph." width={1600} height={1068} sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/3] w-full rounded-xl object-cover" /><figcaption className="mt-3 text-xs leading-5 text-[#667085]">Collaborative assessment planning. Stock photography, not a MERITLIVES client engagement.</figcaption></figure>
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage, index) => <li key={stage.title} className="rounded-xl border border-[#e5e7eb] bg-white p-6"><span className="text-sm font-bold tracking-[.15em] text-[#b9151b]">0{index + 1}</span><h3 className="mt-5 text-lg font-semibold">{stage.title}</h3><p className="mt-3 text-sm leading-7 text-[#596273]">{stage.purpose}</p><p className="mt-4 border-t border-[#eceef1] pt-4 text-sm leading-7 text-[#596273]"><span className="font-semibold text-[#202938]">Expected output: </span>{stage.output}</p></li>)}
          </ol>
        </div>
      </section>

      <section aria-labelledby="security-value-title" className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-16">
          <figure className="order-2 lg:order-1"><Image src="/security/stakeholder-review.jpg" alt="A presenter discussing information with colleagues around a conference table; illustrative stock photograph." width={1600} height={2397} sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/3] w-full rounded-xl object-cover object-[center_42%] lg:aspect-[4/4.5]" /><figcaption className="mt-3 text-xs leading-5 text-[#667085]">Clear conversations about technical priorities. Illustrative stock photograph.</figcaption></figure>
          <div className="order-1 lg:order-2"><Eyebrow>Business value</Eyebrow><h2 id="security-value-title" className="mt-4 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] sm:text-4xl lg:text-5xl">Security That Supports Business Growth</h2><p className="mt-5 text-base leading-8 text-[#596273]">A useful assessment turns technical concerns into decisions your organization can act on, with priorities that reflect your systems and business context.</p><ul className="mt-7 grid gap-4">{benefits.map(benefit => <li key={benefit} className="flex gap-3 text-sm leading-7 text-[#374151]"><Check />{benefit}</li>)}</ul><p className="mt-6 text-xs leading-6 text-[#667085]">An assessment is limited to its agreed scope and timing. It does not guarantee protection, certify compliance or establish that a system has no vulnerabilities.</p></div>
        </div>
      </section>

      <section aria-labelledby="security-industries-title" className="border-y border-[#eceef1] bg-[#fafafa] py-16 sm:py-20">
        <div className="ml-container"><Eyebrow>Who we support</Eyebrow><h2 id="security-industries-title" className="mt-4 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Security across connected industries</h2><p className="mt-4 max-w-2xl text-base leading-8 text-[#596273]">The right scope reflects the users, information and operational dependencies of your organization.</p><ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{industries.map(industry => <li key={industry} className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-5 text-sm font-semibold text-[#202938]"><Check />{industry}</li>)}</ul></div>
      </section>

      <section aria-labelledby="security-showcase-title" className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16"><div><Eyebrow>From insight to action</Eyebrow><h2 id="security-showcase-title" className="mt-4 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] sm:text-4xl">A clearer view of your security priorities</h2><p className="mt-5 text-base leading-8 text-[#596273]">See how an agreed scope, useful evidence and clear reporting can support your next security decisions.</p><p className="mt-4 text-sm leading-7 text-[#667085]">We can discuss the assessment process and expected deliverables during your initial conversation.</p></div><div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f1f2f3]">{videoUrl ? <video aria-label="Security assessment overview" className="aspect-video w-full bg-black" controls playsInline preload="none" poster="/security/team-assessment.jpg"><source src={videoUrl} />{captionsUrl && <track kind="captions" src={captionsUrl} srcLang="en" label="English captions" default />}Your browser does not support HTML video.</video> : <div className="relative aspect-video"><Image src="/security/team-assessment.jpg" alt="Colleagues reviewing work together at a computer; illustrative stock photograph." fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#111827]/85 via-transparent to-transparent" /><p className="absolute inset-x-0 bottom-0 p-5 text-sm font-semibold text-white sm:p-7">Thoughtful assessment. Practical next steps.</p></div>}</div></div>
      </section>

      <section aria-labelledby="security-faq-title" className="border-t border-[#eceef1] bg-[#fafafa] py-16 sm:py-20">
        <div className="ml-container grid gap-10 lg:grid-cols-[.65fr_1.35fr] lg:gap-16"><div><Eyebrow>Your questions</Eyebrow><h2 id="security-faq-title" className="mt-4 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Before we begin</h2><p className="mt-5 text-base leading-8 text-[#596273]">Clear expectations are part of a responsible security engagement.</p></div><div className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">{faqs.map(faq => <details key={faq.question} className="group py-5"><summary className="cursor-pointer rounded-sm pr-4 text-base font-semibold leading-7 text-[#202938] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">{faq.question}</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-[#596273]">{faq.answer}</p></details>)}</div></div>
      </section>

      <section className="border-t border-[#f0d7d7] bg-[#fff3f2] py-16 sm:py-20">
        <div className="ml-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><Eyebrow>Start with a conversation</Eyebrow><h2 className="mt-4 max-w-3xl font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] sm:text-4xl lg:text-5xl">Understand your risks.<br />Plan your next steps.</h2><p className="mt-5 max-w-2xl text-base leading-8 text-[#596273]">Tell us about your application, infrastructure or security concerns. We will help clarify a suitable assessment scope.</p></div><div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col"><button type="button" onClick={openModal} className={primary}>Request a Security Audit <span aria-hidden="true">&rarr;</span></button><button type="button" onClick={openModal} className={secondary}>Talk to a Security Specialist</button></div></div>
      </section>
      {modalOpen && <ProjectEnquiryModal subject="Security Audit & Hardening" onClose={() => setModalOpen(false)} />}
    </main>
  );
}
