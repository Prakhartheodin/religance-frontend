"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export type ConfirmDeleteOverlayProps = {
  open: boolean;
  title?: string;
  entityName: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export function ConfirmDeleteOverlay({
  open,
  title = "Delete contact?",
  entityName,
  description = "This action cannot be undone. Any linked lead references will be cleared.",
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDeleteOverlayProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="confirm-delete-overlay" role="presentation">
      <button
        type="button"
        className="confirm-delete-overlay__scrim"
        aria-label="Close dialog"
        onClick={busy ? undefined : onCancel}
        tabIndex={-1}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="confirm-delete-overlay__dialog"
      >
        <div className="confirm-delete-overlay__icon" aria-hidden>
          <i className="ri-delete-bin-line"></i>
        </div>
        <h2 id={titleId} className="confirm-delete-overlay__title">
          {title}
        </h2>
        <p id={descId} className="confirm-delete-overlay__desc">
          {description}{" "}
          <strong className="confirm-delete-overlay__entity">{entityName}</strong>{" "}
          will be permanently removed.
        </p>
        <div className="confirm-delete-overlay__actions">
          <button
            ref={cancelRef}
            type="button"
            className="ti-btn ti-btn-light confirm-delete-overlay__btn"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ti-btn ti-btn-danger confirm-delete-overlay__btn confirm-delete-overlay__btn--danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <span
                  className="confirm-delete-overlay__spinner"
                  aria-hidden
                />
                Deleting…
              </>
            ) : (
              <>
                <i className="ri-delete-bin-line me-1" aria-hidden />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
