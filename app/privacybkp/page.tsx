import { headers } from "next/headers";
import React from "react";

const thirdPartyServices = [
  {
    name: "GitHub",
    purpose: "Source code hosting and version control",
    href: "https://github.com",
  },
  {
    name: "Vercel",
    purpose: "Website hosting, deployments, and Blob storage",
    href: "https://vercel.com",
  },
  {
    name: "Supabase",
    purpose: "Database, login, sign up, authentication, and backend services",
    href: "https://supabase.com",
  },
  {
    name: "Cloudflare",
    purpose: "DNS and Email delivery",
    href: "https://cloudflare.com",
  },
];

// Asynchronous worker hitting Techiaith's external API
async function translateText(englishText: string): Promise<string> {
  try {
    const res = await fetch("https://api.techiaith.cymru/translate/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: englishText,
        src: "en",
        tgt: "cy",
      }),
      next: { revalidate: 86400 }, // Cache translated string for 24 hours on Vercel
    });

    if (!res.ok) throw new Error("Techiaith API response failed");
    const data = await res.json();
    return data.text || englishText;
  } catch (error) {
    console.error("Welsh translation fallback triggered:", error);
    return englishText;
  }
}
export default async function PrivacyPage() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "this website";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const siteUrl = host === "this website" ? "this website" : `${protocol}://${host}`;

  const headings = {
    title: "Privacy Policy",
    info: "Information We Collect",
    use: "How We Use Information",
    login: "Account Login",
    games: "Third-Party Games",
    email: "Email Notifications",
    children: "Children's Privacy",
    retention: "Data Retention",
    thirdParty: "Third-Party Services",
    contact: "Contact",
  };

  const paragraphs = {
    intro: `This Privacy Policy applies to Game Portal at ${siteUrl} and explains how information is handled when you use this website.`,
    infoText: "Players can browse and play games without creating an account. If you use the Request a Game form, we collect the game name you submit, any optional link, and any optional comments you provide.",
    useText: "Game request information is used to review possible games to add to the portal, count how many times a game has been requested, and send a notification email to the site administrator.",
    loginText: "Account login, sign up, and authentication are provided using Supabase. You may sign in using an email and password, a phone number, a Google account, a GitHub account, or any other authentication methods that Game Portal may offer in the future.",
    gamesText: "Some games may be embedded from third-party websites. Those websites may have their own privacy policies, cookies, analytics, or tracking. We do not control third-party game providers.",
    emailText: "Game requests may send an email notification to the site owner using Resend. The content of the request may be included in that notification.",
    childrenText: "Game Portal is not specifically directed at children. We do not knowingly collect personal information from children. The Request a Game form should not be used to submit personal information. If we become aware that personal information has been submitted by a child, we will take reasonable steps to remove it.",
    retentionText: "Game requests may be stored until they are reviewed, completed, or removed by an administrator.",
    thirdPartyText: "This website relies on trusted third-party services to operate. These services operate independently and process information according to their own privacy policies.",
  };

  const [
    cyTitle, cyInfo, cyUse, cyLogin, cyGames, cyEmail, cyChildren, cyRetention, cyThirdParty, cyContact,
    cyIntro, cyInfoText, cyUseText, cyLoginText, cyGamesText, cyEmailText, cyChildrenText, cyRetentionText, cyThirdPartyText
  ] = await Promise.all([
    translateText(headings.title), translateText(headings.info), translateText(headings.use),
    translateText(headings.login), translateText(headings.games), translateText(headings.email),
    translateText(headings.children), translateText(headings.retention), translateText(headings.thirdParty),
    translateText(headings.contact), translateText(paragraphs.intro), translateText(paragraphs.infoText),
    translateText(paragraphs.useText), translateText(paragraphs.loginText), translateText(paragraphs.gamesText),
    translateText(paragraphs.emailText), translateText(paragraphs.childrenText), translateText(paragraphs.retentionText),
    translateText(paragraphs.thirdPartyText),
  ]);

  const cyTableServices = await Promise.all(
    thirdPartyServices.map(async (service) => ({
      name: service.name,
      purpose: await translateText(service.purpose),
      href: service.href,
    }))
  );

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Welsh Section */}
        <div className="space-y-6 border-b border-border pb-12">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{cyTitle} (Cymraeg)</h1>
            <p className="text-sm text-muted-foreground mt-2">Dyddiad Effeithiol: 1 Gorffennaf 2026<br />Diweddarwyd Diwethaf: 1 Gorffennaf 2026</p>
          </div>
          <section className="space-y-3 text-sm text-muted-foreground leading-6">
            <p>{cyIntro}</p>
            <h2 className="text-xl font-semibold text-foreground">{cyInfo}</h2>
            <p>{cyInfoText}</p>
            <h2 className="text-xl font-semibold text-foreground">{cyUse}</h2>
            <p>{cyUseText}</p>
            <h2 className="text-xl font-semibold text-foreground">{cyLogin}</h2>
            <p>{cyLoginText}</p>
            <h2 className="text-xl font-semibold text-foreground">{cyGames}</h2>
            <p>{cyGamesText}</p>
            <h2 className="text-xl font-semibold text-foreground">{cyEmail}</h2>
            <p>{cyEmailText}</p>
            <h2 className="text-xl font-semibold text-foreground">{cyChildren}</h2>
            <p>{cyChildrenText}</p>
            <h2 className="text-xl font-semibold text-foreground">{cyRetention}</h2>
            <p>{cyRetentionText}</p>
            <h2 className="text-xl font-semibold text-foreground">{cyThirdParty}</h2>
            <p>{cyThirdPartyText}</p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr>
                    <th className="p-3 font-medium">Gwasanaeth</th>
                    <th className="p-3 font-medium">Pwrpas</th>
                    <th className="p-3 font-medium">Polisi Preifatrwydd</th>
                  </tr>
                </thead>
                <tbody>
                  {cyTableServices.map((service) => (
                    <tr key={service.name} className="border-t border-border">
                      <td className="p-3 text-foreground">{service.name}</td>
                      <td className="p-3">{service.purpose}</td>
                      <td className="p-3">
                        <a href={service.href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Gweld y polisi</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="text-xl font-semibold text-foreground">{cyContact}</h2>
            <p>Ar gyfer cwestiynau, cysylltwch â ni yn <a className="text-primary underline underline-offset-4" href="mailto:tom@requests.fnfaw.es">tom@requests.fnfaw.es</a>.</p>
          </section>
        </div>

        {/* English Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy (English)</h1>
            <p className="text-sm text-muted-foreground mt-2">Effective Date: 1 July 2026<br />Last Updated: 1 July 2026</p>
          </div>
          <section className="space-y-3 text-sm text-muted-foreground leading-6">
            <p>This Privacy Policy applies to Game Portal at <strong className="text-foreground">{siteUrl}</strong>.</p>
            <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
            <p>{paragraphs.infoText}</p>
            <h2 className="text-xl font-semibold text-foreground">How We Use Information</h2>
            <p>{paragraphs.useText}</p>
            <h2 className="text-xl font-semibold text-foreground">Account Login</h2>
            <p>{paragraphs.loginText}</p>
            <h2 className="text-xl font-semibold text-foreground">Third-Party Games</h2>
            <p>{paragraphs.gamesText}</p>
            <h2 className="text-xl font-semibold text-foreground">Email Notifications</h2>
            <p>{paragraphs.emailText}</p>
            <h2 className="text-xl font-semibold text-foreground">Children&apos;s Privacy</h2>
            <p>{paragraphs.childrenText}</p>
            <h2 className="text-xl font-semibold text-foreground">Data Retention</h2>
            <p>{paragraphs.retentionText}</p>
            <h2 className="text-xl font-semibold text-foreground">Third-Party Services</h2>
            <p>{paragraphs.thirdPartyText}</p>
          </section>
        </div>

        <a href="/" className="inline-block px-4 py-2 rounded-md border border-border text-sm">
          Back to Games / Yn ôl i'r Gemau
        </a>
      </div>
    </main>
  );
}
