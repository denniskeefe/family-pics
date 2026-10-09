"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { buildPathname } from "@/lib/paths";

export default function Uploader({ name }: { name: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return setStatus("Please choose image files.");
    setBusy(true);
    let failed = 0;
    for (let i = 0; i < list.length; i++) {
      setStatus(`Uploading ${i + 1} of ${list.length}…`);
      try {
        await upload(buildPathname(name, list[i].name), list[i], {
          access: "private",
          handleUploadUrl: "/api/upload",
          contentType: list[i].type,
        });
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
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload photos"}
      </button>
      {status && <span className="text-sm text-stone-500">{status}</span>}
    </div>
  );
}
