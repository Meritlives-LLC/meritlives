 "use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="ml-container flex min-h-[60vh] items-center py-20">
      <div>
        <p className="ml-eyebrow">Something went wrong</p>
        <h1 className="mt-4 text-4xl font-extrabold">We could not load this page.</h1>
        <button onClick={() => reset()} className="ml-btn ml-btn-primary mt-8">
          Try again
        </button>
      </div>
    </main>
  );
}
