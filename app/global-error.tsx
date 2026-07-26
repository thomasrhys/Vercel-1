// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">500</h1>
            <p className="text-muted-foreground text-lg">
              Internal Server Error
            </p>
            <p className="text-sm text-muted-foreground">
              Something went wrong. Please try again later.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
