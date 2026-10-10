import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in · Family Photos" };

async function RedirectIfSignedIn() {
  if (await getSession()) redirect("/");
  return null;
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <h1 className="font-serif text-3xl text-stone-800">Family Photos</h1>
        <p className="mt-1 mb-6 text-sm text-stone-500">
          A private place for the family. Enter your name to continue.
        </p>
        <LoginForm />
        <Suspense>
          <RedirectIfSignedIn />
        </Suspense>
      </div>
    </main>
  );
}
