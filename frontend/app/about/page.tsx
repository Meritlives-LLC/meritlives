export const metadata = { title: "About", description: "About MERITLIVES LLC." };

export default function AboutPage() {
  return <main>
    <section className="ml-section"><div className="ml-container max-w-5xl"><p className="ml-eyebrow">About MERITLIVES</p><h1 className="ml-display mt-5">Technology should create opportunity, capability and impact.</h1><p className="mt-8 max-w-3xl text-xl leading-8 text-slate-600">MERITLIVES LLC brings together technology, digital innovation, education and practical problem-solving to help individuals and organisations make meaningful progress.</p></div></section>
    <section className="ml-section bg-slate-50"><div className="ml-container grid gap-8 md:grid-cols-3">{[["01","Practical","We focus on useful solutions that can work in real environments."],["02","People","We design around users, teams, learners and communities."],["03","Progress","We turn ideas into capabilities, systems and measurable outcomes."]].map(([n,t,d])=><div key={n} className="ml-card p-7"><span className="text-sm font-bold text-blue-600">{n}</span><h2 className="mt-5 text-2xl font-bold">{t}</h2><p className="mt-3 leading-7 text-slate-600">{d}</p></div>)}</div></section>
  </main>;
}
