import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listPhotos } from "@/lib/photos";
import { logout } from "./actions";
import Uploader from "@/components/Uploader";
import Gallery from "@/components/Gallery";

export default function Home() {
  return (
    <Suspense fallback={<p className="p-8 text-stone-500">Loading…</p>}>
      <Photos />
    </Suspense>
  );
}

async function Photos() {
  const session = await getSession();
  if (!session) redirect("/login");
  const photos = await listPhotos();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-stone-800">Family Photos</h1>
          <p className="text-sm text-stone-500">
            Signed in as {session.name} · {photos.length} photo{photos.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Uploader name={session.name} />
          <form action={logout}>
            <button className="text-sm text-stone-500 hover:text-stone-800 hover:underline">Sign out</button>
          </form>
        </div>
      </header>
      <Gallery photos={photos} me={session.name} />
    </main>
  );
}
