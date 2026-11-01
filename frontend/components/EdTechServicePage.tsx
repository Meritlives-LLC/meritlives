"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ProjectEnquiryModal } from "./WebDevelopmentPage";

const learningSolutions = [
  { title: "Learning management systems", description: "Organise courses, learning materials and course activity around your programme." },
  { title: "Online courses & materials", description: "Deliver structured digital lessons, resources and recorded content for learners." },
  { title: "Virtual classrooms", description: "Connect live learning sessions with lesson resources and learner participation." },
  { title: "Assessments & assignments", description: "Support quizzes, assignment submissions, feedback and review workflows." },
  { title: "Instructor & learner dashboards", description: "Give educators and learners useful views of courses, activities and progress." },
  { title: "Learning analytics", description: "Summarise learning activity and completion to help evaluate and improve programmes." },
  { title: "AI-assisted learning", description: "Explore focused AI features for learning support, with clear boundaries and human oversight." },
];

const institutions = [
  "Schools",
  "Polytechnics",
  "Universities",
  "Training centres",
  "Corporate academies",
];

const developmentSteps = [
  { title: "Discover", description: "Understand learners, educators, administrators and the programme goals." },
  { title: "Design", description: "Plan the learning journeys, content structure and platform experience." },
  { title: "Develop", description: "Build the agreed features and connect the systems they depend on." },
  { title: "Validate", description: "Review key workflows, accessibility, content and responsive behaviour." },
  { title: "Launch", description: "Prepare the platform and support the transition into use." },
  { title: "Improve", description: "Use feedback and changing needs to guide ongoing improvements." },
];

const audiences = [
  { title: "Schools", description: "Support classroom learning and communication beyond the school day." },
  { title: "Higher education", description: "Connect courses, learners and academic workflows across programmes." },
  { title: "Vocational training", description: "Make practical learning resources and assessments easier to access." },
  { title: "Corporate learning", description: "Organise internal learning, onboarding and professional development." },
  { title: "Online educators", description: "Bring course content, sessions and learner activity together online." },
];

const faqs = [
  { question: "Can you build a learning platform around our programme?", answer: "We can help scope and develop a platform around your learners, content, teaching approach and operational requirements. The right features depend on the programme and systems involved." },
  { question: "Can an existing LMS or content library be integrated?", answer: "Possibly. We first review the learning platform, available interfaces, content formats and access rules to determine a suitable approach." },
  { question: "Can you help move existing courses and learning materials?", answer: "We can assess available content and formats and plan a migration approach. Scope depends on the source platform, content quality, permissions and what needs to be retained." },
  { question: "Can the platform include assessments and learning analytics?", answer: "Assessment and reporting features can be scoped around your learning objectives, evaluation process and the data you are able to collect and use." },
  { question: "What should we prepare before getting started?", answer: "It helps to outline your learner groups, course content, current tools, teaching workflows and the main problem you want to solve. We can work through the remaining requirements together." },
];

// Configure an approved demonstration and optional captions in frontend/.env.local.
// NEXT_PUBLIC_EDTECH_SHOWCASE_VIDEO_URL and NEXT_PUBLIC_EDTECH_SHOWCASE_CAPTIONS_URL
const showcaseVideoUrl = process.env.NEXT_PUBLIC_EDTECH_SHOWCASE_VIDEO_URL?.trim();
const showcaseCaptionsUrl = process.env.NEXT_PUBLIC_EDTECH_SHOWCASE_CAPTIONS_URL?.trim();

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b9151b]">{children}</p>;
}

