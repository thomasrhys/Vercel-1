// app/[username]/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleRetry = () => {
    // Let React finish its current cycle, then reload
    setTimeout(() => {
      window.location.reload();
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">500</h1>
        <p className="text-muted-foreground text-lg">
          Internal Server Error
        </p>
        <p className="text-sm text-muted-foreground">
          We're sorry, something went wrong while loading this profile. Please try again later.
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <a
            href="/"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Go Home
          </a>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
