"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Photo } from "@/lib/photos";
import { sanitize } from "@/lib/paths";
import { deletePhoto, savePhotoInfo } from "@/app/actions";

const src = (p: Photo) => `/api/photo/${p.pathname.split("/").map(encodeURIComponent).join("/")}`;
const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const select =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 outline-none focus:border-amber-600";
const input =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-amber-600";

type Filters = { year: string; uploader: string; location: string; person: string; q: string };
const NO_FILTERS: Filters = { year: "", uploader: "", location: "", person: "", q: "" };

export default function Gallery({ photos, me }: { photos: Photo[]; me: string }) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [open, setOpen] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  const options = useMemo(
    () => ({
      years: uniq(photos.map((p) => p.year)).sort((a, b) => b - a),
      uploaders: uniq(photos.map((p) => p.uploader)).sort(),
      locations: uniq(photos.map((p) => p.location).filter(Boolean)).sort(),
      people: uniq(photos.flatMap((p) => p.people)).sort(),
    }),
    [photos],
  );

  const shown = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return photos.filter(
      (p) =>
        (!filters.year || p.year === Number(filters.year)) &&
        (!filters.uploader || p.uploader === filters.uploader) &&
        (!filters.location || p.location === filters.location) &&
        (!filters.person || p.people.includes(filters.person)) &&
        (!q || `${p.caption} ${p.location} ${p.people.join(" ")}`.toLowerCase().includes(q)),
    );
  }, [photos, filters]);

  useEffect(() => {
    if (open === null || editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : Math.min(i + 1, shown.length - 1)));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : Math.max(i - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, editing, shown.length]);

  const set = (k: keyof Filters) => (v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setOpen(null);
  };
  const active = Object.values(filters).some(Boolean);
  const current = open !== null ? shown[open] : null;
  const mine = (p: Photo) => p.uploader === sanitize(me);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search captions, places, people…"
          className={`${select} w-64`}
          value={filters.q}
          onChange={(e) => set("q")(e.target.value)}
        />
        <FilterSelect label="Year" value={filters.year} values={options.years} onChange={set("year")} />
        <FilterSelect label="Uploaded by" value={filters.uploader} values={options.uploaders} onChange={set("uploader")} />
        <FilterSelect label="Location" value={filters.location} values={options.locations} onChange={set("location")} />
        <FilterSelect label="Person" value={filters.person} values={options.people} onChange={set("person")} />
        {active && (
          <button onClick={() => setFilters(NO_FILTERS)} className="text-sm text-amber-700 hover:underline">
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-stone-500">
          {shown.length} of {photos.length}
        </span>
      </div>

      {!shown.length ? (
        <p className="py-20 text-center text-stone-500">
          {photos.length ? "No photos match those filters." : "No photos yet — be the first to upload one."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p, i) => (
            <li key={p.pathname}>
              <button
                onClick={() => {
                  setEditing(false);
                  setOpen(i);
                }}
                className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-stone-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src(p)}
                  alt={p.caption || `Uploaded by ${p.uploader}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between text-sm text-stone-200" onClick={(e) => e.stopPropagation()}>
            <span>
              {current.uploader} · {current.year}
              {current.location && ` · ${current.location}`}
            </span>
            <div className="flex gap-4">
              <button onClick={() => setEditing((e) => !e)} className="hover:underline">
                {editing ? "Cancel" : "Edit info"}
              </button>
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
            <img src={src(current)} alt={current.caption} className="max-h-full max-w-full object-contain" />
          </div>

          <div className="text-stone-200" onClick={(e) => e.stopPropagation()}>
            {editing ? (
              <InfoForm
                key={current.pathname}
                photo={current}
                onSaved={() => setEditing(false)}
              />
            ) : (
              <div className="mx-auto max-w-2xl pb-2 text-center text-sm">
                {current.caption && <p className="text-base">{current.caption}</p>}
                {current.people.length > 0 && (
                  <p className="text-stone-400">With {current.people.join(", ")}</p>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <button disabled={open === 0} onClick={() => setOpen(open! - 1)} className="px-3 py-1 disabled:opacity-30">
                ← Prev
              </button>
              <button
                disabled={open === shown.length - 1}
                onClick={() => setOpen(open! + 1)}
                className="px-3 py-1 disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterSelect({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: (string | number)[];
  onChange: (v: string) => void;
}) {
  if (!values.length) return null;
  return (
    <select aria-label={label} className={select} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}</option>
      {values.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}

function InfoForm({ photo, onSaved }: { photo: Photo; onSaved: () => void }) {
  const [year, setYear] = useState(String(photo.year));
  const [location, setLocation] = useState(photo.location);
  const [people, setPeople] = useState(photo.people.join(", "));
  const [caption, setCaption] = useState(photo.caption);
  const [pending, start] = useTransition();

  return (
    <form
      className="mx-auto grid max-w-2xl gap-2 pb-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await savePhotoInfo(photo.pathname, {
            year: Number(year),
            location,
            people: people.split(","),
            caption,
          });
          onSaved();
        });
      }}
    >
      <input className={input} placeholder="Year" inputMode="numeric" maxLength={4} value={year}
        onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} />
      <input className={input} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
      <input className={`${input} sm:col-span-2`} placeholder="People (comma separated)" value={people}
        onChange={(e) => setPeople(e.target.value)} />
      <input className={`${input} sm:col-span-2`} placeholder="Caption" value={caption}
        onChange={(e) => setCaption(e.target.value)} />
      <button
        disabled={pending}
        className="rounded-lg bg-amber-700 py-1.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
