import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWatchVideos } from "../../lib/watch-queries";
import { WatchPagination, WatchVideoGrid } from "../../components/WatchVideoGrid";

export const metadata: Metadata = {
  title: "MERITLIVES Watch",
  description: "Video stories, ideas and perspectives from MERITLIVES Watch.",
};

interface WatchPageProps {
  searchParams: { page?: string };
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const parsedPage = Number(searchParams.page ?? "1");
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  let result;

  try {
    result = await getWatchVideos(page, 12);
  } catch {
    return (
      <main className="ml-container min-h-[50vh] py-14 md:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CC1111]">Video · Ideas · Perspectives</p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-0.06em] text-[#0D0D0D] md:text-6xl" style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}>
          MERITLIVES <span className="text-[#CC1111]">Watch</span>
        </h1>
        <p role="status" className="mt-10 border-y border-[#D5D8DE] py-8 text-sm text-[#5D6472]">
          MERITLIVES Watch is temporarily unavailable. Please try again later.
        </p>
      </main>
    );
  }

  const lastPage = result.meta?.last_page ?? 1;
  if (page > lastPage && (result.meta?.total ?? 0) > 0) {
    redirect(lastPage > 1 ? `/watch?page=${lastPage}` : "/watch");
  }

  return (
    <main className="ml-container min-h-[60vh] py-14 md:py-20">
      <div className="mb-10 border-b border-[#D5D8DE] pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#CC1111]">Video · Ideas · Perspectives</p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-0.06em] text-[#0D0D0D] md:text-6xl" style={{ fontFamily: 'var(--font-grotesk), "Space Grotesk", sans-serif' }}>
          MERITLIVES <span className="text-[#CC1111]">Watch</span>
        </h1>
      </div>

      {result.data.length > 0 ? (
        <>
          <WatchVideoGrid videos={result.data} />
          <WatchPagination currentPage={result.meta?.current_page ?? page} lastPage={lastPage} />
        </>
      ) : (
        <p className="border-y border-[#D5D8DE] py-8 text-sm text-[#5D6472]">No Watch videos are available right now.</p>
      )}
    </main>
  );
}
