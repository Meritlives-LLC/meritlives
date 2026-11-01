import Image from "next/image";
import Link from "next/link";
import type { AboutContent, AboutCard } from "../lib/about";
import { aboutImage } from "../lib/about";
import s from "./AboutPage.module.css";

function Photo({ src, alt, hero = false }: { src: string; alt: string; hero?: boolean }) {
  const localStorage = /^http:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(src);
  return <Image src={src} alt={alt} fill priority={hero} loading="eager" fetchPriority={hero ? "high" : "low"} sizes={hero ? "(max-width: 850px) 100vw, 52vw" : "(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"} unoptimized={localStorage} className={s.photo} />;
}

export default function AboutPage({ content: c, serviceCards, productCards }: { content: AboutContent; serviceCards: AboutCard[]; productCards: AboutCard[] }) {
  return <main className={s.page}>
    <section className={`${s.container} ${s.hero}`} aria-labelledby="about-title">
      <div className={s.heroCopy}>
        <p className={s.eyebrow}><span /> About MERITLIVES LLC</p><h1 id="about-title">{c.hero_title}</h1>
        <p className={s.lead}>{c.hero_description}</p>
        <div className={s.buttons}><Link className={s.primary} href="/services">Explore Our Services <span aria-hidden="true">↗︎</span></Link><Link className={s.secondary} href="/contact">Contact Us <span aria-hidden="true">→</span></Link></div>
        <a href="#who-we-are" className={s.discover}><span aria-hidden="true">↓</span> Discover our approach</a>
      </div>
      <figure className={s.heroFigure}><div className={s.heroImage}><Photo hero src={aboutImage(c.hero_image, "/security/stakeholder-review.jpg")} alt={c.hero_image_alt} /></div><figcaption><span className={s.redDot} /> People. Purpose. Practical technology.</figcaption></figure>
    </section>
    <section id="who-we-are" className={`${s.container} ${s.introduction}`} aria-labelledby="who-title">
      <div><p className={s.eyebrow}>01 / Who we are</p><h2 id="who-title">{c.who_title}</h2></div><div className={s.introBody}><p>{c.who_body}</p><span className={s.smallLabel}>Strategy meets design. Ideas become useful systems.</span></div>
    </section>
    <section className={s.storyBand} aria-labelledby="story-title"><div className={`${s.container} ${s.story}`}>
      <figure className={s.storyFigure}><div className={s.storyImage}><Photo src={aboutImage(c.section_image, "/security/team-assessment.jpg")} alt={c.section_image_alt} /></div><figcaption>Built through conversation. Shaped by real needs.</figcaption></figure>
      <div><p className={s.eyebrow}>02 / Our story</p><h2 id="story-title">{c.story_title}</h2><p className={s.body}>{c.story_body}</p><div className={s.belief}>Technology should make work simpler.<span>That belief guides what we build, and how we build it.</span></div></div>
    </div></section>
    <section className={`${s.container} ${s.purpose}`} aria-label="Mission and vision">
      <article><p className={s.eyebrow}>Our mission</p><h2>Making technology work for you.</h2><p>{c.mission}</p><span className={s.cardMark} aria-hidden="true">↗︎</span></article>
      <article><p className={s.eyebrow}>Our vision</p><h2>A trusted partner for what&apos;s ahead.</h2><p>{c.vision}</p><span className={s.cardMark} aria-hidden="true">↗︎</span></article>
    </section>
    {serviceCards.length > 0 && <section className={`${s.container} ${s.section}`} aria-labelledby="services-title">
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>03 / What we do</p><h2 id="services-title">Different challenges.<br />Connected expertise.</h2></div><p>From a stronger digital presence to smarter operations, we build around the work you need to do.</p></div>
      <div className={s.services}>{serviceCards.map((item, index) => <Link className={s.service} href={item.href} key={item.slug}><span className={s.serviceIndex}>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.description}</p><span className={s.serviceLink}>Explore service <span aria-hidden="true">↗︎</span></span></Link>)}</div>
    </section>}
    <section className={s.valuesBand} aria-labelledby="values-title"><div className={`${s.container} ${s.section}`}>
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>04 / Our values</p><h2 id="values-title">The principles behind<br />every decision.</h2></div><p>Good technology starts with the way we work. These values keep our purpose clear and our partnerships strong.</p></div>
      <div className={s.values}>{c.values.map((item, index) => <article className={s.value} key={index}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
    </div></section>
    <section className={`${s.container} ${s.section}`} aria-labelledby="approach-title"><div className={s.sectionHeading}><div><p className={s.eyebrow}>05 / Our approach</p><h2 id="approach-title">A clear path.<br />From idea to impact.</h2></div><p>A thoughtful process, with you at every stage. We listen closely, build carefully and keep improving.</p></div>
      <ol className={s.process}>{c.approach.map((item, index) => <li key={index}><span className={s.step}>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.description}</p></li>)}</ol>
    </section>
    {productCards.length > 0 && <section className={`${s.container} ${s.productsSection}`} aria-labelledby="products-title"><div className={s.sectionHeading}><div><p className={s.eyebrow}>06 / Products & platforms</p><h2 id="products-title">Ideas in action.</h2></div><Link className={s.textLink} href="/products">Explore all products <span aria-hidden="true">↗︎</span></Link></div>
      <div className={s.products}>{productCards.map(item => <article className={s.product} key={item.slug}><Link href={item.href} aria-label={`Explore ${item.title}`} className={s.productImage}><Photo src={item.image} alt={item.imageAlt} /></Link><div className={s.productCopy}><h3><Link href={item.href}>{item.title} <span aria-hidden="true">↗︎</span></Link></h3><p>{item.description}</p></div></article>)}</div>
    </section>}
    <section className={`${s.container} ${s.cta}`} aria-labelledby="about-cta"><div><p className={s.eyebrow}>Your next chapter starts here</p><h2 id="about-cta">{c.cta_title}</h2><p>{c.cta_description}</p></div><div className={s.buttons}><Link className={s.primary} href="/contact">{c.cta_primary_label} <span aria-hidden="true">↗︎</span></Link><Link className={s.secondary} href="/services">{c.cta_secondary_label} <span aria-hidden="true">→</span></Link></div></section>
    <div className={`${s.container} ${s.photoNote}`}>Default photography is illustrative. People pictured are not presented as MERITLIVES staff or customers.</div>
  </main>;
}
