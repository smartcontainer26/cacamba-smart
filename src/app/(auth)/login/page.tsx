import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/30">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Caçamba <span className="text-accent">Smart</span>
        </h1>
        <p className="mt-2 text-sm text-text-muted">Acesse sua conta</p>
      </div>
      <LoginForm />
    </div>
  );
}
