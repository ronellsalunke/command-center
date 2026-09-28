import { useState, type FormEvent } from "react";
import { ErrorMessage, Layout } from "../../components/layout";
import { api } from "../../lib/api";

export function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
      window.location.assign("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid credentials.");
      setBusy(false);
    }
  }

  return (
    <Layout showLogout={false}>
      <section className="mx-auto mt-12 max-w-sm rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-4 text-lg font-bold">Log in</h1>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input
              autoFocus
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-white px-2 py-2 font-normal dark:border-neutral-800 dark:bg-neutral-950"
            />
          </label>
          <ErrorMessage message={error} />
          <button
            disabled={busy}
            className="h-8 rounded-md bg-neutral-900 px-4 font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
          >
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      </section>
    </Layout>
  );
}
