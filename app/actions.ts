"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import {
  createSession,
  destroySession,
  getSession,
} from "@/lib/session";
import { PHOTO_PREFIX, sanitize } from "@/lib/paths";

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
  await del(pathname);
  revalidatePath("/");
}
