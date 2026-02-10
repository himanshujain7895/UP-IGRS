/**
 * NOTIFICATION MODULE
 * - Complaint path: notifyAsync(event) → Notification (complaint_id, timeline). EVENT_RECEIVER_MAP.
 * - Common path: notifyCommonAsync(payload) → CommonWorkingNotification (meetings, inventory, etc). COMMON_EVENT_RECEIVER_MAP.
 *   One row per event (no user_id); all admins see the same notification. entity_id = e.g. meeting.id.
 */

export { notifyAsync, notifyCommonAsync, handleCommonEvent } from "./orchestrator";
export type { CommonEventPayload } from "./orchestrator";
export { NOTIFIABLE_EVENT_TYPES, isNotifiableEventType } from "./types";
export {
  COMMON_NOTIFIABLE_EVENT_TYPES,
  isCommonNotifiableEventType,
} from "./types";
export type {
  NotifiableEventType,
  TimelineEventLike,
  CommonNotifiableEventType,
  CommonNotificationInput,
} from "./types";
export {
  EVENT_RECEIVER_MAP,
  COMMON_EVENT_RECEIVER_MAP,
  type EventReceiverConfig,
  type ReceiverKind,
  type CommonReceiverKind,
  type CommonEventReceiverConfig,
} from "./eventReceiversMap";
