export default function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="py-12 text-center" aria-live="polite">
      {label}
    </div>
  );
}
