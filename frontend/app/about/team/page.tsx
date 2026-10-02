"use client";

import { useState } from "react";
import Image from "next/image";

type TeamMember = {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
};

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Adams Emmanuel",
    role: "Founder & Lead",
    image: "/team/adams.jpeg",
    bio: "A short introduction about this team member will go here. This section can describe their role at Meritlives, areas of expertise and the work they contribute to the organisation.",
  },
  {
    id: 2,
    name: "Onime Samuel Ikhuenmiohimen",
    role: "CTO",
    image: "/team/Onime.jpeg",
    bio: "Onime Samuel Ikhuenmiohimen is a technology and engineering professional, entrepreneur, and business executive with a background in Electrical & Electronics Engineering. He works at the intersection of technology, business, and innovation, with experience spanning software development, AI-powered solutions, digital products, IT infrastructure, and automation. Samuel is passionate about building practical, scalable technology solutions that solve real-world problems and create lasting business value. Based in Abuja, Nigeria, he is focused on developing technology ventures with the potential to serve businesses and users across Nigeria and global markets.",
  },
  {
    id: 3,
    name: "Taiwo Olayiwola John",
    role: "Software Engineer",
    image: "/team/Taiwo.jpeg",
    bio: "Taiwo Olayiwola John is a Computer Science professional, entrepreneur, and technology enthusiast with a multidisciplinary background spanning web and mobile application development, digital marketing, UI/UX design, and artificial intelligence solutions.",
  },
  {
    id: 4,
    name: "Ahmed Adebayo",
    role: "Web & Software Developer",
    image: "/team/Ahmed.png",
    bio: "Ahmed Adebayo is a technology professional, entrepreneur, and software developer passionate about turning ideas into practical digital solutions. With a strong interest in technology, business, and creativity, he enjoys building products, solving problems, and exploring new ways to use technology to create meaningful impact. His experience spans web and software development, digital products, AI, automation, and technology-driven business solutions. Beyond the technical side, Adebayo is driven by curiosity, continuous learning, and the desire to build ventures that can grow beyond Nigeria and make a lasting impact.",
  },
  {
    id: 5,
    name: "Team Member Four",
    role: "Operations & Strategy",
    image: "/team/placeholder-4.jpg",
    bio: "A short introduction about this team member will go here. This section can describe their responsibilities, experience and contribution to the growth of Meritlives.",
  },
];

