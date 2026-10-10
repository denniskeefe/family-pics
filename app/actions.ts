"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import {
  createSession,
  destroySession,
  getSession,
} from "@/lib/session";
import { put } from "@vercel/blob";
import { PHOTO_PREFIX, metaPathname, sanitize } from "@/lib/paths";
import type { PhotoMeta } from "@/lib/photos";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  if (!name) return { error: "Please enter your name." };

  await createSession(name);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function deletePhoto(pathname: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!pathname.startsWith(PHOTO_PREFIX)) return;
  const [, uploader] = pathname.slice(PHOTO_PREFIX.length).split("__");
  const owner = uploader === sanitize(session.name);
  if (!owner) return;
  await del([pathname, metaPathname(pathname)]);
  revalidatePath("/");
}

export async function savePhotoInfo(pathname: string, input: PhotoMeta) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!pathname.startsWith(PHOTO_PREFIX) || pathname.includes("..")) return;

  const year = Number(input.year);
  const meta: PhotoMeta = {
    year: Number.isInteger(year) && year >= 1800 && year <= 2100 ? year : undefined,
    location: (input.location ?? "").trim().slice(0, 100),
    caption: (input.caption ?? "").trim().slice(0, 500),
    people: [
      ...new Set(
        (input.people ?? []).map((p) => p.trim().slice(0, 40)).filter(Boolean),
      ),
    ].slice(0, 30),
  };
  await put(metaPathname(pathname), JSON.stringify(meta), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    addRandomSuffix: false,
  });
  revalidatePath("/");
}
