"use client";

import { applyTemplate, useCrm } from "@/shared/crm/store/crm-context";
import { getUserDisplayName } from "@/shared/auth/auth-client";
import type { CrmEmail, CrmEmailAttachment } from "@/shared/crm/store/types";
import { downloadOutlookAttachment } from "@/shared/crm/store/outlook-api";
import Seo from "@/shared/layout-components/seo/seo";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InboxCompose } from "./inbox-compose";
import { InboxContactsRail } from "./inbox-contacts-rail";
import {
  InboxDetailEmpty,
  InboxDetailLoading,
  InboxDetailPanel,
} from "./inbox-detail";
import { type InboxFolderName } from "./inbox-constants";
import { InboxListPanel } from "./inbox-list";
import { InboxSidebar } from "./inbox-sidebar";
import {
  getInboxTag,
  resolvePeerEmail,
  resolveMailboxProfile,
  resolveSenderName,
  suggestLeadForEmail,
  type InboxTag,
} from "./inbox-utils";

export default function InboxPage() {
  const {
    emails,
    leads,
    companies,
    contacts,
    gmailConnected,
    outlookAccountId,
    outlookAccounts,
    outlookEmail,
    connectGmail,
    disconnectOutlook,
    syncOutlookInbox,
    switchOutlookAccount,
    linkEmailToLead,
    setEmailFlag,
    emailIdsWithFlag,
    sendCrmEmail,
    emailTemplates,
    buildTemplateVars,
  } = useCrm();

  const sortedEmails = useMemo(
    () => [...emails].sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    [emails]
  );

  const activeOutlookAccount = useMemo(
    () =>
      outlookAccounts?.find((a) => a.id === outlookAccountId) ??
      outlookAccounts?.find((a) => a.status === "active") ??
      null,
    [outlookAccounts, outlookAccountId]
  );

  const activeMailbox = useMemo(() => {
    return resolveMailboxProfile(
      activeOutlookAccount
        ? {
            email: activeOutlookAccount.email,
            displayName: activeOutlookAccount.displayName,
          }
        : outlookEmail
          ? { email: outlookEmail, displayName: null }
          : null
    );
  }, [activeOutlookAccount, outlookEmail]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<InboxFolderName>("All Mails");
  const [activeTag, setActiveTag] = useState<InboxTag | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState({
    to: "",
    subject: "",
    body: "",
  });
  const [composeTemplateId, setComposeTemplateId] = useState("");
  // Star / read / archive / trash live in the CRM's persisted email overlay,
  // not component state — they used to reset on every reload.
  const starredIds = useMemo(() => emailIdsWithFlag("starred"), [emailIdsWithFlag]);
  const readIds = useMemo(() => emailIdsWithFlag("read"), [emailIdsWithFlag]);
  const archivedIds = useMemo(() => emailIdsWithFlag("archived"), [emailIdsWithFlag]);
  const trashedIds = useMemo(() => emailIdsWithFlag("trashed"), [emailIdsWithFlag]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [replyMode, setReplyMode] = useState<"reply" | "replyAll" | "forward">(
    "reply"
  );
  const [forwardTo, setForwardTo] = useState("");
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [connectingOutlook, setConnectingOutlook] = useState(false);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(
    null
  );
  const [authError, setAuthError] = useState<string | null>(null);

  const getLead = useCallback(
    (leadId: string | null) =>
      leadId ? leads.find((l) => l.id === leadId) : undefined,
    [leads]
  );

  const rowMeta = useCallback(
    (email: CrmEmail) => {
      const lead = getLead(email.leadId);
      const from = resolveSenderName(email, leads, contacts);
      const peer = resolvePeerEmail(email);
      const tag = getInboxTag(email, lead);
      const read =
        readIds.includes(email.id) ||
        (email.leadId !== null && email.direction === "outbound");
      return { from, peer, tag, lead, read };
    },
    [contacts, getLead, leads, readIds]
  );

  const hasMailboxLabel = useCallback(
    (email: CrmEmail, label: string) =>
      email.mailboxLabels?.includes(label) ?? false,
    []
  );

  const isInboxMail = useCallback(
    (email: CrmEmail) =>
      hasMailboxLabel(email, "INBOX") ||
      (!email.mailboxLabels?.length && email.direction === "inbound"),
    [hasMailboxLabel]
  );

  const isSentMail = useCallback(
    (email: CrmEmail) =>
      hasMailboxLabel(email, "SENT") ||
      (!email.mailboxLabels?.length && email.direction === "outbound"),
    [hasMailboxLabel]
  );

  const isSpamMail = useCallback(
    (email: CrmEmail) => hasMailboxLabel(email, "JUNK"),
    [hasMailboxLabel]
  );

  const basePool = useMemo(() => {
    return sortedEmails.filter((e) => {
      if (activeFolder === "Trash") return trashedIds.includes(e.id);
      if (activeFolder === "Archive") return archivedIds.includes(e.id);
      if (trashedIds.includes(e.id) || archivedIds.includes(e.id)) return false;

      if (activeFolder === "Sent") return isSentMail(e);
      if (activeFolder === "Starred" || activeFolder === "Important")
        return starredIds.includes(e.id);
      if (activeFolder === "Spam") return isSpamMail(e) || rowMeta(e).tag === "finance";
      if (activeFolder === "Inbox") return isInboxMail(e);
      if (activeFolder === "Drafts") return false;
      return true;
    });
  }, [
    activeFolder,
    archivedIds,
    isInboxMail,
    isSentMail,
    isSpamMail,
    rowMeta,
    sortedEmails,
    starredIds,
    trashedIds,
  ]);

  const filtered = useMemo(() => {
    let list = basePool;
    if (activeTag) {
      list = list.filter((e) => rowMeta(e).tag === activeTag);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const { from, peer } = rowMeta(e);
        return (
          from.toLowerCase().includes(q) ||
          peer.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [activeTag, basePool, rowMeta, searchQuery]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((e) => e.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!sentFlash) return;
    const t = window.setTimeout(() => setSentFlash(false), 3200);
    return () => window.clearTimeout(t);
  }, [sentFlash]);

  useEffect(() => {
    setSendError(null);
    setReplyMode("reply");
    setForwardTo("");
  }, [selectedId]);

  useEffect(() => {
    if (!composeOpen || emailTemplates.length === 0) return;
    if (!composeTemplateId) {
      setComposeTemplateId(emailTemplates[0].id);
    }
  }, [composeOpen, composeTemplateId, emailTemplates]);

  useEffect(() => {
    let active = true;
    const bootstrapInbox = async () => {
      try {
        await syncOutlookInbox();
      } catch (err) {
        if (active) {
          setAuthError(
            err instanceof Error
              ? err.message
              : "Could not sync Outlook inbox right now."
          );
        }
      } finally {
        if (active) setCheckingConnection(false);
      }
    };
    void bootstrapInbox();
    return () => {
      active = false;
    };
  }, [syncOutlookInbox]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("outlook_connected");
    const authErrorParam = params.get("outlook_error");
    if (!connected && !authErrorParam) return;

    setCheckingConnection(true);
    let active = true;
    const applyOAuthResult = async () => {
      try {
        await syncOutlookInbox(null, connected);
      } catch (err) {
        if (active) {
          setAuthError(
            err instanceof Error
              ? err.message
              : "Could not finish Outlook connection sync."
          );
        }
      } finally {
        if (active) {
          setCheckingConnection(false);
          setConnectingOutlook(false);
        }
      }
    };
    void applyOAuthResult();
    if (connected) {
      setAuthError(null);
    } else if (authErrorParam) {
      try {
        setAuthError(decodeURIComponent(authErrorParam));
      } catch {
        setAuthError(authErrorParam);
      }
    }

    params.delete("outlook_connected");
    params.delete("outlook_error");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`
    );
    return () => {
      active = false;
    };
  }, [syncOutlookInbox]);

  const active = filtered.find((e) => e.id === selectedId) ?? null;
  const activeMeta = active ? rowMeta(active) : null;

  const folderCounts = useMemo(() => {
    const activePool = sortedEmails.filter(
      (e) => !archivedIds.includes(e.id) && !trashedIds.includes(e.id)
    );
    const inboxUnread = activePool.filter((e) => {
      const { read } = rowMeta(e);
      return !read && isInboxMail(e);
    }).length;
    return {
      "All Mails": activePool.length,
      Inbox: inboxUnread,
      Sent: activePool.filter((e) => isSentMail(e)).length,
      Drafts: 0,
      Starred: starredIds.filter(
        (id) => !archivedIds.includes(id) && !trashedIds.includes(id)
      ).length,
      Important: starredIds.filter(
        (id) => !archivedIds.includes(id) && !trashedIds.includes(id)
      ).length,
      Spam: activePool.filter((e) => isSpamMail(e) || rowMeta(e).tag === "finance")
        .length,
      Archive: archivedIds.length,
      Trash: trashedIds.length,
    } satisfies Partial<Record<InboxFolderName, number>>;
  }, [
    archivedIds,
    isInboxMail,
    isSentMail,
    isSpamMail,
    rowMeta,
    sortedEmails,
    starredIds,
    trashedIds,
  ]);

  const buildComposeTemplateVars = useCallback(() => {
    const toEmail = composeDraft.to.trim().toLowerCase();
    const lead = leads.find((item) => item.contactEmail.toLowerCase() === toEmail);
    if (lead) return buildTemplateVars(lead);

    const localPart = composeDraft.to.split("@")[0] || "";
    const contactName = localPart
      .replace(/[._-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

    return {
      company_name: "",
      contact_name: contactName,
      salt_name: "",
      medicine_name: "",
      dosage_form: "",
      sender_name: activeMailbox?.name ?? getUserDisplayName(),
    };
  }, [buildTemplateVars, composeDraft.to, leads]);

  const handleComposeTemplateChange = (templateId: string) => {
    setComposeTemplateId(templateId);
    if (!templateId) return;
    const template = emailTemplates.find((item) => item.id === templateId);
    if (!template) return;

    const vars = buildComposeTemplateVars();
    setComposeDraft((prev) => ({
      ...prev,
      subject: applyTemplate(template.subject, vars),
      body: applyTemplate(template.body, vars),
    }));
  };

  const selectEmail = (id: string) => {
    setSelectedId(id);
    setEmailFlag(id, "read", true);
    setReplyText("");
  };

  const toggleStar = (id: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setEmailFlag(id, "starred", !starredIds.includes(id));
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allChecked =
    filtered.length > 0 && filtered.every((e) => checkedIds.includes(e.id));

  const toggleCheckAll = () => {
    if (allChecked) {
      setCheckedIds((prev) =>
        prev.filter((id) => !filtered.some((e) => e.id === id))
      );
    } else {
      setCheckedIds((prev) => [
        ...new Set([...prev, ...filtered.map((e) => e.id)]),
      ]);
    }
  };

  const handleSendReply = async () => {
    if (!active) return;
    const isForward = replyMode === "forward";
    if (isForward ? !forwardTo.trim() : !replyText.trim()) return;

    // Only synced emails carry a real Outlook message id; locally composed
    // ones ("em-…") and synthetic ids ("outlook-…") can't use the threading
    // endpoints, so they fall back to a plain send.
    const threadable =
      !active.id.startsWith("em-") && !active.id.startsWith("outlook-");

    setSending(true);
    setSendError(null);

    let error: string | null;
    if (isForward) {
      // Without a message id the backend can't quote the original for us,
      // so include it in the composed body.
      const body = threadable
        ? replyText.trim()
        : [
            replyText.trim(),
            "---------- Forwarded message ---------",
            active.body,
          ]
            .filter(Boolean)
            .join("\n\n");
      error = await sendCrmEmail({
        leadId: active.leadId,
        toEmail: forwardTo.trim(),
        subject: active.subject.startsWith("Fwd:")
          ? active.subject
          : `Fwd: ${active.subject}`,
        body,
        replyToMessageId: threadable ? active.id : null,
        mode: "forward",
      });
    } else {
      const to =
        active.direction === "inbound" ? active.fromEmail : active.toEmail;
      error = await sendCrmEmail({
        leadId: active.leadId,
        toEmail: to,
        subject: active.subject.startsWith("Re:")
          ? active.subject
          : `Re: ${active.subject}`,
        body: replyText.trim(),
        replyToMessageId: threadable ? active.id : null,
        mode: replyMode,
      });
    }
    setSending(false);
    if (error) {
      // Keep the draft — the user's text is the only copy of it.
      setSendError(error);
      return;
    }
    setReplyText("");
    setForwardTo("");
    setReplyMode("reply");
    setSentFlash(true);
  };

  const handleDownloadAttachment = async (att: CrmEmailAttachment) => {
    if (!outlookAccountId || !att.attachmentId || !att.messageId) return;
    const error = await downloadOutlookAttachment({
      accountId: outlookAccountId,
      messageId: att.messageId,
      attachmentId: att.attachmentId,
      filename: att.filename,
    });
    if (error) setSendError(error);
  };

  const handleSendCompose = async () => {
    const { to, subject, body } = composeDraft;
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    setSendError(null);
    const error = await sendCrmEmail({
      toEmail: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
    });
    setSending(false);
    if (error) {
      setSendError(error);
      return;
    }
    setComposeDraft({ to: "", subject: "", body: "" });
    setComposeOpen(false);
    setActiveFolder("Sent");
    setSentFlash(true);
  };

  const suggested =
    active && !active.leadId
      ? suggestLeadForEmail(active.fromEmail, leads)
      : null;
  const suggestedCompany = suggested
    ? companies.find((c) => c.id === suggested.companyId)
    : null;

  const handleConnectOutlook = useCallback(() => {
    setConnectingOutlook(true);
    setAuthError(null);
    connectGmail();
  }, [connectGmail]);

  const handleDisconnectOutlook = useCallback(async () => {
    setSelectedId(null);
    setReplyText("");
    setComposeOpen(false);
    await disconnectOutlook(outlookAccountId);
  }, [disconnectOutlook, outlookAccountId]);

  const handleSwitchOutlookAccount = useCallback(
    async (accountId: string) => {
      if (accountId === outlookAccountId || switchingAccountId) return;
      setSwitchingAccountId(accountId);
      setSelectedId(null);
      setReplyText("");
      try {
        await switchOutlookAccount(accountId);
      } finally {
        setSwitchingAccountId(null);
      }
    },
    [outlookAccountId, switchingAccountId, switchOutlookAccount]
  );

  if (checkingConnection) {
    return (
      <Fragment>
        <Seo title="Inbox" />
        <div className="crm-inbox-page">
          <div className="box custom-box !mb-0">
            <div className="box-body py-5 px-3 px-md-4">
              <div className="mx-auto w-full max-w-2xl text-center">
                <span className="avatar avatar-lg bg-primary/10 text-primary mb-3">
                  <i className="ri-loader-4-line text-[1.25rem] animate-spin"></i>
                </span>
                <h5 className="mb-2">Checking Outlook connection</h5>
                <p className="text-textmuted mb-0">
                  Verifying mailbox account and syncing your latest threads.
                </p>
                <p className="text-[0.75rem] text-textmuted mt-2 mb-0">
                  This takes a moment on first sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  if (!gmailConnected) {
    return (
      <Fragment>
        <Seo title="Inbox" />
        <div className="crm-inbox-page">
          <div className="box custom-box !mb-0">
            <div className="box-body px-3 px-md-5 py-4 py-md-5">
              <div className="mx-auto w-full max-w-5xl">
                <div className="row g-4 g-xl-5 align-items-center">
                  <div className="col-lg-6 text-center text-lg-start">
                    <span className="avatar avatar-xl bg-primary/10 text-primary mb-3">
                      <i className="ri-microsoft-fill text-[1.5rem]"></i>
                    </span>
                    <p className="text-primary fw-semibold mb-2">Inbox Setup</p>
                    <h3 className="mb-2">Connect Outlook to unlock live inbox</h3>
                    <p className="text-textmuted mb-3">
                      Connect once to sync real Outlook threads, send from CRM,
                      and map conversations directly to leads.
                    </p>
                    {authError ? (
                      <div
                        className="alert alert-danger text-start mb-3"
                        role="alert"
                        aria-live="polite"
                      >
                        <p className="mb-1 fw-semibold">Connection failed</p>
                        <p className="mb-0 text-[0.8125rem]">{authError}</p>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="ti-btn ti-btn-primary ti-btn-lg"
                      onClick={handleConnectOutlook}
                      disabled={connectingOutlook}
                      aria-label="Connect Outlook mailbox"
                    >
                      {connectingOutlook ? (
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden></span>
                      ) : (
                        <i className="ri-link-m me-1"></i>
                      )}
                      {connectingOutlook ? "Redirecting to Microsoft..." : "Connect Outlook"}
                    </button>
                    <p className="text-textmuted text-[0.75rem] mt-2 mb-0">
                      You will be redirected to Microsoft secure sign-in and
                      returned here automatically.
                    </p>
                  </div>
                  <div className="col-lg-6">
                    <div className="rounded-3 border border-defaultborder bg-light dark:bg-black/20 p-3 p-md-4">
                      <p className="fw-semibold mb-3">What happens after connect</p>
                      <div className="d-grid gap-3">
                        <div className="d-flex align-items-start gap-2">
                          <span className="avatar avatar-sm bg-primary/10 text-primary">
                            <i className="ri-mail-line"></i>
                          </span>
                          <div>
                            <p className="mb-1 fw-semibold text-[0.875rem]">Live threads only</p>
                            <p className="mb-0 text-textmuted text-[0.75rem]">
                              Static/demo emails are blocked; inbox loads only
                              real Outlook data.
                            </p>
                          </div>
                        </div>
                        <div className="d-flex align-items-start gap-2">
                          <span className="avatar avatar-sm bg-primary/10 text-primary">
                            <i className="ri-links-line"></i>
                          </span>
                          <div>
                            <p className="mb-1 fw-semibold text-[0.875rem]">Lead mapping ready</p>
                            <p className="mb-0 text-textmuted text-[0.75rem]">
                              Match replies with leads and keep deal context in
                              a single workflow.
                            </p>
                          </div>
                        </div>
                        <div className="d-flex align-items-start gap-2">
                          <span className="avatar avatar-sm bg-primary/10 text-primary">
                            <i className="ri-shield-check-line"></i>
                          </span>
                          <div>
                            <p className="mb-1 fw-semibold text-[0.875rem]">Secure OAuth flow</p>
                            <p className="mb-0 text-textmuted text-[0.75rem]">
                              Authorization runs via Microsoft OAuth; password
                              is never stored in this app.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Seo title="Inbox" />
      <div className="crm-inbox-page">
        <div className="crm-inbox-shell box custom-box !mb-0">
          <div className="box-body !p-0">
            <div className="crm-inbox-layout">
              <InboxSidebar
                gmailConnected={gmailConnected}
                accountEmail={outlookEmail ?? null}
                accountDisplayName={activeOutlookAccount?.displayName ?? null}
                onDisconnectOutlook={handleDisconnectOutlook}
                onConnect={handleConnectOutlook}
                onCompose={() => setComposeOpen(true)}
                activeFolder={activeFolder}
                onFolderChange={setActiveFolder}
                folderCounts={folderCounts}
                activeTag={activeTag}
                onTagChange={setActiveTag}
              />

              <InboxListPanel
                gmailConnected={gmailConnected}
                onConnect={handleConnectOutlook}
                activeFolder={activeFolder}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                emails={filtered}
                rowMeta={rowMeta}
                selectedId={selectedId}
                onSelect={selectEmail}
                starredIds={starredIds}
                onToggleStar={toggleStar}
                checkedIds={checkedIds}
                onToggleCheck={toggleCheck}
                onToggleCheckAll={toggleCheckAll}
                allChecked={allChecked}
                loading={Boolean(switchingAccountId)}
              />

              {switchingAccountId ? (
                <InboxDetailLoading
                  email={
                    (outlookAccounts ?? []).find(
                      (a) => a.id === switchingAccountId
                    )?.email ?? null
                  }
                />
              ) : active && activeMeta ? (
                <InboxDetailPanel
                  active={active}
                  meta={activeMeta}
                  mailboxDisplayName={activeMailbox?.name ?? null}
                  gmailConnected={gmailConnected}
                  starred={starredIds.includes(active.id)}
                  onToggleStar={() =>
                    setEmailFlag(
                      active.id,
                      "starred",
                      !starredIds.includes(active.id)
                    )
                  }
                  onMarkUnread={() => setEmailFlag(active.id, "read", false)}
                  onArchive={() => {
                    setEmailFlag(active.id, "archived", true);
                    setEmailFlag(active.id, "trashed", false);
                    setSelectedId(null);
                  }}
                  onDelete={() => {
                    setEmailFlag(active.id, "trashed", true);
                    setEmailFlag(active.id, "archived", false);
                    setSelectedId(null);
                  }}
                  replyText={replyText}
                  onReplyChange={setReplyText}
                  onSendReply={handleSendReply}
                  replyMode={replyMode}
                  onReplyModeChange={setReplyMode}
                  forwardTo={forwardTo}
                  onForwardToChange={setForwardTo}
                  onDownloadAttachment={handleDownloadAttachment}
                  sending={sending}
                  sentFlash={sentFlash}
                  sendError={sendError}
                  leads={leads}
                  companies={companies}
                  suggested={suggested}
                  suggestedCompany={suggestedCompany}
                  onLinkLead={(leadId) => linkEmailToLead(active.id, leadId)}
                />
              ) : (
                <InboxDetailEmpty />
              )}

              <InboxContactsRail
                accounts={outlookAccounts ?? []}
                activeAccountId={outlookAccountId ?? null}
                onSwitchAccount={handleSwitchOutlookAccount}
                onConnectAccount={handleConnectOutlook}
                connecting={connectingOutlook}
                switchingAccountId={switchingAccountId}
              />
            </div>
          </div>
        </div>
      </div>

      <InboxCompose
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        draft={composeDraft}
        templates={emailTemplates.map((template) => ({
          id: template.id,
          name: template.name,
          category: template.category,
        }))}
        selectedTemplateId={composeTemplateId}
        onTemplateChange={handleComposeTemplateChange}
        onDraftChange={(patch) =>
          setComposeDraft((prev) => ({ ...prev, ...patch }))
        }
        onSend={handleSendCompose}
        sending={sending}
        sendError={sendError}
      />
    </Fragment>
  );
}