export default function TeamPage() {
  const [selectedMember, setSelectedMember] =
    useState<TeamMember | null>(null);

  return (
    <main className="min-h-screen bg-[#080909] text-white">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#080909]">

        {/* Technical background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Glow */}
        <div className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-[#c8ff00]/[0.035] blur-3xl" />

        {/* Rings */}
        <div className="pointer-events-none absolute -right-48 top-20 h-[620px] w-[620px] rounded-full border border-white/[0.045]" />

        <div className="pointer-events-none absolute -right-20 top-48 h-[420px] w-[420px] rounded-full border border-white/[0.035]" />

        <div className="ml-container relative">

          <div
            className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
            style={{
              paddingTop: "48px",
              paddingBottom: "80px",
            }}
          >

            {/* Hero text */}
            <div>

              <p className="ml-eyebrow !text-[#c8ff00]">
                Our team
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[76px]">
                The people
                <br />
                behind{" "}
                <span className="text-[#c8ff00]">
                  Meritlives.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-[16px] leading-8 text-[#999b96] sm:text-[17px]">
                Meet the people bringing together technology, creativity,
                innovation and practical thinking to build meaningful
                solutions.
              </p>

            </div>

            {/* Hero side */}
            <div className="lg:justify-self-end">

              <div className="max-w-sm border-l border-[#c8ff00]/40 pl-6">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#999b96]">
                  01 / The team
                </p>

                <p className="mt-4 text-sm leading-7 text-[#c4c6c0]">
                  Different skills, perspectives and responsibilities
                  come together around one shared direction.
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          TEAM SECTION
      ===================================================== */}
      <section className="relative overflow-hidden bg-[#0d0e0e] py-20 sm:py-24 lg:py-28">

        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="ml-container relative">

          {/* Heading */}
          <div className="mb-16 flex flex-col gap-5 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="ml-eyebrow !text-[#c8ff00]">
                02 / Meet the team
              </p>

              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
                Built by people who care about the work.
              </h2>

            </div>

            <p className="max-w-xs text-sm leading-7 text-[#777a75]">
              Click a team member to view their profile.
            </p>

          </div>


          {/* =================================================
              TEAM MEMBERS
          ================================================= */}
          <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">

            {teamMembers.map((member, index) => (

              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMember(member)}
                aria-label={`View profile of ${member.name}`}
                className="group flex w-full flex-col items-center text-center outline-none"
              >

                {/* NUMBER */}
                <div className="mb-6">

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-[#080909] text-[11px] font-semibold text-[#c8ff00] transition-all duration-300 group-hover:border-[#c8ff00] group-hover:bg-[#c8ff00] group-hover:text-black">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                </div>


                {/* =================================================
                    CIRCLE IMAGE
                ================================================= */}

                <div className="relative h-48 w-48 overflow-hidden rounded-full border border-white/[0.12] bg-[#181919] transition-all duration-500 group-hover:scale-[1.04] group-hover:border-[#c8ff00]/70 group-hover:shadow-[0_0_60px_rgba(200,255,0,0.08)] sm:h-52 sm:w-52">

                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    priority={index < 2}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="208px"
                  />

                </div>


                {/* MEMBER INFORMATION */}
                <div className="mt-7">

                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-white transition-colors duration-300 group-hover:text-[#c8ff00]">
                    {member.name}
                  </h3>

                  <p className="mt-2 text-sm text-[#999b96]">
                    {member.role}
                  </p>


                  {/* View profile */}
                  <div className="mt-5 flex items-center justify-center gap-3">

                    <span className="h-px w-6 bg-white/[0.12] transition-all duration-300 group-hover:w-10 group-hover:bg-[#c8ff00]" />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777a75] transition-colors duration-300 group-hover:text-[#c8ff00]">
                      View profile
                    </span>

                    <span className="h-px w-6 bg-white/[0.12] transition-all duration-300 group-hover:w-10 group-hover:bg-[#c8ff00]" />

                  </div>

                </div>

              </button>

            ))}

          </div>

        </div>
      </section>


      {/* =====================================================
          HOW WE WORK
      ===================================================== */}
      <section className="relative overflow-hidden border-y border-white/[0.08] bg-[#080909]">

        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full border border-white/[0.035]" />

        <div className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full border border-white/[0.025]" />

        <div className="ml-container relative">

          <div className="grid gap-12 py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24 lg:py-28">

            {/* Label */}
            <div>

              <p className="ml-eyebrow !text-[#c8ff00]">
                03 / How we work
              </p>

            </div>


            {/* Main content */}
            <div>

              <h2 className="max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Different skills.
                <br />
                <span className="text-[#777a75]">
                  One shared direction.
                </span>
              </h2>

              <p className="mt-7 max-w-2xl text-[16px] leading-8 text-[#999b96]">
                Meritlives brings together different skills and
                perspectives to turn ideas into useful technology,
                digital experiences and practical solutions.
              </p>


              {/* Principles */}
              <div className="mt-12 grid gap-8 border-t border-white/[0.08] pt-8 sm:grid-cols-3">

                <div>

                  <p className="text-xs font-semibold tracking-[0.16em] text-[#c8ff00]">
                    01
                  </p>

                  <p className="mt-3 text-sm font-medium text-white">
                    Collaboration
                  </p>

                </div>


                <div>

                  <p className="text-xs font-semibold tracking-[0.16em] text-[#c8ff00]">
                    02
                  </p>

                  <p className="mt-3 text-sm font-medium text-white">
                    Practical thinking
                  </p>

                </div>


                <div>

                  <p className="text-xs font-semibold tracking-[0.16em] text-[#c8ff00]">
                    03
                  </p>

                  <p className="mt-3 text-sm font-medium text-white">
                    Meaningful progress
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          CTA
      ===================================================== */}
      <section className="bg-[#0d0e0e] py-20 sm:py-24">

        <div className="ml-container">

          <div className="relative overflow-hidden border border-white/[0.08] bg-[#121313] px-7 py-14 sm:px-12 sm:py-16 lg:px-16">

            {/* Grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />

            {/* Rings */}
            <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full border border-white/[0.07]" />

            <div className="pointer-events-none absolute -right-8 -top-16 h-64 w-64 rounded-full border border-[#c8ff00]/10" />


            <div className="relative max-w-3xl">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8ff00]">
                Work with Meritlives
              </p>

              <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Have an idea
                <br />
                worth building?
              </h2>

              <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#999b96]">
                Let&apos;s explore how technology, digital innovation and
                practical thinking can help move it forward.
              </p>

              <a
                href="/contact"
                className="mt-8 inline-flex items-center border border-[#c8ff00] bg-[#c8ff00] px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ddff68] hover:shadow-[0_0_35px_rgba(200,255,0,0.15)]"
              >
                Start a conversation

                <span className="ml-3 text-base">
                  →
                </span>
              </a>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          TEAM MEMBER MODAL
      ===================================================== */}
      {selectedMember && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5 backdrop-blur-md"
          onClick={() => setSelectedMember(null)}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-member-name"
            className="relative w-full max-w-lg overflow-hidden border border-white/[0.1] bg-[#121313] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Lime top border */}
            <div className="h-1 w-full bg-[#c8ff00]" />


            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              aria-label="Close profile"
              className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#181919] text-lg text-[#999b96] transition-all duration-300 hover:border-[#c8ff00]/50 hover:text-[#c8ff00]"
            >
              ×
            </button>


            <div className="p-8 sm:p-10">

              {/* Profile header */}
              <div className="flex flex-col items-center text-center">

                {/* Modal circle */}
                <div className="relative h-32 w-32 overflow-hidden rounded-full border border-white/[0.12] bg-[#181919]">

                  <Image
                    src={selectedMember.image}
                    alt={selectedMember.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />

                </div>


                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8ff00]">
                  {selectedMember.role}
                </p>

                <h2
                  id="team-member-name"
                  className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white"
                >
                  {selectedMember.name}
                </h2>

              </div>


              {/* Divider */}
              <div className="my-8 h-px bg-white/[0.08]" />


              {/* Bio */}
              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777a75]">
                  About
                </p>

                <p className="mt-4 text-[15px] leading-7 text-[#999b96]">
                  {selectedMember.bio}
                </p>

              </div>


              {/* Close */}
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="mt-8 w-full border border-white/[0.1] py-3 text-sm font-semibold text-[#c4c6c0] transition-all duration-300 hover:border-[#c8ff00]/40 hover:bg-white/[0.03] hover:text-[#c8ff00]"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}