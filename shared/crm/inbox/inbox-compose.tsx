"use client";

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
  onSend,
  sending,
}: {
  open: boolean;
  onClose: () => void;
  draft: ComposeDraft;
  templates: ComposeTemplateOption[];
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  onDraftChange: (patch: Partial<ComposeDraft>) => void;
  onSend: () => void;
  sending?: boolean;
}) {
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
            <p className="crm-inbox-eyebrow crm-inbox-eyebrow--on-primary">
              New message
            </p>
            <h3 className="crm-inbox-compose-title">Compose email</h3>
          </div>
          <button
            type="button"
            className="crm-inbox-icon-btn crm-inbox-icon-btn--on-primary"
            onClick={onClose}
            aria-label="Close compose"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="crm-inbox-compose-fields">
          <div className="crm-inbox-compose-row">
            <label>Template</label>
            <select
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
            <label>To</label>
            <input
              type="email"
              value={draft.to}
              onChange={(e) => onDraftChange({ to: e.target.value })}
              placeholder="contact@pharma.com"
            />
          </div>
          <div className="crm-inbox-compose-row">
            <label>Subject</label>
            <input
              type="text"
              value={draft.subject}
              onChange={(e) => onDraftChange({ subject: e.target.value })}
              placeholder="e.g. Re: API supply enquiry"
            />
          </div>
          <textarea
            value={draft.body}
            onChange={(e) => onDraftChange({ body: e.target.value })}
            placeholder="Write your message…"
            rows={9}
            className="crm-inbox-compose-body"
          />
        </div>

        <div className="crm-inbox-compose-footer">
          <button
            type="button"
            className="ti-btn ti-btn-light btn-wave"
            onClick={onClose}
          >
            Discard
          </button>
          <button
            type="button"
            className="ti-btn ti-btn-primary btn-wave"
            disabled={!canSend}
            onClick={onSend}
          >
            <i className="ri-send-plane-fill me-1"></i>
            {sending ? "Sending…" : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
}
