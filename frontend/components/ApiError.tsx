export default function ApiError({
  message = "Content is temporarily unavailable.",
}: {
  message?: string;
}) {
  return (
    <div role="alert" className="rounded-xl border p-6">
      <h2 className="font-semibold">Unable to load content</h2>
      <p className="mt-2 text-sm opacity-75">{message}</p>
    </div>
  );
}
