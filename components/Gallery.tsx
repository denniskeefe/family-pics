"use client";

import { useEffect, useState, useTransition } from "react";
import type { Photo } from "@/lib/photos";
import { sanitize } from "@/lib/paths";
import { deletePhoto } from "@/app/actions";

const src = (p: Photo) => `/api/photo/${p.pathname.split("/").map(encodeURIComponent).join("/")}`;

export default function Gallery({ photos, me }: { photos: Photo[]; me: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : Math.min(i + 1, photos.length - 1)));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : Math.max(i - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  if (!photos.length) {
    return <p className="py-20 text-center text-stone-500">No photos yet — be the first to upload one.</p>;
  }

  const current = open !== null ? photos[open] : null;
  const mine = (p: Photo) => p.uploader === sanitize(me);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.pathname}>
            <button
              onClick={() => setOpen(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-stone-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src(p)}
                alt={`Uploaded by ${p.uploader}`}
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between text-sm text-stone-200" onClick={(e) => e.stopPropagation()}>
            <span>
              {current.uploader} · {new Date(current.uploadedAt).toLocaleDateString()}
            </span>
            <div className="flex gap-4">
              <a href={src(current)} download={current.filename} className="hover:underline">
                Download
              </a>
              {mine(current) && (
                <button
                  disabled={pending}
                  className="text-red-300 hover:underline"
                  onClick={() => {
                    if (!confirm("Delete this photo for everyone?")) return;
                    start(async () => {
                      await deletePhoto(current.pathname);
                      setOpen(null);
                    });
                  }}
                >
                  Delete
                </button>
              )}
              <button onClick={() => setOpen(null)} className="hover:underline">
                Close
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(current)} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex justify-between text-stone-200" onClick={(e) => e.stopPropagation()}>
            <button disabled={open === 0} onClick={() => setOpen(open! - 1)} className="px-3 py-1 disabled:opacity-30">
              ← Prev
            </button>
            <button
              disabled={open === photos.length - 1}
              onClick={() => setOpen(open! + 1)}
              className="px-3 py-1 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
