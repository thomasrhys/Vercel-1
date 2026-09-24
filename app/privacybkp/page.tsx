// app/privacy/page.tsx
"use client";

import React, { useEffect, useState } from "react";

const thirdPartyServices = [
  { name: "GitHub", enPurpose: "Source code hosting and version control", href: "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" },
  { name: "Vercel", enPurpose: "Website hosting, deployments, and Blob storage", href: "https://vercel.com/legal/privacy-policy" },
  { name: "Supabase", enPurpose: "Database, login, sign up, authentication, and backend services", href: "https://supabase.com/privacy" },
  { name: "Cloudflare", enPurpose: "DNS and Email delivery", href: "https://cloudflare.com/policies/privacy" },
];

export default function PrivacyPage() {
  const [lang, setLang] = useState<"en" | "cy">("en");
  const [welshData, setWelshData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch saved preference from localstorage on launch
    const savedLang = localStorage.getItem("preferredLanguage") || localStorage.getItem("lang");
    if (savedLang === "cy") {
      setLang("cy");
    }

    // 2. Pre-fetch Welsh strings from server cache in background
    fetch("/api/translate-policy", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setWelshData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLanguageToggle = (selectedLang: "en" | "cy") => {
    setLang(selectedLang);
    localStorage.setItem("preferredLanguage", selectedLang); // Saves preference across fnfaw.es
  };

  const isWelsh = lang === "cy" && welshData;

  // Render text mappings dynamically based on state validation
  const headings = {
    title: isWelsh ? welshData.headings.title : "Privacy Policy",
    info: isWelsh ? welshData.headings.info : "Information We Collect",
    use: isWelsh ? welshData.headings.use : "How We Use Information",
    login: isWelsh ? welshData.headings.login : "Account Login",
    games: isWelsh ? welshData.headings.games : "Third-Party Games",
    email: isWelsh ? welshData.headings.email : "Email Notifications",
    children: isWelsh ? welshData.headings.children : "Children's Privacy",
    retention: isWelsh ? welshData.headings.retention : "Data Retention",
    thirdParty: isWelsh ? welshData.headings.thirdParty : "Third-Party Services",
    contact: isWelsh ? welshData.headings.contact : "Contact",
    btnBack: isWelsh ? welshData.headings.btnBack : "Back to Games",
    thService: isWelsh ? welshData.headings.thService : "Service",
    thPurpose: isWelsh ? welshData.headings.thPurpose : "Purpose",
    thPolicy: isWelsh ? welshData.headings.thPolicy : "Privacy Policy",
    linkText: isWelsh ? welshData.headings.linkText : "View policy",
    contactText: isWelsh ? welshData.headings.contactText : "For privacy questions, general enquiries, bug reports, or suggestions, contact us at",
    copyrightText: isWelsh ? welshData.headings.copyrightText : "For copyright, DMCA, trademark, or content removal concerns, contact",
    effectiveDate: isWelsh ? welshData.headings.effectiveDate : "Effective Date: 1 July 2026",
    lastUpdated: isWelsh ? welshData.headings.lastUpdated : "Last Updated: 1 July 2026",
  };

  const paragraphs = {
    intro: isWelsh ? welshData.paragraphs.intro : "This Privacy Policy applies to Game Portal and explains how information is handled when you use this website.",
    infoText: isWelsh ? welshData.paragraphs.infoText : "Players can browse and play games without creating an account. If you use the Request a Game form, we collect the game name you submit, any optional link, and any optional comments you provide.",
    useText: isWelsh ? welshData.paragraphs.useText : "Game request information is used to review possible games to add to the portal, count how many times a game has been requested, and send a notification email to the site administrator.",
    loginText: isWelsh ? welshData.paragraphs.loginText : "Account login, sign up, and authentication are provided using Supabase. You may sign in using an email and password, a phone number, a Google account, a GitHub account, or any other authentication methods that Game Portal may offer in the future.",
    gamesText: isWelsh ? welshData.paragraphs.gamesText : "Some games may be embedded from third-party websites. Those websites may have their own privacy policies, cookies, analytics, or tracking. We do not control third-party game providers.",
    emailText: isWelsh ? welshData.paragraphs.emailText : "Game requests may send an email notification to the site owner using Resend. The content of the request may be included in that notification.",
    childrenText: isWelsh ? welshData.paragraphs.childrenText : "Game Portal is not specifically directed at children. We do not knowingly collect personal information from children. The Request a Game form should not be used to submit personal information. If we become aware that personal information has been submitted by a child, we will take reasonable steps to remove it.",
    retentionText: isWelsh ? welshData.paragraphs.retentionText : "Game requests may be stored until they are reviewed, completed, or removed by an administrator.",
    thirdPartyText: isWelsh ? welshData.paragraphs.thirdPartyText : "This website relies on trusted third-party services to operate. These services operate independently and process information according to their own privacy policies.",
  };

  const getServicePurpose = (name: string, defaultEn: string) => {
    if (!isWelsh) return defaultEn;
    if (name === "GitHub") return welshData.paragraphs.githubPurpose;
    if (name === "Vercel") return welshData.paragraphs.vercelPurpose;
    if (name === "Supabase") return welshData.paragraphs.supabasePurpose;
    if (name === "Cloudflare") return welshData.paragraphs.cloudflarePurpose;
    return defaultEn;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading preferences...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Language Selection Buttons */}
        <div className="flex justify-end space-x-2 text-xs">
          <button onClick={() => handleLanguageToggle("en")} className={`px-2 py-1 rounded ${lang === "en" ? "bg-primary text-primary-foreground font-bold" : "border"}`}>English</button>
          <button onClick={() => handleLanguageToggle("cy")} className={`px-2 py-1 rounded ${lang === "cy" ? "bg-primary text-primary-foreground font-bold" : "border"}`}>Cymraeg</button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">{headings.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{headings.effectiveDate}<br />{headings.lastUpdated}</p>
        </div>

        <section className="space-y-3 text-sm text-muted-foreground leading-6">
          <p>{paragraphs.intro}</p>
          <h2 className="text-xl font-semibold text-foreground">{headings.info}</h2>
          <p>{paragraphs.infoText}</p>
          <h2 className="text-xl font-semibold text-foreground">{headings.use}</h2>
          <p>{paragraphs.useText}</p>
          <h2 className="text-xl font-semibold text-foreground">{headings.login}</h2>
          <p>{paragraphs.loginText}</p>
          <h2 className="text-xl font-semibold text-foreground">{headings.games}</h2>
          <p>{paragraphs.gamesText}</p>
          <h2 className="text-xl font-semibold text-foreground">{headings.email}</h2>
          <p>{paragraphs.emailText}</p>
          <h2 className="text-xl font-semibold text-foreground">{headings.children}</h2>
          <p>{paragraphs.childrenText}</p>
          <h2 className="text-xl font-semibold text-foreground">{headings.retention}</h2>
          <p>{paragraphs.retentionText}</p>
          <h2 className="text-xl font-semibold text-foreground">{headings.thirdParty}</h2>
          <p>{paragraphs.thirdPartyText}</p>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="p-3 font-medium">{headings.thService}</th>
                  <th className="p-3 font-medium">{headings.thPurpose}</th>
                  <th className="p-3 font-medium">{headings.thPolicy}</th>
                </tr>
              </thead>
              <tbody>
                {thirdPartyServices.map((service) => (
                  <tr key={service.name} className="border-t border-border">
                    <td className="p-3 text-foreground">{service.name}</td>
                    <td className="p-3">{getServicePurpose(service.name, service.enPurpose)}</td>
                    <td className="p-3">
                      <a href={service.href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">{headings.linkText}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold text-foreground">{headings.contact}</h2>
          <p>{headings.contactText} <a className="text-primary underline underline-offset-4" href="mailto:contact@fnfaw.es">contact@fnfaw.es</a>.</p>
          <p>{headings.copyrightText} <a className="text-primary underline underline-offset-4" href="mailto:copyright@fnfaw.es">copyright@fnfaw.es</a>.</p>
        </section>

        <a href="/" className="inline-block px-4 py-2 rounded-md border border-border text-sm">{headings.btnBack}</a>
      </div>
    </main>
  );
}
