import { headers } from "next/headers";

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
            Last updated: 26 June 2026
          </p>
        </div>

        <section className="space-y-3 text-sm text-muted-foreground leading-6">
          <p>
            This Privacy Policy applies to Game Portal at <strong className="text-foreground">{siteUrl}</strong> and explains how information is handled when you use this website.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Information we collect</h2>
          <p>
            Players can browse and play games without creating an account. If you use the Request a Game form,
            we collect the game name you submit, any optional link, and any optional comments you provide.
          </p>

          <h2 className="text-xl font-semibold text-foreground">How we use information</h2>
          <p>
            Game request information is used to review possible games to add to the portal and to count how many
            times a game has been requested.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Admin login</h2>
          <p>
            Admin access is protected using Clerk. Regular players do not need to sign in. Clerk may process login
            information for admin users according to its own privacy practices.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Third-party games</h2>
          <p>
            Some games may be embedded from third-party websites. Those websites may have their own privacy policies,
            cookies, or tracking. We do not control third-party game providers.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Email notifications</h2>
          <p>
            Game requests may send an email notification to the site owner using Resend. The content of the request
            may be included in that notification.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Data retention</h2>
          <p>
            Game requests may be kept until they are reviewed, completed, or deleted by an admin.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            To ask about privacy or request removal of a submitted request, contact the site owner through the domain
            or contact method where this portal is hosted.
          </p>
        </section>

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
