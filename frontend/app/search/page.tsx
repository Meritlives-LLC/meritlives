import { apiFetch } from "../../lib/api";
import type { Paginated, Product, Service, NewsItem, BlogPost } from "../../types/api";

async function search(q: string) {
  return apiFetch<{ products: Product[]; services: Service[]; news: NewsItem[]; blog: BlogPost[] }>(`/search?q=${encodeURIComponent(q)}`, { revalidate: 30 });
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() || "";
  const results = q ? await search(q) : null;
  return <main className="ml-container ml-section"><p className="ml-eyebrow">Search</p><h1 className="mt-3 text-4xl font-extrabold">Find something on MERITLIVES.</h1><form className="mt-8 flex max-w-2xl gap-3"><input name="q" defaultValue={q} placeholder="Search products, services, news..." className="flex-1 rounded-full border border-slate-300 px-5 py-3 outline-none focus:border-blue-500" /><button className="ml-btn ml-btn-primary">Search</button></form>{results && <div className="mt-12 grid gap-5">{Object.entries(results).map(([type, items]) => <section key={type}><h2 className="text-xl font-bold capitalize">{type}</h2><div className="mt-3 grid gap-3">{(items as any[]).map((item:any)=><a key={item.id} href={`/${type === "blog" ? "blog" : type}/${item.slug}`} className="ml-card p-5"><span className="font-semibold">{item.name || item.title}</span></a>)}</div></section>)}</div>}</main>;
}
