// Layout das páginas autenticadas. Por enquanto é só um wrapper —
// vai crescer com sidebar/topbar nas próximas etapas.

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen">{children}</div>;
}
