import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <span className="grid size-9 place-items-center rounded-xl bg-surface text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

export function AdminPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const statusClasses: Record<string, string> = {
  available: "bg-success text-success-foreground",
  reserved: "bg-warning text-warning-foreground",
  sold: "bg-foreground text-background",
  Pending: "bg-warning text-warning-foreground",
  Contacted: "bg-surface text-foreground",
  Confirmed: "bg-accent text-accent-foreground",
  Completed: "bg-success text-success-foreground",
  Cancelled: "bg-destructive text-destructive-foreground",
  Active: "bg-success text-success-foreground",
  Inactive: "bg-surface text-muted-foreground",
};

export function AdminStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusClasses[status] ?? "bg-surface text-foreground"}`}
    >
      {status}
    </span>
  );
}
