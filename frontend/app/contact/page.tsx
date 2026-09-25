import ContactForm from "../../components/ContactForm";

export const metadata = {
  title: "Contact | MERITLIVES LLC",
  description: "Contact MERITLIVES LLC.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider">Contact</p>
        <h1 className="mt-2 text-4xl font-bold">Let's build something meaningful.</h1>
      </header>
      <ContactForm />
    </main>
  );
}
