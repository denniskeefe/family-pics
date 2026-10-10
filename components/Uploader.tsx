"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { buildPathname } from "@/lib/paths";
import { savePhotoInfo } from "@/app/actions";

const field =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200";

export default function Uploader({ name }: { name: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [people, setPeople] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return setStatus("Please choose image files.");
    setBusy(true);
    let failed = 0;
    const hasInfo = year || location || people;
    for (let i = 0; i < list.length; i++) {
      setStatus(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const blob = await upload(buildPathname(name, list[i].name), list[i], {
          access: "private",
          handleUploadUrl: "/api/upload",
          contentType: list[i].type,
        });
        if (hasInfo) {
          await savePhotoInfo(blob.pathname, {
            year: year ? Number(year) : undefined,
            location,
            people: people.split(","),
          });
        }
      } catch {
        failed++;
      }
    }
    setBusy(false);
    setStatus(failed ? `${failed} photo(s) failed to upload.` : "Done!");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-sm text-stone-500 hover:text-stone-800 hover:underline"
        >
          {open ? "Hide details" : "Add details first"}
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {busy ? "Uploading…" : "Upload photos"}
        </button>
      </div>
      {open && (
        <div className="flex flex-wrap justify-end gap-2">
          <input
            className={`${field} w-24`}
            placeholder="Year"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
          />
          <input
            className={`${field} w-40`}
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            className={`${field} w-48`}
            placeholder="People (comma separated)"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </div>
      )}
      {status && <span className="text-sm text-stone-500">{status}</span>}
    </div>
  );
}
