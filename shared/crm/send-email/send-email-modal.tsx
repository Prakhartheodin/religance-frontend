"use client";

import { applyTemplate, useCrm } from "@/shared/crm/store/crm-context";
import type { CrmLead } from "@/shared/crm/store/types";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!lead || emailTemplates.length === 0) return;
    const tpl = emailTemplates[0];
    const vars = buildTemplateVars(lead);
    setTemplateId(tpl.id);
    setSubject(applyTemplate(tpl.subject, vars));
    setBody(applyTemplate(tpl.body, vars));
  }, [lead, buildTemplateVars, emailTemplates]);

  if (!lead) return null;

  const applySelectedTemplate = (id: string) => {
    const tpl = emailTemplates.find((t) => t.id === id);
    if (!tpl) return;
    const vars = buildTemplateVars(lead);
    setTemplateId(id);
    setSubject(applyTemplate(tpl.subject, vars));
    setBody(applyTemplate(tpl.body, vars));
  };

  const handleSend = () => {
    if (!gmailConnected) {
      connectGmail();
      return;
    }
    sendLeadEmail({ leadId: lead.id, templateId, subject, body });
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[160]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[170] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="box custom-box mb-0 w-full max-w-xl pointer-events-auto shadow-lg">
          <div className="box-header border-b border-defaultborder dark:border-defaultborder/10">
            <h6 className="box-title mb-0 before:!hidden">Send email</h6>
            <button
              type="button"
              className="ti-btn ti-btn-sm ti-btn-icon ti-btn-light"
              onClick={onClose}
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
          <div className="box-body space-y-3">
            {!gmailConnected && (
              <div className="alert alert-warning text-[0.8125rem] mb-0">
                Outlook not connected. Sending will connect Outlook and log the
                email to this lead.
                <button
                  type="button"
                  className="ti-btn ti-btn-sm ti-btn-warning ms-2"
                  onClick={connectGmail}
                >
                  Connect Outlook
                </button>
              </div>
            )}
            <p className="text-[0.8125rem] text-textmuted mb-0">
              To: <strong>{lead.contactName}</strong> &lt;{lead.contactEmail}&gt;
            </p>
            <div>
              <label className="form-label text-[0.75rem]">Template</label>
              <select
                className="form-select form-select-sm"
                value={templateId}
                onChange={(e) => applySelectedTemplate(e.target.value)}
              >
                {emailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label text-[0.75rem]">Subject</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label text-[0.75rem]">Body</label>
              <textarea
                className="form-control text-[0.8125rem]"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>
          <div className="box-footer flex gap-2 justify-end border-t border-defaultborder dark:border-defaultborder/10">
            <button type="button" className="ti-btn ti-btn-light" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="ti-btn ti-btn-primary"
              onClick={handleSend}
              disabled={!subject.trim() || !gmailConnected}
            >
              <i className="ri-mail-send-line me-1"></i>
              Send & update stage
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
