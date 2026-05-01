// Profile e auth são resolvidos em (app)/layout.tsx. Aqui é só
// o conteúdo central da rota /dashboard.

export default function DashboardPage() {
  return (
    <div className="px-8 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-6 text-sm text-text-muted">
        KPIs e widgets vêm na próxima etapa.
      </p>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-text-muted">Dashboard placeholder.</p>
      </div>
    </div>
  );
}
