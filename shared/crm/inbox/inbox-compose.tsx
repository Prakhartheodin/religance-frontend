"use client";

import { useEffect, useId } from "react";

type ComposeDraft = { to: string; subject: string; body: string };
type ComposeTemplateOption = { id: string; name: string; category: string };

export function InboxCompose({
  open,
  onClose,
  draft,
  templates,
  selectedTemplateId,
  onTemplateChange,
  onDraftChange,
  onToBlur,
  onSend,
  sending,
  sendError,
}: {
  open: boolean;
  onClose: () => void;
  draft: ComposeDraft;
  templates: ComposeTemplateOption[];
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  onDraftChange: (patch: Partial<ComposeDraft>) => void;
  onToBlur?: () => void;
  onSend: () => void;
  sending?: boolean;
  sendError?: string | null;
}) {
  const templateFieldId = useId();
  const toFieldId = useId();
  const subjectFieldId = useId();
  const bodyFieldId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, sending]);

  if (!open) return null;

  const canSend =
    draft.to.trim() && draft.subject.trim() && draft.body.trim() && !sending;

  return (
    <div
      className="crm-inbox-compose"
      role="dialog"
      aria-modal="true"
      aria-label="Compose email"
    >
      <div className="crm-inbox-compose-backdrop" onClick={onClose} aria-hidden />
      <div className="crm-inbox-compose-panel">
        <div className="crm-inbox-compose-header">
          <div className="min-w-0">
            <p className="crm-inbox-compose-eyebrow">New message</p>
            <h3 className="crm-inbox-compose-title">Compose email</h3>
          </div>
          <button
            type="button"
            className="crm-inbox-compose-close"
            onClick={onClose}
            aria-label="Close compose"
          >
            <i className="ri-close-line" aria-hidden />
          </button>
        </div>

        <div className="crm-inbox-compose-fields">
          <div className="crm-inbox-compose-row">
            <label htmlFor={templateFieldId} className="crm-inbox-compose-label">
              Template
            </label>
            <select
              id={templateFieldId}
              className="crm-inbox-compose-input crm-inbox-compose-select"
              value={selectedTemplateId}
              onChange={(e) => onTemplateChange(e.target.value)}
            >
              <option value="">No template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category})
                </option>
              ))}
            </select>
          </div>
          <div className="crm-inbox-compose-row">
            <label htmlFor={toFieldId} className="crm-inbox-compose-label">
              To
            </label>
            <input
              id={toFieldId}
              type="email"
              className="crm-inbox-compose-input"
              value={draft.to}
              onChange={(e) => onDraftChange({ to: e.target.value })}
              onBlur={onToBlur}
              placeholder="contact@pharma.com"
            />
          </div>
          <div className="crm-inbox-compose-row">
            <label htmlFor={subjectFieldId} className="crm-inbox-compose-label">
              Subject
            </label>
            <input
              id={subjectFieldId}
              type="text"
              className="crm-inbox-compose-input"
              value={draft.subject}
              onChange={(e) => onDraftChange({ subject: e.target.value })}
              placeholder="e.g. Re: API supply enquiry"
            />
          </div>
          <div className="crm-inbox-compose-body-wrap">
            <label htmlFor={bodyFieldId} className="crm-inbox-compose-body-label">
              Message
            </label>
            <textarea
              id={bodyFieldId}
              value={draft.body}
              onChange={(e) => onDraftChange({ body: e.target.value })}
              placeholder="Write your message…"
              rows={10}
              className="crm-inbox-compose-body"
            />
          </div>
        </div>

        {sendError && (
          <div className="crm-inbox-compose-error" role="alert">
            <i className="ri-error-warning-fill" aria-hidden />
            {sendError}
          </div>
        )}

        <div className="crm-inbox-compose-footer">
          <button
            type="button"
            className="crm-inbox-compose-btn crm-inbox-compose-btn--secondary"
            onClick={onClose}
          >
            Discard
          </button>
          <button
            type="button"
            className="crm-inbox-compose-btn crm-inbox-compose-btn--primary"
            disabled={!canSend}
            onClick={onSend}
          >
            <i className="ri-send-plane-fill" aria-hidden />
            {sending ? "Sending…" : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
}
