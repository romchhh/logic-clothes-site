"use client";

type Props = {
  open: boolean;
  label?: string;
  /** When true, sits above media editor (z-index). */
  elevated?: boolean;
};

export default function AdminUploadPreloader({
  open,
  label = "Завантаження…",
  elevated = false,
}: Props) {
  if (!open) return null;

  return (
    <div
      className={`admin-upload-preloader${elevated ? " is-elevated" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="admin-upload-preloader-card">
        <span className="admin-upload-spinner" aria-hidden="true" />
        <p className="admin-upload-preloader-label">{label}</p>
      </div>
    </div>
  );
}
