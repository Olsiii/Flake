"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ListingImage } from "@/types/listing";

type Tab = "photos" | "floor-plan" | "3d-tour";

const TAB_LABELS: Record<Tab, string> = {
  photos: "Photos",
  "floor-plan": "Floor Plan",
  "3d-tour": "3D Tour",
};

export function Gallery({
  images,
  title,
}: {
  images: ListingImage[];
  title: string;
}) {
  const groups = useMemo(
    () => ({
      photos: images.filter((i) => !i.is_floor_plan && !i.is_3d_tour),
      "floor-plan": images.filter((i) => i.is_floor_plan),
      "3d-tour": images.filter((i) => i.is_3d_tour),
    }),
    [images],
  );

  const availableTabs = (["photos", "floor-plan", "3d-tour"] as Tab[]).filter(
    (t) => t === "photos" || groups[t].length > 0,
  );

  const [tab, setTab] = useState<Tab>("photos");
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const current = groups[tab];

  function selectTab(t: Tab) {
    setTab(t);
    setIndex(0);
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-900">
        No photos available
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex w-fit gap-1 rounded-md bg-neutral-100 p-1 text-sm dark:bg-neutral-800">
        {availableTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => selectTab(t)}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              tab === t
                ? "bg-white shadow-sm dark:bg-neutral-700"
                : "text-neutral-500"
            }`}
          >
            {TAB_LABELS[t]}
            {t !== "photos" && ` (${groups[t].length})`}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-900">
          No {TAB_LABELS[tab].toLowerCase()} available
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900"
          >
            <Image
              src={current[index].url}
              alt={title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority={index === 0}
            />
          </button>

          {current.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {current.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md ${
                    i === index
                      ? "ring-2 ring-blue-600"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="80px"
                    loading="lazy"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {lightboxOpen && current.length > 0 && (
        <Lightbox
          images={current}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setLightboxOpen(false)}
          title={title}
        />
      )}
    </div>
  );
}

function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
  title,
}: {
  images: ListingImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (e.key === "ArrowLeft")
        onIndexChange((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, images.length, onIndexChange, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        ✕
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              onIndexChange((index - 1 + images.length) % images.length)
            }
            aria-label="Previous"
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onIndexChange((index + 1) % images.length)}
            aria-label="Next"
            className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            ›
          </button>
        </>
      )}

      <div className="relative h-[80vh] w-[90vw]">
        <Image
          src={images[index].url}
          alt={title}
          fill
          sizes="90vw"
          className="object-contain"
        />
      </div>

      <div className="absolute bottom-4 text-sm text-white/70">
        {index + 1} / {images.length}
      </div>
    </div>
  );
}
