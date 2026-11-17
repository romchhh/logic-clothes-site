"use client";

import React, { useRef, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
};

export default function ContentImageField({
  label,
  value,
  onChange,
  hint,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("fit", "hero");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("upload failed");
      const data = (await res.json()) as { urls?: string[] };
      const url = (data.urls || []).find(Boolean);
      if (!url) throw new Error("no url");
      onChange(url);
    } catch {
      setError("Не вдалося завантажити");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {label}
          </p>
          {hint ? (
            <p className="mt-0.5 text-[12px] text-gray-500">{hint}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <button
            type="button"
            className="admin-btn-secondary"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Завантаження…" : value ? "Змінити фото" : "Додати фото"}
          </button>
          {value ? (
            <button
              type="button"
              className="admin-btn-secondary text-red-700"
              onClick={() => onChange("")}
            >
              Прибрати
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {value ? (
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="max-h-48 w-full object-cover"
          />
          <p className="truncate px-3 py-2 text-[11px] text-gray-400">{value}</p>
        </div>
      ) : (
        <p className="text-[12px] text-gray-400">Фото ще не додано</p>
      )}
    </div>
  );
}
