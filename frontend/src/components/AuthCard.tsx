import type { ReactNode } from "react";

/** The centred white box used by login, signup and password pages. */
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-surface px-4 py-12">
      <div className="card mx-auto max-w-md p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
