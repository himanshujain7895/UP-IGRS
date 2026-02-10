/**
 * Meetings Management Page
 * Displays all meeting requests with full requester and meeting details.
 * Status filter syncs with sidebar (URL: /admin/meetings, /pending, /approved, /completed).
 */

import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMeetings } from "@/hooks/useMeetings";
import { useAuth } from "@/hooks/useAuth";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CalendarCheck,
  CheckCircle,
  Clock,
  Building2,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  User,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/types";

type MeetingStatusFilter = "all" | "pending" | "approved" | "completed";

const STATUS_OPTIONS: {
  value: MeetingStatusFilter;
  label: string;
  path: string;
  icon: typeof Calendar;
}[] = [
  {
    value: "all",
    label: "All Meetings",
    path: "/admin/meetings",
    icon: Calendar,
  },
  {
    value: "pending",
    label: "Pending Requests",
    path: "/admin/meetings/pending",
    icon: Clock,
  },
  {
    value: "approved",
    label: "Approved",
    path: "/admin/meetings/approved",
    icon: CheckCircle,
  },
  {
    value: "completed",
    label: "Completed",
    path: "/admin/meetings/completed",
    icon: CheckCircle,
  },
];

function getStatusFromPath(pathname: string): MeetingStatusFilter {
  if (pathname.endsWith("/pending")) return "pending";
  if (pathname.endsWith("/approved")) return "approved";
  if (pathname.endsWith("/completed")) return "completed";
  return "all";
}

const STATUS_STYLES: Record<
  string,
  { className: string; icon: typeof Clock; label: string }
> = {
  pending: {
    className:
      "text-amber-700 bg-amber-500/8 dark:text-amber-400 dark:bg-amber-500/12",
    icon: Clock,
    label: "Pending",
  },
  approved: {
    className:
      "text-emerald-700 bg-emerald-500/8 dark:text-emerald-400 dark:bg-emerald-500/12",
    icon: CheckCircle,
    label: "Approved",
  },
  rejected: {
    className:
      "text-slate-600 bg-slate-500/8 dark:text-slate-400 dark:bg-slate-500/12",
    icon: XCircle,
    label: "Rejected",
  },
  completed: {
    className:
      "text-blue-700 bg-blue-500/8 dark:text-blue-400 dark:bg-blue-500/12",
    icon: CheckCircle,
    label: "Completed",
  },
};

function getStatusBadge(status: string) {
  const c = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
        c.className,
      )}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" />
      {c.label}
    </span>
  );
}

