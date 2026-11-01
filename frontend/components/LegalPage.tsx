import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./LegalPage.module.css";

export type LegalSection = { id: string; title: string; content: ReactNode };
export function ReviewRequired({ children }: { children: ReactNode }) {
  return <p className={styles.review}><strong>REVIEW REQUIRED:</strong> {children}</p>;
}
export default function LegalPage({ title, introduction, sections }: { title: string; introduction: string; sections: LegalSection[] }) {
  return <main className={styles.page}>
    <header className={styles.hero}><div className={styles.container}>
      <p className={styles.eyebrow}>MERITLIVES / Legal information</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.intro}>{introduction}</p>
      <div className={styles.notice} role="note" aria-label="Policy review status"><strong>Review draft ? not yet approved for production</strong>This page describes verified website features and proposed terms where indicated. Items marked REVIEW REQUIRED need company and qualified legal/privacy review before release. No effective date has been assigned.</div>
    </div></header>
    <div className={`${styles.container} ${styles.layout}`}>
      <nav className={styles.toc} aria-labelledby="legal-contents-title"><h2 id="legal-contents-title">On this page</h2><ol>{sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
      <div className={styles.content}>{sections.map((section, index) => <section key={section.id} id={section.id} tabIndex={-1} className={styles.section} aria-labelledby={`${section.id}-title`}><h2 id={`${section.id}-title`}>{index + 1}. {section.title}</h2>{section.content}</section>)}
        <nav aria-label="Related legal information" className={styles.related}><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><Link href="/cookies">Cookie Policy</Link><Link href="/contact">Contact MERITLIVES</Link></nav>
      </div>
    </div>
  </main>;
}
