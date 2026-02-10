/**
 * NOTIFICATIONS SERVICE
 * Complaint-isolated: list/filter by complaint_id. Admin gets every notification;
 * officer gets only officer-relevant (stored the same; filtering by recipient is by user_id).
 * For admin: merges complaint + common (meetings, etc.) in one list, sorted by created_at.
 */

import Notification from "../models/Notification";
import CommonWorkingNotification from "../models/CommonWorkingNotification";
import NotificationSettings from "../models/NotificationSettings";
import { NOTIFIABLE_EVENT_TYPES } from "../modules/notifications";
import { NotFoundError } from "../utils/errors";

export interface ListNotificationsFilters {
  user_id: string;
  role?: string;
  complaint_id?: string;
  event_type?: string;
  unread_only?: boolean;
  limit?: number;
  skip?: number;
}

export type NotificationListItem = {
  id: string;
  user_id?: string;
  event_type: string;
  complaint_id?: string | null;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  source: "complaint" | "common";
  entity_type?: string;
  entity_id?: string;
};

export async function listNotifications(
  filters: ListNotificationsFilters
): Promise<{ notifications: NotificationListItem[]; total: number }> {
  const limit = Math.min(filters.limit ?? 50, 100);
  const skip = filters.skip ?? 0;
  const isAdmin = filters.role === "admin";

  const complaintQ: Record<string, unknown> = { user_id: filters.user_id };
  if (filters.complaint_id) complaintQ.complaint_id = filters.complaint_id;
  if (filters.event_type) complaintQ.event_type = filters.event_type;
  if (filters.unread_only) complaintQ.read_at = null;

  const fetchSize = isAdmin ? skip + limit : limit;
  const commonQ = filters.unread_only
    ? { marked_read_at: null }
    : {};

  const [complaintList, complaintTotal, commonList, commonTotal] = isAdmin
    ? await Promise.all([
        Notification.find(complaintQ)
          .sort({ created_at: -1 })
          .limit(fetchSize)
          .lean(),
        Notification.countDocuments(complaintQ),
        CommonWorkingNotification.find(commonQ)
          .sort({ created_at: -1 })
          .limit(fetchSize)
          .lean(),
        CommonWorkingNotification.countDocuments(commonQ),
      ])
    : await Promise.all([
        Notification.find(complaintQ)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(complaintQ),
        [] as any[],
        0,
      ]);

  const complaintItems: NotificationListItem[] = (complaintList as any[]).map(
    (n) => ({
      id: n.id,
      user_id: n.user_id,
      event_type: n.event_type,
      complaint_id: n.complaint_id,
      title: n.title,
      body: n.body,
      payload: n.payload,
      read_at: n.read_at ? new Date(n.read_at).toISOString() : null,
      created_at: new Date(n.created_at).toISOString(),
      source: "complaint" as const,
    })
  );

  const commonItems: NotificationListItem[] = (commonList as any[]).map(
    (n) => ({
      id: n.id,
      event_type: n.event_type || "",
      complaint_id: null,
      title: n.title || "",
      body: n.body,
      payload: n.payload,
      read_at: n.marked_read_at
        ? new Date(n.marked_read_at).toISOString()
        : null,
      created_at: new Date(n.created_at).toISOString(),
      source: "common" as const,
      entity_type: n.entity_type,
      entity_id: n.entity_id,
    })
  );

  if (!isAdmin) {
    return {
      notifications: complaintItems,
      total: complaintTotal,
    };
  }

  const merged = [...complaintItems, ...commonItems].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const total = complaintTotal + commonTotal;
  const paginated = merged.slice(skip, skip + limit);

  return {
    notifications: paginated,
    total,
  };
}

export async function getUnreadCount(
  userId: string,
  role?: string
): Promise<number> {
  const complaintUnread = await Notification.countDocuments({
    user_id: userId,
    read_at: null,
  });
  if (role !== "admin") return complaintUnread;
  const commonUnread = await CommonWorkingNotification.countDocuments({
    marked_read_at: null,
  });
  return complaintUnread + commonUnread;
}

export async function markAsRead(
  notificationId: string,
  userId: string,
  role?: string
): Promise<void> {
  const complaint = await Notification.findOne({
    id: notificationId,
    user_id: userId,
  });
  if (complaint) {
    complaint.read_at = new Date();
    await complaint.save();
    return;
  }
  if (role === "admin") {
    const common = await CommonWorkingNotification.findOne({
      id: notificationId,
    });
    if (common) {
      common.marked_read_at = new Date();
      await common.save();
      return;
    }
  }
  throw new NotFoundError("Notification");
}

export async function markAllAsRead(
  userId: string,
  role?: string
): Promise<number> {
  const complaintResult = await Notification.updateMany(
    { user_id: userId, read_at: null },
    { $set: { read_at: new Date() } }
  );
  let total = complaintResult.modifiedCount ?? 0;
  if (role === "admin") {
    const commonResult = await CommonWorkingNotification.updateMany(
      { marked_read_at: null },
      { $set: { marked_read_at: new Date() } }
    );
    total += commonResult.modifiedCount ?? 0;
  }
  return total;
}

/** Admin-only: get all notification settings (which event types are on/off) */
export async function getNotificationSettings(): Promise<
  { event_type: string; enabled: boolean }[]
> {
  const existing = await NotificationSettings.find().lean();
  const byType = new Map(existing.map((s) => [s.event_type, s.enabled]));

  return NOTIFIABLE_EVENT_TYPES.map((event_type) => ({
    event_type,
    enabled: byType.get(event_type) ?? true,
  }));
}

/** Admin-only: set enabled for one or more event types */
export async function updateNotificationSettings(
  updates: { event_type: string; enabled: boolean }[]
): Promise<{ event_type: string; enabled: boolean }[]> {
  const result: { event_type: string; enabled: boolean }[] = [];
  for (const { event_type, enabled } of updates) {
    await NotificationSettings.findOneAndUpdate(
      { event_type },
      { $set: { enabled, updated_at: new Date() } },
      { upsert: true, new: true }
    );
    result.push({ event_type, enabled });
  }
  return result;
}
