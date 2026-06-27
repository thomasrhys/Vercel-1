import { Mail, ShieldAlert } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Use the correct email address below so your message reaches the right place.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">General Enquiries</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-6">
              Use this email for general questions, feedback, bug reports, privacy enquiries, and suggestions.
            </p>
            <a
              href="mailto:tom@requests.fnfaw.es"
              className="inline-block text-primary underline underline-offset-4 break-all"
            >
              tom@requests.fnfaw.es
            </a>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Copyright Enquiries</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-6">
              Use this email for copyright concerns, DMCA notices, trademark concerns, ownership disputes, or requests to remove games or content.
            </p>
            <a
              href="mailto:copyright@requests.fnfaw.es"
              className="inline-block text-primary underline underline-offset-4 break-all"
            >
              copyright@requests.fnfaw.es
            </a>
          </div>
        </section>

        <p className="text-sm text-muted-foreground leading-6">
          We aim to respond to enquiries as quickly as reasonably possible. Copyright and content removal enquiries are reviewed with priority where appropriate.
        </p>

        <a
          href="/"
          className="inline-block px-4 py-2 rounded-md border border-border text-sm"
        >
          Back to Games
        </a>
      </div>
    </main>
  );
}