export default function EdTechServicePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111827]">
      {/* Hero */}
      <section className="bg-[#faf9f7]">
        <div className="ml-container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[.98fr_1.02fr] lg:gap-10 lg:py-24">
          <div className="max-w-2xl">
            <Eyebrow>EdTech &amp; e-learning platforms</Eyebrow>
            <h1 className="mt-5 font-[var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-[#111827] sm:text-6xl lg:text-[4.1rem]">Transforming Education Through Technology.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#4b5563] sm:text-lg">We help education providers design and develop digital learning platforms that bring courses, people and learning workflows together.</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#667085]">From a learning management system to connected portals and assessments, we shape technology around how your institution teaches and supports learners.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={openModal} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#d71920] px-6 py-3 text-sm font-semibold text-[#ffffff] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Discuss Your EdTech Project <span aria-hidden="true">↗</span></button>
              <a href="#learning-solutions" className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#d1d5db] bg-white px-6 py-3 text-sm font-semibold text-[#202938] transition hover:border-[#d71920] hover:text-[#b9151b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920]">Explore solutions <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-2xl lg:-mr-10 lg:max-w-none">
            <div className="absolute -right-6 top-8 h-36 w-36 rounded-full bg-[#d71920]/[.08] blur-2xl sm:h-48 sm:w-48" />
            <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_24px_70px_rgba(17,24,39,.10)]">
              <Image src="/edtech-hero.png" alt="Conceptual digital learning platform interfaces on laptop and tablet screens" width={1536} height={1024} priority sizes="(max-width: 1024px) 100vw, 56vw" className="aspect-[1.48/1] w-full object-cover" />
              <div className="absolute bottom-4 left-4 rounded-lg border border-[#e5e7eb] bg-white/95 px-4 py-3 shadow-sm sm:bottom-6 sm:left-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#b9151b]">Learning, connected</p><p className="mt-1 text-sm font-semibold text-[#202938]">Courses · Communities · Progress</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Digital learning solutions */}
      <section id="learning-solutions" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
        <div className="ml-container">
          <div className="max-w-2xl"><Eyebrow>Digital learning solutions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Build the learning experience your programme needs.</h2><p className="mt-4 text-base leading-7 text-[#596273]">We can help plan and build digital tools for teaching, course delivery and learner support.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {learningSolutions.map((solution, index) => <article key={solution.title} className="group rounded-xl border border-[#e5e7eb] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#efb8ba] hover:shadow-[0_16px_40px_rgba(17,24,39,.07)] sm:p-7"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">0{index + 1}</span><h3 className="mt-7 text-lg font-semibold tracking-[-.02em] text-[#202938]">{solution.title}</h3><p className="mt-3 text-sm leading-7 text-[#596273]">{solution.description}</p></article>)}
          </div>
        </div>
      </section>

      {/* Institution-focused image section */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[1.04fr_.96fr] lg:gap-16">
          <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_20px_55px_rgba(17,24,39,.09)]">
            <Image src="/edtech-learning-environment.png" alt="Learners collaborating around digital devices in a bright educational setting" width={1536} height={1024} sizes="(max-width: 1024px) 100vw, 50vw" className="aspect-[1.42/1] w-full object-cover" />
            <span className="absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-xs font-semibold text-[#374151] shadow-sm sm:bottom-5 sm:left-5">Illustrative learning environment</span>
          </div>
          <div><Eyebrow>Designed for institutions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Technology should support the people who make learning happen.</h2><p className="mt-5 text-base leading-8 text-[#596273]">We work with education teams to understand how learning is delivered, how students are supported and where a digital platform can make the experience clearer.</p><ul className="mt-7 grid gap-3 sm:grid-cols-2">{institutions.map((institution) => <li key={institution} className="flex items-center gap-3 text-sm font-medium text-[#374151]"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#d71920]" />{institution}</li>)}</ul></div>
        </div>
      </section>

      {/* Six step development process */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div><Eyebrow>Development process</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A clear path from learning need to launch.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">We move through the work in practical stages, checking that the platform supports the intended learning experience.</p></div>
          <ol className="grid gap-3 sm:grid-cols-2">{developmentSteps.map((step, index) => <li key={step.title} className="flex gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff1f1] font-mono text-xs font-bold text-[#b9151b]">0{index + 1}</span><div><h3 className="font-semibold text-[#202938]">{step.title}</h3><p className="mt-1.5 text-sm leading-6 text-[#596273]">{step.description}</p></div></li>)}</ol>
        </div>
      </section>

      {/* Video showcase and LMS dashboard poster */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid items-center gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
          <div><Eyebrow>Video showcase</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">See Digital Learning in Action</h2><p className="mt-5 max-w-lg text-base leading-8 text-[#596273]">A walkthrough can show how courses, lessons, assessments and learning progress fit together. We couldn&apos;t find an approved MERITLIVES EdTech video to feature yet.</p><p role="status" className="mt-5 inline-flex max-w-lg rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm leading-6 text-[#4b5563]">This dashboard image is a conceptual poster, not a live platform or video. No video is currently playing.</p></div>
          <div className="overflow-hidden rounded-2xl border border-[#e2e4e8] bg-white shadow-[0_18px_48px_rgba(17,24,39,.08)]">
            {showcaseVideoUrl ? <div className="aspect-video bg-[#f1f2f3]"><video className="h-full w-full" controls playsInline preload="none" poster="/edtech-lms-poster.png"><source src={showcaseVideoUrl} />{showcaseCaptionsUrl && <track kind="captions" src={showcaseCaptionsUrl} srcLang="en" label="English captions" default />}Your browser does not support HTML video.</video></div> : <div className="relative aspect-video"><Image src="/edtech-lms-poster.png" alt="Conceptual learning management dashboard artwork used as the video section poster" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /><div className="absolute inset-0 bg-[#111827]/35" /><div className="absolute inset-0 flex items-end p-5 sm:p-7"><p className="max-w-sm rounded-lg border border-white/30 bg-[#111827]/75 px-4 py-3 text-sm font-medium text-[#ffffff] backdrop-blur-sm">No approved EdTech walkthrough video is available.</p></div></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-5 py-4 sm:px-6"><span className="text-xs font-semibold text-[#374151]">{showcaseVideoUrl ? "MERITLIVES digital learning walkthrough" : "Digital learning showcase"}</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#7a8290]">{showcaseVideoUrl ? "Controls enabled · No autoplay" : "No video source configured"}</span></div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div><Eyebrow>Who we support</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">Learning teams serving different communities.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#596273]">The right platform depends on who is learning, who is teaching and how the programme is organised.</p></div>
          <ul className="grid gap-3 sm:grid-cols-2">{audiences.map((audience, index) => <li key={audience.title} className="rounded-xl border border-[#e5e7eb] bg-white p-5"><p className="font-mono text-[10px] font-bold tracking-[.12em] text-[#b9151b]">AUDIENCE / 0{index + 1}</p><h3 className="mt-2 font-semibold text-[#202938]">{audience.title}</h3><p className="mt-1.5 text-sm leading-6 text-[#596273]">{audience.description}</p></li>)}</ul>
        </div>
      </section>

      <section className="bg-[#fff8f8] py-14 sm:py-16">
        <div className="ml-container grid gap-6 rounded-2xl border border-[#f0c5c7] bg-white p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><Eyebrow>Institutional operations</Eyebrow><h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold tracking-[-.04em] text-[#111827] sm:text-4xl">Need More Than an LMS?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#596273]">Institutions may also need admission management, student records, results processing and administrative portals. Explore our service focused on those operational systems.</p></div>
          <Link href="/services/Education" className="inline-flex min-h-11 w-fit items-center gap-3 rounded-md border border-[#d71920] px-5 py-2.5 text-sm font-semibold text-[#b9151b] transition hover:bg-[#fff1f1] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#d71920]">Education &amp; Portal Management <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#faf9f7] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
          <div><Eyebrow>Frequently asked questions</Eyebrow><h2 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold tracking-[-.045em] text-[#111827] sm:text-5xl">A few things to consider.</h2></div>
          <div className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">{faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-[#202938] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d71920] [&::-webkit-details-marker]:hidden">{faq.question}<span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#d1d5db] text-[#b9151b] transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-1 pr-10 pt-3 text-sm leading-7 text-[#596273]">{faq.answer}</p></details>)}</div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#d71920] py-16 sm:py-20 lg:py-24">
        <div className="ml-container grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><Eyebrow>Ready to explore an idea?</Eyebrow><h2 className="mt-4 max-w-4xl font-[var(--font-heading)] text-4xl font-semibold leading-[1.02] tracking-[-.05em] text-[#ffffff] sm:text-5xl lg:text-6xl">Let&apos;s make learning work better.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-[#ffffff]">Tell us about your learners, programme and goals. We can help you plan a useful next step.</p></div><button type="button" onClick={openModal} className="inline-flex min-h-12 w-fit items-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#b9151b] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff3f3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Discuss Your EdTech Project <span aria-hidden="true">↗</span></button></div>
      </section>
      {modalOpen && <ProjectEnquiryModal subject="EdTech Project Enquiry" onClose={() => setModalOpen(false)} />}
    </main>
  );
}
