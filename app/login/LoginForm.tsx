"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const input =
    "w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200";
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium text-stone-700">
        Your name
        <input name="name" required maxLength={40} autoComplete="name" className={`${input} mt-1`} />
      </label>
      <label className="block text-sm font-medium text-stone-700">
        Family password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={`${input} mt-1`}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-amber-700 py-2.5 font-medium text-white transition hover:bg-amber-800 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
