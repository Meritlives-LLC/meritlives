export default function FormFieldError({ id, messages, className = "mt-1 text-sm text-red-700" }: {
  id?: string;
  messages?: string[];
  className?: string;
}) {
  if (!messages?.length) return null;
  return <p id={id} className={className}>{messages.join(" ")}</p>;
}
