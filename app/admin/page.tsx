import AdminPageClient from "./AdminPageClient";

export default function AdminPage() {
  return (
    <>
      <div className="bg-background px-4 sm:px-8 pt-4 sm:pt-8">
        <div className="max-w-2xl mx-auto grid gap-3 sm:grid-cols-3">
          <a
            href="/admin/utilities"
            className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition"
          >
            <p className="text-xs text-muted-foreground">Utilities</p>
            <p className="text-2xl font-bold text-foreground">Open →</p>
          </a>

          <a
            href="/admin/bulk"
            className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition"
          >
            <p className="text-xs text-muted-foreground">Bulk Actions</p>
            <p className="text-2xl font-bold text-foreground">Open →</p>
          </a>

          <a
            href="/admin/descriptions"
            className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition"
          >
            <p className="text-xs text-muted-foreground">Descriptions</p>
            <p className="text-2xl font-bold text-foreground">Open →</p>
          </a>
        </div>
      </div>
      <AdminPageClient />
    </>
  );
}
