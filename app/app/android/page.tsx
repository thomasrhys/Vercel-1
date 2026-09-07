import Link from "next/link";

export default function AndroidDownloadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card shadow-lg text-center">
         <h1 className="text-2xl font-bold mb-2">Download Game Portal</h1>
         <p className="text-muted-foreground mb-6 text-sm">
           Get the official Game Portal app for your device.
         </p>
         <a href="/GamePortal.apk" download="GamePortal.apk" className="inline-flex items-center justify-center w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity mb-4">
           Download APK
         </a>

         <Link href="/"
        className="text-xs text-muted-foreground hover:underline">
           Return to Games
         </Link>
       </div>
    </main>
  );
}
