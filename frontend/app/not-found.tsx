import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ml-container flex min-h-[60vh] items-center py-20">
      <div>
        <p className="ml-eyebrow">404</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight">Page not found.</h1>
        <p className="mt-4 max-w-xl text-slate-600">
          The page you requested does not exist or may have moved.
        </p>
        <Link href="/" className="ml-btn ml-btn-primary mt-8">
          Return home
        </Link>
      </div>
    </main>
  );
}
