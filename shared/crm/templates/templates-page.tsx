"use client";

import {
  applyTemplate,
  categoryIcon,
  categoryLabel,
  isDefaultEmailTemplate,
  TEMPLATE_VARIABLES,
  type EmailTemplate,
  type EmailTemplateCategory,
  type TemplateVariables,
} from "@/shared/crm/store/email-templates";
import { useCrm } from "@/shared/crm/store/crm-context";
import { CURRENT_USER } from "@/shared/crm/store/types";
import Seo from "@/shared/layout-components/seo/seo";
import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SAMPLE_VARS: TemplateVariables = {
  company_name: "ABC Pharma Pvt Ltd",
  contact_name: "Rajesh Mehta",
  salt_name: "Budesonide",
  medicine_name: "Budecort Respules",
  dosage_form: "Respules",
  sender_name: CURRENT_USER,
};

type EditorTab = "edit" | "preview";
type InsertTarget = "subject" | "body";

function templateEquals(a: EmailTemplate, b: EmailTemplate): boolean {
  return (
    a.name === b.name &&
    a.subject === b.subject &&
    a.body === b.body &&
    a.description === b.description &&
    a.category === b.category
  );
}

const TEMPLATE_CATEGORIES: EmailTemplateCategory[] = [
  "introduction",
  "follow-up",
  "quotation",
];

function FieldGroup({
  label,
  insertAction,
  children,
}: {
  label: string;
  insertAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between gap-3 mb-2 min-h-[1.25rem]">
        <label className="form-label text-[0.75rem] mb-0">{label}</label>
        {insertAction}
      </div>
      {children}
    </div>
  );
}