function formatMeetingType(type: string): string {
  const map: Record<string, string> = {
    general_inquiry: "General Inquiry",
    complaint_followup: "Complaint Follow-up",
    suggestion: "Suggestion",
    other: "Other",
  };
  return map[type] || type;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTime(t?: string): string {
  if (!t) return "—";
  return t;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const MeetingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { meetings, fetchMeetings, updateMeeting, loading, pagination } =
    useMeetings();
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = React.useState(1);
  const statusFilter = getStatusFromPath(location.pathname);
  const highlightId = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("highlight") || undefined;
  }, [location.search]);

  // Fetch meetings whenever page changes. Filter by status on the client.
  useEffect(() => {
    fetchMeetings(currentPage, 20);
  }, [fetchMeetings, currentPage]);

  // Client-side filter: no extra API calls when changing status tab/sidebar.
  const filteredMeetings = useMemo(() => {
    if (statusFilter === "all") return meetings;
    return meetings.filter((m) => m.status === statusFilter);
  }, [meetings, statusFilter]);

  const handleFilterClick = (path: string) => {
    navigate(path);
  };

  const handleStatusSelectChange = (value: MeetingStatusFilter) => {
    const target = STATUS_OPTIONS.find((opt) => opt.value === value);
    if (target) {
      handleFilterClick(target.path);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header – minimal */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-foreground tracking-tight">
          Meetings
        </h1>
        <p className="text-[13px] text-muted-foreground">
          View and manage meeting requests from constituents
        </p>
      </div>

      {/* Status filter – select on small screens, tabs on larger screens */}
      {/* Mobile: full-width select (Radix portal avoids overflow clipping) */}
      <div className="sm:hidden">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Status
        </label>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            handleStatusSelectChange(value as MeetingStatusFilter)
          }
        >
          <SelectTrigger className="w-full text-[13px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[min(16rem,70vh)]">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop / tablet: horizontal tabs */}
      <nav className="relative -mx-3 px-3 overflow-x-auto hidden sm:block">
        <div className="flex items-stretch gap-0 border-b border-border/80 min-w-max">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFilterClick(opt.path)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 px-3 py-2 text-[12px] sm:text-[13px] font-medium transition-colors -mb-px border-b-2 whitespace-nowrap",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-[13px] text-muted-foreground">Loading…</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="flex items-center justify-center py-16 rounded-lg border border-dashed border-border/80 bg-muted/20">
          <p className="text-[13px] text-muted-foreground">
            No meetings
            {statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMeetings.map((meeting: Meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              canManage={isAdmin}
              highlighted={highlightId === meeting.id}
              onChangeStatus={(status) =>
                updateMeeting(meeting.id, { status } as Partial<Meeting>)
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredMeetings.length > 0 && pagination && (
        <Pagination
          meta={pagination}
          page={pagination.page}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="meetings"
        />
      )}
    </div>
  );
};

function normalizePurpose(text: string | undefined): string {
  if (!text || typeof text !== "string") return "";
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function MeetingCard({
  meeting,
  canManage,
  highlighted,
  onChangeStatus,
}: {
  meeting: Meeting;
  canManage: boolean;
  highlighted?: boolean;
  onChangeStatus?: (status: Meeting["status"]) => void;
}) {
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  const hasAttachments =
    (meeting.attachment_urls?.length ?? 0) > 0;
  const purposeText = normalizePurpose(meeting.purpose);
  const statusColor =
    meeting.status === "pending"
      ? "border-l-amber-400/60"
      : meeting.status === "approved"
        ? "border-l-emerald-400/60"
        : meeting.status === "completed"
          ? "border-l-blue-400/60"
          : "border-l-slate-300";

  return (
    <Card
      ref={cardRef}
      className={cn(
        "overflow-hidden border border-border/70 bg-card border-l-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        statusColor,
        highlighted && "ring-2 ring-primary/60 border-primary/70"
      )}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {getStatusBadge(meeting.status)}
          <span className="text-[11px] text-muted-foreground">
            {formatMeetingType(meeting.meeting_type)}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/70">
            {meeting.id.slice(0, 8)}
          </span>
        </div>
        <h2 className="text-[15px] font-medium text-foreground leading-snug">
          {meeting.meeting_subject}
        </h2>
        {purposeText && (
          <p className="line-clamp-2 text-[13px] leading-snug text-muted-foreground">
            {purposeText}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="space-y-1.5 rounded-md bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/90">
              Requester
            </p>
            <div className="space-y-1 text-[13px]">
              <InfoRow icon={User} value={meeting.requester_name} />
              <InfoRow icon={Mail} value={meeting.requester_email} />
              <InfoRow icon={Phone} value={meeting.requester_phone || "—"} />
              <InfoRow icon={MapPin} value={meeting.requester_area || "—"} />
            </div>
          </section>
          <section className="space-y-1.5 rounded-md bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/90">
              Schedule
            </p>
            <div className="space-y-1 text-[13px]">
              <InfoRow
                icon={Calendar}
                value={formatDate(meeting.preferred_date)}
              />
              <InfoRow
                icon={Clock}
                value={formatTime(meeting.preferred_time)}
              />
              {meeting.actual_meeting_date && (
                <InfoRow
                  icon={CalendarCheck}
                  value={formatDateTime(meeting.actual_meeting_date)}
                />
              )}
              {meeting.meeting_location && (
                <InfoRow icon={MapPin} value={meeting.meeting_location} />
              )}
              {meeting.assigned_staff && (
                <InfoRow icon={Building2} value={meeting.assigned_staff} />
              )}
            </div>
          </section>
        </div>

        {purposeText && (
          <section className="rounded-md border border-border/50 px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/90">
              Purpose
            </p>
            <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
              {purposeText}
            </p>
          </section>
        )}

        {(meeting.meeting_notes || meeting.admin_notes) && (
          <div className="space-y-1.5 rounded-md border border-border/50 px-3 py-2.5">
            {meeting.meeting_notes && (
              <p className="text-[13px]">
                <span className="text-muted-foreground">Notes: </span>
                {meeting.meeting_notes}
              </p>
            )}
            {meeting.admin_notes && (
              <p className="text-[13px]">
                <span className="text-muted-foreground">Admin: </span>
                {meeting.admin_notes}
              </p>
            )}
          </div>
        )}

        {hasAttachments && (
          <div className="rounded-md border border-border/50 px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/90">
              Attachments
            </p>
            <ul className="flex flex-wrap gap-2 text-[13px]">
              {(meeting.attachment_urls ?? []).map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {meeting.attachment_names?.[i] ?? `File ${i + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-[10px] text-muted-foreground/80">
          <div className="flex flex-wrap gap-x-3">
            <span>Created {formatDateTime(meeting.created_at)}</span>
            <span>Updated {formatDateTime(meeting.updated_at)}</span>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-1.5">
              {meeting.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    variant="default"
                    onClick={() => onChangeStatus?.("approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    variant="outline"
                    onClick={() => onChangeStatus?.("rejected")}
                  >
                    Reject
                  </Button>
                </>
              )}
              {meeting.status === "approved" && (
                <Button
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  variant="outline"
                  onClick={() => onChangeStatus?.("completed")}
                >
                  Mark Completed
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, value }: { icon: typeof User; value: string }) {
  return (
    <div className="flex items-center gap-2 text-foreground">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground/80" />
      <span className="truncate">{value || "—"}</span>
    </div>
  );
}

export default MeetingsPage;
