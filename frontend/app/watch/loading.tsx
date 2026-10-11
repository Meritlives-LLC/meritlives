import { WatchVideoLoading } from "../../components/WatchVideoGrid";

export default function WatchLoading() {
  return (
    <main className="ml-container min-h-[60vh] py-14 md:py-20" aria-live="polite">
      <div className="mb-10 border-b border-[#D5D8DE] pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CC1111]">Video · Ideas · Perspectives</p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-0.06em] text-[#0D0D0D] md:text-6xl" style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}>
          MERITLIVES <span className="text-[#CC1111]">Watch</span>
        </h1>
      </div>
      <WatchVideoLoading />
    </main>
  );
}
