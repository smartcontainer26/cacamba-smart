// Server component reutilizável. Cada rota nova começa como
// <PlaceholderPage title="..." /> e ganha conteúdo real depois.

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="px-8 py-10">
      <h1 className="text-2xl font-semibold">Em construção — {title}</h1>
    </div>
  );
}
