"use client";

import { useCrm } from "@/shared/crm/store/crm-context";
import type { CrmEmail } from "@/shared/crm/store/types";
import Seo from "@/shared/layout-components/seo/seo";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InboxCompose } from "./inbox-compose";
import { InboxContactsRail } from "./inbox-contacts-rail";
import { InboxDetailEmpty, InboxDetailPanel } from "./inbox-detail";
import { type InboxFolderName } from "./inbox-constants";
import { InboxListPanel } from "./inbox-list";
import { InboxSidebar } from "./inbox-sidebar";
import {
  getInboxTag,
  resolvePeerEmail,
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
    connectGmail,
    linkEmailToLead,
    sendCrmEmail,
  } = useCrm();

  const sortedEmails = useMemo(
    () => [...emails].sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    [emails]
  );

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
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [trashedIds, setTrashedIds] = useState<string[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);

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

  const basePool = useMemo(() => {
    return sortedEmails.filter((e) => {
      if (activeFolder === "Trash") return trashedIds.includes(e.id);
      if (activeFolder === "Archive") return archivedIds.includes(e.id);
      if (trashedIds.includes(e.id) || archivedIds.includes(e.id)) return false;

      if (activeFolder === "Sent") return e.direction === "outbound";
      if (activeFolder === "Starred" || activeFolder === "Important")
        return starredIds.includes(e.id);
      if (activeFolder === "Spam")
        return rowMeta(e).tag === "finance";
      if (activeFolder === "Inbox") return e.direction === "inbound";
      if (activeFolder === "Drafts") return false;
      return true;
    });
  }, [activeFolder, archivedIds, rowMeta, sortedEmails, starredIds, trashedIds]);

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

  const active = filtered.find((e) => e.id === selectedId) ?? null;
  const activeMeta = active ? rowMeta(active) : null;

  const folderCounts = useMemo(() => {
    const activePool = sortedEmails.filter(
      (e) => !archivedIds.includes(e.id) && !trashedIds.includes(e.id)
    );
    const inboxUnread = activePool.filter((e) => {
      const { read } = rowMeta(e);
      return !read && e.direction === "inbound";
    }).length;
    return {
      "All Mails": activePool.length,
      Inbox: inboxUnread,
      Sent: activePool.filter((e) => e.direction === "outbound").length,
      Drafts: 0,
      Starred: starredIds.filter(
        (id) => !archivedIds.includes(id) && !trashedIds.includes(id)
      ).length,
      Important: starredIds.filter(
        (id) => !archivedIds.includes(id) && !trashedIds.includes(id)
      ).length,
      Spam: activePool.filter((e) => rowMeta(e).tag === "finance").length,
      Archive: archivedIds.length,
      Trash: trashedIds.length,
    } satisfies Partial<Record<InboxFolderName, number>>;
  }, [archivedIds, rowMeta, sortedEmails, starredIds, trashedIds]);

  const selectEmail = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setReplyText("");
  };

  const toggleStar = (id: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setStarredIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

  const handleSendReply = () => {
    if (!active || !replyText.trim()) return;
    setSending(true);
    const to =
      active.direction === "inbound" ? active.fromEmail : active.toEmail;
    sendCrmEmail({
      leadId: active.leadId,
      toEmail: to,
      subject: active.subject.startsWith("Re:")
        ? active.subject
        : `Re: ${active.subject}`,
      body: replyText.trim(),
    });
    setReplyText("");
    setSending(false);
    setSentFlash(true);
  };

  const handleSendCompose = () => {
    const { to, subject, body } = composeDraft;
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    sendCrmEmail({
      toEmail: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
    });
    setComposeDraft({ to: "", subject: "", body: "" });
    setComposeOpen(false);
    setActiveFolder("Sent");
    setSending(false);
    setSentFlash(true);
  };

  const openComposeTo = (email: string) => {
    setComposeDraft((prev) => ({ ...prev, to: email }));
    setComposeOpen(true);
  };

  const suggested =
    active && !active.leadId
      ? suggestLeadForEmail(active.fromEmail, leads)
      : null;
  const suggestedCompany = suggested
    ? companies.find((c) => c.id === suggested.companyId)
    : null;

  return (
    <Fragment>
      <Seo title="Inbox" />
      <div className="crm-inbox-page">
        <div className="crm-inbox-shell box custom-box !mb-0">
          <div className="box-body !p-0">
            <div className="crm-inbox-layout">
              <InboxSidebar
                gmailConnected={gmailConnected}
                onConnect={connectGmail}
                onCompose={() => setComposeOpen(true)}
                activeFolder={activeFolder}
                onFolderChange={setActiveFolder}
                folderCounts={folderCounts}
                activeTag={activeTag}
                onTagChange={setActiveTag}
                onlineContacts={contacts}
              />

              <InboxListPanel
                gmailConnected={gmailConnected}
                onConnect={connectGmail}
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
              />

              {active && activeMeta ? (
                <InboxDetailPanel
                  active={active}
                  meta={activeMeta}
                  gmailConnected={gmailConnected}
                  starred={starredIds.includes(active.id)}
                  onToggleStar={() =>
                    setStarredIds((prev) =>
                      prev.includes(active.id)
                        ? prev.filter((x) => x !== active.id)
                        : [...prev, active.id]
                    )
                  }
                  onMarkUnread={() =>
                    setReadIds((prev) => prev.filter((id) => id !== active.id))
                  }
                  onArchive={() => {
                    setArchivedIds((prev) =>
                      prev.includes(active.id) ? prev : [...prev, active.id]
                    );
                    setTrashedIds((prev) => prev.filter((id) => id !== active.id));
                    setSelectedId(null);
                  }}
                  onDelete={() => {
                    setTrashedIds((prev) =>
                      prev.includes(active.id) ? prev : [...prev, active.id]
                    );
                    setArchivedIds((prev) =>
                      prev.filter((id) => id !== active.id)
                    );
                    setSelectedId(null);
                  }}
                  replyText={replyText}
                  onReplyChange={setReplyText}
                  onSendReply={handleSendReply}
                  sending={sending}
                  sentFlash={sentFlash}
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
                contacts={contacts}
                onComposeTo={openComposeTo}
              />
            </div>
          </div>
        </div>
      </div>

      <InboxCompose
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        draft={composeDraft}
        onDraftChange={(patch) =>
          setComposeDraft((prev) => ({ ...prev, ...patch }))
        }
        onSend={handleSendCompose}
        sending={sending}
      />
    </Fragment>
  );
}
