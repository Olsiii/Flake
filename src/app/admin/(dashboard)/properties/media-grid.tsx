"use client";

import { useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { PropertyMediaInput } from "@/types/admin-property";

interface MediaGridProps {
  media: PropertyMediaInput[];
  onChange: (next: PropertyMediaInput[]) => void;
  listingId: string;
  /** Which sign endpoint to upload through — the admin form and the
   * user-facing submission form use different auth gates. */
  signUrl?: string;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export function MediaGrid({
  media,
  onChange,
  listingId,
  signUrl = "/api/admin/uploads/sign",
}: MediaGridProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File): Promise<PropertyMediaInput | null> {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`${file.name}: unsupported file type`);
      return null;
    }
    const signRes = await fetch(signUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, contentType: file.type }),
    });
    if (!signRes.ok) {
      setError(`${file.name}: failed to get an upload URL`);
      return null;
    }
    const { token, key, publicUrl, isVideo } = await signRes.json();

    const supabase = getSupabaseBrowser();
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .uploadToSignedUrl(key, token, file);
    if (uploadError) {
      setError(`${file.name}: ${uploadError.message}`);
      return null;
    }
    return { url: publicUrl, isVideo };
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const uploaded = await Promise.all(Array.from(files).map(uploadOne));
    setUploading(false);
    const succeeded = uploaded.filter((m): m is PropertyMediaInput => m != null);
    if (succeeded.length > 0) onChange([...media, ...succeeded]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const next = media.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(media.filter((_, i) => i !== index));
  }

  function makeThumbnail(index: number) {
    if (index === 0) return;
    const next = media.slice();
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next);
  }

  return (
    <div>
      <label className="label">
        Media
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-success-600 hover:bg-success-700 inline-flex min-h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Choose Files"}
          </button>
          <span className="text-xs text-neutral-500">
            {media.length > 0
              ? `${media.length} file${media.length === 1 ? "" : "s"} selected`
              : "No file chosen"}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </label>
      <p className="mt-1 text-xs text-neutral-500">
        Select one or more images or videos
      </p>
      {error && <p className="text-danger-600 mt-1 text-xs">{error}</p>}

      {media.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-neutral-500">
            Media (add more, remove, or reorder)
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {media.map((item, index) => (
              <div key={item.url} className="flex flex-col items-center gap-1">
                {index === 0 ? (
                  <span className="text-accent-700 text-2xs font-bold tracking-wide uppercase">
                    Thumbnail
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      aria-label="Move earlier"
                      className="flex h-5 w-5 items-center justify-center text-neutral-400 hover:text-neutral-800"
                    >
                      <ArrowIcon direction="up" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      aria-label="Move later"
                      className="flex h-5 w-5 items-center justify-center text-neutral-400 hover:text-neutral-800"
                    >
                      <ArrowIcon direction="down" />
                    </button>
                    <button
                      type="button"
                      onClick={() => makeThumbnail(index)}
                      className="text-2xs text-neutral-400 hover:text-neutral-700"
                    >
                      make thumbnail
                    </button>
                  </div>
                )}

                <div
                  className={`relative aspect-square w-full overflow-hidden rounded-md bg-neutral-100 ${
                    index === 0 ? "ring-accent-600 ring-2" : ""
                  }`}
                >
                  {item.isVideo ? (
                    <video src={item.url} className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- small fixed-size admin thumbnail
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  {item.isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayIcon />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove"
                    className="bg-danger-600 hover:bg-danger-700 absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
      <path
        d={direction === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
