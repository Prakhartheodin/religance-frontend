"use client";

import { applyTemplate, useCrm } from "@/shared/crm/store/crm-context";
import type { CrmLead } from "@/shared/crm/store/types";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SendEmailModalProps = {
  lead: CrmLead | null;
  onClose: () => void;
};

export function SendEmailModal({ lead, onClose }: SendEmailModalProps) {
  const {
    emailTemplates,
    sendLeadEmail,
    buildTemplateVars,
    gmailConnected,
    connectGmail,
  } = useCrm();
  const [templateId, setTemplateId] = useState(emailTemplates[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!lead || emailTemplates.length === 0) return;
    const tpl = emailTemplates[0];
    const vars = buildTemplateVars(lead);
    setTemplateId(tpl.id);
    setSubject(applyTemplate(tpl.subject, vars));
    setBody(applyTemplate(tpl.body, vars));
  }, [lead, buildTemplateVars, emailTemplates]);

  useEffect(() => {
    if (!lead) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lead, busy, onClose]);

  if (!lead || typeof document === "undefined") return null;

  const applySelectedTemplate = (id: string) => {
    const tpl = emailTemplates.find((t) => t.id === id);
    if (!tpl) return;
    const vars = buildTemplateVars(lead);
    setTemplateId(id);
    setSubject(applyTemplate(tpl.subject, vars));
    setBody(applyTemplate(tpl.body, vars));
  };

  const canSend = Boolean(subject.trim() && body.trim());

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectGmail();
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!canSend || busy) return;
    if (!gmailConnected) {
      await handleConnect();
      return;
    }
    setBusy(true);
    try {
      await sendLeadEmail({ leadId: lead.id, templateId, subject, body });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="send-email-overlay" role="presentation">
      <button
        type="button"
        className="send-email-overlay__scrim"
        aria-label="Close dialog"
        onClick={busy ? undefined : onClose}
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="send-email-overlay__dialog"
      >
        <header className="send-email-overlay__header">
          <div className="send-email-overlay__heading">
            <p className="send-email-overlay__eyebrow">Lead outreach</p>
            <h2 id={titleId} className="send-email-overlay__title">
              Send email
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="send-email-overlay__close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <i className="ri-close-line" aria-hidden />
          </button>
        </header>

        <div className="send-email-overlay__body">
          {!gmailConnected && (
            <div className="send-email-overlay__notice" role="status">
              <span className="send-email-overlay__notice-icon" aria-hidden>
                <i className="ri-mail-settings-line" />
              </span>
              <div className="send-email-overlay__notice-copy">
                <p className="send-email-overlay__notice-title">Outlook not connected</p>
                <p className="send-email-overlay__notice-text">
                  Connect your mailbox to send this email and log it to the lead timeline.
                </p>
              </div>
            </div>
          )}

          <div className="send-email-overlay__recipient">
            <span className="send-email-overlay__recipient-label">To</span>
            <div className="send-email-overlay__recipient-value">
              <strong>{lead.contactName}</strong>
              <span className="send-email-overlay__recipient-email">
                {lead.contactEmail}
              </span>
            </div>
          </div>

          <div className="send-email-overlay__field">
            <label htmlFor="send-email-template" className="send-email-overlay__label">
              Template
            </label>
            <select
              id="send-email-template"
              className="send-email-overlay__input send-email-overlay__select"
              value={templateId}
              onChange={(e) => applySelectedTemplate(e.target.value)}
              disabled={busy}
            >
              {emailTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="send-email-overlay__field">
            <label htmlFor="send-email-subject" className="send-email-overlay__label">
              Subject
            </label>
            <input
              id="send-email-subject"
              type="text"
              className="send-email-overlay__input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={busy}
              placeholder="Email subject"
            />
          </div>

          <div className="send-email-overlay__field send-email-overlay__field--grow">
            <label htmlFor="send-email-body" className="send-email-overlay__label">
              Message
            </label>
            <textarea
              id="send-email-body"
              className="send-email-overlay__textarea"
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={busy}
              placeholder="Write your message…"
            />
          </div>

          <p id={descId} className="send-email-overlay__hint">
            Sending updates the lead stage and records this email on the timeline.
          </p>
        </div>

        <footer className="send-email-overlay__footer">
          <button
            type="button"
            className="ti-btn ti-btn-light send-email-overlay__btn"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>

          {!gmailConnected ? (
            <button
              type="button"
              className="ti-btn ti-btn-primary send-email-overlay__btn send-email-overlay__btn--primary"
              onClick={handleConnect}
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="send-email-overlay__spinner" aria-hidden />
                  Connecting…
                </>
              ) : (
                <>
                  <i className="ri-microsoft-line me-1" aria-hidden />
                  Connect Outlook
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="ti-btn ti-btn-primary send-email-overlay__btn send-email-overlay__btn--primary"
              onClick={handleSend}
              disabled={!canSend || busy}
            >
              {busy ? (
                <>
                  <span className="send-email-overlay__spinner" aria-hidden />
                  Sending…
                </>
              ) : (
                <>
                  <i className="ri-mail-send-line me-1" aria-hidden />
                  Send & update stage
                </>
              )}
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