function MergeFieldChips({
  onInsert,
}: {
  onInsert: (token: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATE_VARIABLES.map((v) => (
        <button
          key={v.key}
          type="button"
          className="badge bg-primary/10 text-primary border-0 cursor-pointer hover:bg-primary/20 whitespace-nowrap"
          onClick={() => onInsert(`{{${v.key}}}`)}
        >
          {v.label}
          <span className="opacity-70 ms-1 font-normal">{`{{${v.key}}}`}</span>
        </button>
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  const {
    emailTemplates,
    leads,
    hydrated,
    buildTemplateVars,
    updateEmailTemplate,
    addEmailTemplate,
    deleteEmailTemplate,
    resetEmailTemplate,
    resetAllEmailTemplates,
  } = useCrm();

  const [selectedId, setSelectedId] = useState(emailTemplates[0]?.id ?? "");
  const [tab, setTab] = useState<EditorTab>("edit");
  const [draft, setDraft] = useState<EmailTemplate | null>(null);
  const [previewLeadId, setPreviewLeadId] = useState<string>("sample");
  const [savedFlash, setSavedFlash] = useState(false);
  const [insertTarget, setInsertTarget] = useState<InsertTarget>("body");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const savedTemplate = useMemo(
    () => emailTemplates.find((t) => t.id === selectedId),
    [emailTemplates, selectedId]
  );

  useEffect(() => {
    if (!savedTemplate) return;
    setDraft({ ...savedTemplate });
    setTab("edit");
  }, [savedTemplate]);

  useEffect(() => {
    if (emailTemplates.length && !emailTemplates.some((t) => t.id === selectedId)) {
      setSelectedId(emailTemplates[0].id);
    }
  }, [emailTemplates, selectedId]);

  const previewVars = useMemo((): TemplateVariables => {
    if (previewLeadId === "sample") return SAMPLE_VARS;
    const lead = leads.find((l) => l.id === previewLeadId);
    return lead ? buildTemplateVars(lead) : SAMPLE_VARS;
  }, [previewLeadId, leads, buildTemplateVars]);

  const isDirty = useMemo(() => {
    if (!draft || !savedTemplate) return false;
    return !templateEquals(draft, savedTemplate);
  }, [draft, savedTemplate]);

  const insertToken = useCallback(
    (token: string) => {
      if (!draft) return;
      const field = insertTarget;
      const ref = field === "subject" ? subjectRef : bodyRef;
      const el = ref.current;
      const current = draft[field];
      if (el && typeof el.selectionStart === "number") {
        const start = el.selectionStart;
        const end = el.selectionEnd ?? start;
        const next = current.slice(0, start) + token + current.slice(end);
        setDraft({ ...draft, [field]: next });
        requestAnimationFrame(() => {
          el.focus();
          const pos = start + token.length;
          el.setSelectionRange(pos, pos);
        });
        return;
      }
      setDraft({ ...draft, [field]: current + token });
    },
    [draft, insertTarget]
  );

  const isBuiltIn = savedTemplate
    ? isDefaultEmailTemplate(savedTemplate.id)
    : false;

  const handleSave = () => {
    if (!draft || !isDirty) return;
    updateEmailTemplate(draft.id, {
      name: draft.name.trim() || savedTemplate?.name || "Untitled",
      subject: draft.subject,
      body: draft.body,
      description: draft.description,
      category: draft.category,
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleReset = () => {
    if (!selectedId || !isBuiltIn) return;
    resetEmailTemplate(selectedId);
  };

  const handleAdd = () => {
    const id = addEmailTemplate();
    setSelectedId(id);
    setTab("edit");
  };

  const handleDelete = () => {
    if (!selectedId || isBuiltIn) return;
    deleteEmailTemplate(selectedId);
  };

  const selectTemplate = (id: string) => {
    if (id === selectedId) return;
    setSelectedId(id);
  };

  if (!hydrated || !draft) {
    return (
      <div className="p-8 text-center text-textmuted">Loading templates…</div>
    );
  }

  const previewSubject = applyTemplate(draft.subject, previewVars);
  const previewBody = applyTemplate(draft.body, previewVars);

  const insertLink = (target: InsertTarget) => (
    <button
      type="button"
      className={`text-[0.6875rem] whitespace-nowrap shrink-0 ${
        insertTarget === target
          ? "text-primary font-medium"
          : "text-textmuted hover:text-primary"
      }`}
      onClick={() => setInsertTarget(target)}
    >
      Insert here
    </button>
  );

  return (
    <Fragment>
      <Seo title="Email Templates" />

      <div className="box custom-box mb-0 flex flex-col min-h-[calc(100vh-12rem)]">
        <div className="box-header !flex-wrap gap-x-4 gap-y-3 !items-start">
          <div className="min-w-0 flex-1 basis-full lg:basis-auto">
            <h5 className="box-title mb-0 before:!hidden">Email Templates</h5>
            <p className="text-[0.75rem] text-textmuted mb-0 mt-1">
              Edit outreach templates used from Active Leads and Inbox.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 ms-auto">
            <span className="badge bg-light text-defaulttextcolor whitespace-nowrap">
              {emailTemplates.length} templates
            </span>
            {savedFlash && (
              <span className="badge bg-success/10 text-success whitespace-nowrap">
                Saved
              </span>
            )}
            {isDirty && (
              <span className="badge bg-warning/10 text-warning whitespace-nowrap">
                Unsaved
              </span>
            )}
            <button
              type="button"
              className="ti-btn ti-btn-light !py-1.5 !px-3 !text-[0.8125rem] !w-auto !h-auto !mb-0"
              onClick={resetAllEmailTemplates}
            >
              Reset all
            </button>
            <Link
              href="/active-leads"
              className="ti-btn ti-btn-primary !py-1.5 !px-3 !text-[0.8125rem] !w-auto !h-auto !mb-0"
            >
              <i className="ri-mail-send-line me-1"></i>
              Send from pipeline
            </Link>
          </div>
        </div>

        <div className="box-body !p-0 flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-12 flex-1 min-h-0 items-stretch">
            {/* Library */}
            <div className="lg:col-span-4 col-span-12 border-b lg:border-b-0 lg:border-e border-defaultborder dark:border-defaultborder/10 flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-defaultborder dark:border-defaultborder/10 shrink-0 flex items-center justify-between gap-3">
                <h6 className="font-semibold text-[0.875rem] mb-0">
                  Template library
                </h6>
                <button
                  type="button"
                  className="ti-btn ti-btn-primary !py-1.5 !px-3 !text-[0.8125rem] !w-auto !h-auto !mb-0"
                  onClick={handleAdd}
                >
                  <i className="ri-add-line me-1"></i>
                  New template
                </button>
              </div>
              <ul className="list-none mb-0 flex-1 overflow-y-auto">
                {emailTemplates.map((t) => {
                  const selected = selectedId === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => selectTemplate(t.id)}
                        className={`w-full text-start px-4 py-3 border-b border-defaultborder dark:border-defaultborder/10 last:border-b-0 transition-colors ${
                          selected
                            ? "bg-primary/10 border-s-[3px] border-s-primary"
                            : "hover:bg-light/40 dark:hover:bg-white/5 border-s-[3px] border-s-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`avatar avatar-sm !rounded-md shrink-0 ${
                              selected
                                ? "bg-primary text-white"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            <i
                              className={`${categoryIcon(t.category)} text-[1rem]`}
                            ></i>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-medium text-[0.875rem] mb-1 leading-snug ${
                                selected ? "text-primary" : ""
                              }`}
                            >
                              {t.name}
                            </p>
                            <p className="text-[0.75rem] text-textmuted mb-2 leading-relaxed line-clamp-2">
                              {t.description}
                            </p>
                            <span className="badge bg-light text-defaulttextcolor text-[0.65rem]">
                              {categoryLabel(t.category)}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Editor */}
            <div className="lg:col-span-8 col-span-12 flex flex-col min-h-0">
              <div className="px-4 py-3 border-b border-defaultborder dark:border-defaultborder/10 shrink-0 space-y-3">
                <h6 className="font-semibold text-[0.875rem] mb-0 truncate">
                  {draft.name}
                </h6>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <nav className="flex gap-1" aria-label="Editor tabs">
                    <button
                      type="button"
                      onClick={() => setTab("edit")}
                      className={`px-3 py-1.5 text-[0.75rem] font-medium rounded-md whitespace-nowrap ${
                        tab === "edit"
                          ? "bg-primary/10 text-primary"
                          : "text-textmuted hover:text-primary"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("preview")}
                      className={`px-3 py-1.5 text-[0.75rem] font-medium rounded-md whitespace-nowrap ${
                        tab === "preview"
                          ? "bg-primary/10 text-primary"
                          : "text-textmuted hover:text-primary"
                      }`}
                    >
                      Preview
                    </button>
                  </nav>
                  <div className="flex flex-wrap items-center gap-2">
                    {isBuiltIn ? (
                      <button
                        type="button"
                        className="ti-btn ti-btn-light !py-1.5 !px-3 !text-[0.8125rem] !w-auto !h-auto !mb-0"
                        onClick={handleReset}
                      >
                        Reset
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ti-btn ti-btn-danger !py-1.5 !px-3 !text-[0.8125rem] !w-auto !h-auto !mb-0"
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                    )}
                    <button
                      type="button"
                      className="ti-btn ti-btn-primary !py-1.5 !px-3 !text-[0.8125rem] !w-auto !h-auto !mb-0"
                      onClick={handleSave}
                      disabled={!isDirty}
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 flex-1 overflow-y-auto min-h-0">
                <FieldGroup label="Preview with lead">
                  <select
                    className="form-select form-select-sm w-full"
                    value={previewLeadId}
                    onChange={(e) => setPreviewLeadId(e.target.value)}
                  >
                    <option value="sample">Sample data</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.contactName} — {l.companyName}
                      </option>
                    ))}
                  </select>
                </FieldGroup>

                {tab === "edit" ? (
                  <>
                    <FieldGroup label="Template name">
                      <input
                        type="text"
                        className="form-control form-control-sm w-full"
                        value={draft.name}
                        onChange={(e) =>
                          setDraft({ ...draft, name: e.target.value })
                        }
                      />
                    </FieldGroup>

                    <FieldGroup label="Description">
                      <input
                        type="text"
                        className="form-control form-control-sm w-full"
                        value={draft.description}
                        onChange={(e) =>
                          setDraft({ ...draft, description: e.target.value })
                        }
                      />
                    </FieldGroup>

                    <FieldGroup label="Category">
                      <select
                        className="form-select form-select-sm w-full"
                        value={draft.category}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            category: e.target.value as EmailTemplateCategory,
                          })
                        }
                      >
                        {TEMPLATE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {categoryLabel(cat)}
                          </option>
                        ))}
                      </select>
                    </FieldGroup>

                    <FieldGroup
                      label="Subject"
                      insertAction={insertLink("subject")}
                    >
                      <input
                        ref={subjectRef}
                        type="text"
                        className="form-control w-full"
                        value={draft.subject}
                        onFocus={() => setInsertTarget("subject")}
                        onChange={(e) =>
                          setDraft({ ...draft, subject: e.target.value })
                        }
                      />
                    </FieldGroup>

                    <FieldGroup
                      label="Body"
                      insertAction={insertLink("body")}
                    >
                      <textarea
                        ref={bodyRef}
                        className="form-control w-full min-h-[240px] text-[0.8125rem] resize-y"
                        value={draft.body}
                        onFocus={() => setInsertTarget("body")}
                        onChange={(e) =>
                          setDraft({ ...draft, body: e.target.value })
                        }
                      />
                    </FieldGroup>

                    <div className="pt-1 border-t border-defaultborder dark:border-defaultborder/10">
                      <p className="text-[0.75rem] text-textmuted mb-3 mt-3">
                        Merge fields — click to insert into{" "}
                        <span className="font-medium text-defaulttextcolor">
                          {insertTarget === "subject" ? "subject" : "body"}
                        </span>
                      </p>
                      <MergeFieldChips onInsert={insertToken} />
                    </div>
                  </>
                ) : (
                  <div className="rounded-md border border-defaultborder dark:border-defaultborder/10 overflow-hidden min-h-[400px] flex flex-col">
                    <div className="px-4 py-3 border-b border-defaultborder dark:border-defaultborder/10 bg-light/50 dark:bg-black/20">
                      <p className="text-[0.6875rem] uppercase tracking-wide text-textmuted mb-1">
                        Subject
                      </p>
                      <p className="font-semibold text-[0.9375rem] mb-0 text-defaulttextcolor">
                        {previewSubject || "—"}
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-defaultborder dark:border-defaultborder/10 text-[0.75rem] text-textmuted bg-light/50 dark:bg-black/20">
                      To:{" "}
                      <strong className="text-defaulttextcolor">
                        {previewVars.contact_name}
                      </strong>{" "}
                      · {previewVars.company_name}
                    </div>
                    <div className="px-4 py-4 flex-1 bg-white">
                      <div className="text-[0.8125rem] whitespace-pre-wrap font-sans mb-0 text-gray-800 leading-relaxed">
                        {previewBody || "—"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
