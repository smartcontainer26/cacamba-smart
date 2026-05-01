// Server Component. Usa <form action={...}> pra invocar a Server Action
// de logout — sem precisar de "use client" nem hooks.

import { logout } from "./logout-action";

export function LogoutButton() {
  return (
    <form action={logout} className="w-full">
      <button
        type="submit"
        className="w-full rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
      >
        Sair
      </button>
    </form>
  );
}
