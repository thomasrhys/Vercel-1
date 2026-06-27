import AdminPageClient from "./AdminPageClient";

export default function AdminPage() {
  return (
    <>
      <div className="bg-background p-4 sm:px-8 sm:pt-8 sm:pb-0">
        <div className="max-w-2xl mx-auto grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Admin Utilities</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Settings, maintenance mode, backups, broken game checker, and recent activity.
            </p>
            <a
              href="/admin/utilities"
              className="inline-block mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Open Utilities
            </a>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Category Manager</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add, rename, delete, and emoji-label game categories.
            </p>
            <a
              href="/admin/categories"
              className="inline-block mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Open Categories
            </a>
          </div>
        </div>
      </div>
      <AdminPageClient />
    </>
  );
}
