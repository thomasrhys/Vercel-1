// components/CopyLinkButton.tsx
"use client";

export default function CopyLinkButton({ username }: { username: string }) {
  return (
    <button
      onClick={async () => {
        const profileUrl = `${window.location.origin}/${username}`;
        try {
          await navigator.clipboard.writeText(profileUrl);
          alert("Profile link copied!");
        } catch {
          window.location.href = profileUrl;
        }
      }}
      className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      title="Copy profile link to clipboard"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      </svg>
      Copy Profile Link
    </button>
  );
}
