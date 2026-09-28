import type { ReactNode } from "react";
import { api } from "../lib/api";

export function iconButtonClass(): string {
  return "grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50";
}

export const deleteButtonClass = "grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-600 hover:bg-red-600 hover:text-white dark:text-neutral-300 dark:hover:bg-red-900 dark:hover:text-white";

export function Layout({ children, showLogout = true }: { children: ReactNode; showLogout?: boolean }) {
  async function logout() {
    await api("/api/logout", { method: "POST" });
    window.location.assign("/login");
  }
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <a className="font-bold tracking-tight" href="/">
            Command Center
          </a>
          {showLogout && (
            <button
              className="h-8 rounded-md border border-neutral-200 px-4 text-sm text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
              onClick={logout}
            >
              Log out
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="text-sm text-neutral-700 dark:text-neutral-300" role="alert">
      {message}
    </p>
  ) : null;
}
