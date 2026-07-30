// app/[username]/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isBlocked = error.message === 'You are blocked';
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">{isBlocked ? '403' : '500'}</h1>
        <p className="text-muted-foreground text-lg">
          {isBlocked ? 'Access Denied' : 'Internal Server Error'}
        </p>
        <p className="text-sm text-muted-foreground">
          {isBlocked 
            ? "You are blocked by this user and cannot view their profile."
            : "We're sorry, something went wrong while loading this profile. Please try again later."}
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <a
            href="/"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Go Home
          </a>
          {!isBlocked && (
            <button
              onClick={reset}
              className="px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
