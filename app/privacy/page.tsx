import { headers } from "next/headers";

const thirdPartyServices = [
  {
    name: "GitHub",
    purpose: "Source code hosting and version control",
    href: "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
  },
  {
    name: "Vercel",
    purpose: "Website hosting, deployments, and Blob storage",
    href: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Supabase",
    purpose: "Database, login, sign up, authentication, and backend services",
    href: "https://supabase.com/privacy",
  },
  {
    name: "Resend",
    purpose: "Email delivery for game request notifications",
    href: "https://resend.com/legal/privacy-policy",
  },
];

export default async function PrivacyPage() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "this website";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const siteUrl = host === "this website" ? "this website" : `${protocol}://${host}`;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Effective Date: 27 June 2026
            <br />
            Last Updated: 1 July 2026
          </p>
        </div>

        <section className="space-y-3 text-sm text-muted-foreground leading-6">
          <p>
            This Privacy Policy applies to Game Portal at <strong className="text-foreground">{siteUrl}</strong> and explains how information is handled when you use this website.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
          <p>
            Players can browse and play games without creating an account. If you use the Request a Game form,
            we collect the game name you submit, any optional link, and any optional comments you provide.
          </p>

          <h2 className="text-xl font-semibold text-foreground">How We Use Information</h2>
          <p>
            Game request information is used to review possible games to add to the portal, count how many times a game
            has been requested, and send a notification email to the site administrator.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Account Login</h2>
          <p>
            Account login, sign up, and authentication are provided using Supabase. You may sign in using an email and password,
            a phone number, a Google account, a GitHub account, or any other authentication methods that Game Portal may offer in the future.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Third-Party Games</h2>
          <p>
            Some games may be embedded from third-party websites. Those websites may have their own privacy policies,
            cookies, analytics, or tracking. We do not control third-party game providers.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Email Notifications</h2>
          <p>
            Game requests may send an email notification to the site owner using Resend. The content of the request may
            be included in that notification.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Children&apos;s Privacy</h2>
          <p>
            Game Portal is not specifically directed at children. We do not knowingly collect personal information from
            children. The Request a Game form should not be used to submit personal information. If we become aware that
            personal information has been submitted by a child, we will take reasonable steps to remove it.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Data Retention</h2>
          <p>
            Game requests may be stored until they are reviewed, completed, or removed by an administrator.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Third-Party Services</h2>
          <p>
            This website relies on trusted third-party services to operate. These services operate independently and
            process information according to their own privacy policies.
          </p>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="p-3 font-medium">Service</th>
                  <th className="p-3 font-medium">Purpose</th>
                  <th className="p-3 font-medium">Privacy Policy</th>
                </tr>
              </thead>
              <tbody>
                {thirdPartyServices.map((service) => (
                  <tr key={service.name} className="border-t border-border">
                    <td className="p-3 text-foreground">{service.name}</td>
                    <td className="p-3">{service.purpose}</td>
                    <td className="p-3">
                      <a href={service.href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                        View policy
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            For privacy questions, general enquiries, bug reports, or suggestions, contact us at{" "}
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
