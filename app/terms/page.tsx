const thirdPartyServices = [
  {
    name: "GitHub",
    purpose: "Source code hosting and version control",
    href: "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service",
  },
  {
    name: "Vercel",
    purpose: "Website hosting, deployments, and Blob storage",
    href: "https://vercel.com/legal/terms",
  },
  {
    name: "Supabase",
    purpose: "Database, login, sign up, authentication, and backend services",
    href: "https://supabase.com/terms",
  },
  {
    name: "Resend",
    purpose: "Email delivery for game request notifications",
    href: "https://resend.com/legal/terms-of-service",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Terms of Use</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Effective Date: 27 June 2026
            <br />
            Last Updated: 1 July 2026
          </p>
        </div>

        <section className="space-y-3 text-sm text-muted-foreground leading-6">
          <p>
            By using Game Portal, you agree to these Terms of Use. If you do not agree, please do not use the site.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Use of the Site</h2>
          <p>
            Game Portal is provided as a browser-based games portal. You may use the site for normal personal use.
            You must not abuse, attack, scrape, spam, or attempt to disrupt the website or its services.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Accounts and Sign In</h2>
          <p>
            You may sign in using an email and password, a phone number, a Google account, a GitHub account, or any other
            authentication methods that Game Portal may offer in the future. You are responsible for keeping your account secure.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Game Requests</h2>
          <p>
            You may request games using the Request a Game form. Submitting a request does not guarantee that the
            game will be added. Requests may be ignored, completed, or deleted at the site owner&apos;s discretion.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Third-Party Content</h2>
          <p>
            Some games may be hosted by third parties or belong to their original creators. Game Portal does not claim
            ownership of third-party games, trademarks, artwork, or related content.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Copyright and Content Removal</h2>
          <p>
            If you believe content on this website infringes your copyright, trademark, or other rights, contact us at{" "}
            <a className="text-primary underline underline-offset-4" href="mailto:copyright@requests.fnfaw.es">
              copyright@requests.fnfaw.es
            </a>. We may remove or restrict content at our discretion.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Availability</h2>
          <p>
            The site may change, break, go offline, or remove games at any time. No guarantee is made that every game
            will work on every device, browser, or network.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Desktop-Only Games</h2>
          <p>
            Some games may be marked as desktop-only, especially games using technology that may not work properly on
            phones or tablets. These games may be blocked or limited on mobile devices.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Third-Party Services</h2>
          <p>
            This website relies on trusted third-party services to operate. Use of those services may also be subject to
            their own terms and policies.
          </p>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="p-3 font-medium">Service</th>
                  <th className="p-3 font-medium">Purpose</th>
                  <th className="p-3 font-medium">Terms</th>
                </tr>
              </thead>
              <tbody>
                {thirdPartyServices.map((service) => (
                  <tr key={service.name} className="border-t border-border">
                    <td className="p-3 text-foreground">{service.name}</td>
                    <td className="p-3">{service.purpose}</td>
                    <td className="p-3">
                      <a href={service.href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                        View terms
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold text-foreground">No Warranties</h2>
          <p>
            Game Portal is provided as-is, without warranties of any kind. Use the site at your own risk.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Changes to These Terms</h2>
          <p>
            These terms may be updated from time to time. Continued use of the site after changes means you accept the
            updated terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            For general enquiries, feedback, privacy questions, or bug reports, contact{" "}
            <a className="text-primary underline underline-offset-4" href="mailto:tom@requests.fnfaw.es">
              tom@requests.fnfaw.es
            </a>.
          </p>
          <p>
            For copyright, DMCA, trademark, or content removal concerns, contact{" "}
            <a className="text-primary underline underline-offset-4" href="mailto:copyright@requests.fnfaw.es">
              copyright@requests.fnfaw.es
            </a>.
          </p>
        </section>

        <a href="/" className="inline-block px-4 py-2 rounded-md border border-border text-sm">
          Back to Games
        </a>
      </div>
    </main>
  );
}
