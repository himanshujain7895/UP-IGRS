/**
 * NOTIFICATION MODULE - TYPES
 * Complaint-isolated: every notification is tied to complaint_id + event_type.
 */

import type { IComplaintTimelineEvent } from "../../models/ComplaintTimelineEvent";

/** Result of resolving who should receive a notification for one event */
export interface RecipientResult {
  /** Admin user ids (get every notification when event is enabled) */
  adminUserIds: string[];
  /** Officer user ids (only for officer-relevant events: assign/unassign/reassign/extension) */
  officerUserIds: string[];
}

/** Input to build one in-app notification */
export interface NotificationInput {
  user_id: string;
  event_type: string;
  complaint_id: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  timeline_event_id?: string;
}

/** Event types we support for notifications (subset of ComplaintTimelineEventType) */
export const NOTIFIABLE_EVENT_TYPES = [
  "complaint_created",
  "officer_assigned",
  "officer_reassigned",
  "officer_unassigned",
  "extension_requested",
  "extension_approved",
  "extension_rejected",
  "complaint_closed",
  "note_added",
  "document_added",
  "officer_note_added",
  "officer_document_added",
] as const;

export type NotifiableEventType = (typeof NOTIFIABLE_EVENT_TYPES)[number];

export function isNotifiableEventType(
  eventType: string
): eventType is NotifiableEventType {
  return (NOTIFIABLE_EVENT_TYPES as readonly string[]).includes(eventType);
}

/** Timeline event shape we receive (plain or document) */
export type TimelineEventLike = Pick<
  IComplaintTimelineEvent,
  "id" | "complaint_id" | "event_type" | "payload" | "actor_name"
>;

// ---- Common working notifications (parallel system: meetings, inventory, etc.) ----

/** Event types for the common notification system (non-complaint modules). */
export const COMMON_NOTIFIABLE_EVENT_TYPES = ["meeting_requested"] as const;

export type CommonNotifiableEventType =
  (typeof COMMON_NOTIFIABLE_EVENT_TYPES)[number];

export function isCommonNotifiableEventType(
  eventType: string
): eventType is CommonNotifiableEventType {
  return (COMMON_NOTIFIABLE_EVENT_TYPES as readonly string[]).includes(
    eventType
  );
}

/**
 * Input for one common working notification (no complaint_id / timeline_event_id).
 * When receivers are "admins" only: one row per event, no user_id (all admins see the same notification).
 * entity_type + entity_id = what it's about (e.g. meeting id).
 */
export interface CommonNotificationInput {
  /** Omitted for admin-broadcast: one row per event, visible to any admin. */
  user_id?: string;
  event_type: string;
  title?: string;
  body?: string;
  context_type?: string;
  entity_type?: string;
  /** Id of the entity this notification is about (e.g. meeting.id). */
  entity_id?: string;
  payload?: Record<string, unknown>;
}
