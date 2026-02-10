/**
 * COMMON WORKING NOTIFICATION MODEL
 * Parallel to complaint-scoped Notification: for meetings, inventory, and other modules.
 * Only id, created_at, and marked_read_at are required; all other fields are optional.
 * Collection: commonWorkingNotifications
 *
 * SEMANTICS:
 * - One row per EVENT (e.g. one row per meeting request). Not bound to user_id.
 * - All meeting requests are for "the admin" (any user with admin role); all admins see the same list.
 * - user_id is optional; when omitted, the notification is for all admins (list by context_type / entity_id, no user filter).
 * - entity_type + entity_id = what the notification is about (e.g. meeting.id).
 */

import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ICommonWorkingNotification extends Document {
  id: string;
  created_at: Date;
  marked_read_at?: Date | null;
  /** Optional: when set, notification is for that user; when omitted, for all admins (one row per event). */
  user_id?: string;
  /** Event type (e.g. meeting_requested). */
  event_type?: string;
  /** Context/module (e.g. "meeting", "inventory"). */
  context_type?: string;
  /** Type of the entity this notification is about (e.g. "meeting"). */
  entity_type?: string;
  /** Id of the entity this notification is about (e.g. meeting.id). */
  entity_id?: string;
  title?: string;
  body?: string;
  payload?: Record<string, unknown>;
}

const CommonWorkingNotificationSchema = new Schema<ICommonWorkingNotification>(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
      index: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    marked_read_at: {
      type: Date,
      default: null,
      required: false,
      index: true,
    },
    user_id: { type: String, required: false, index: true },
    event_type: { type: String, required: false, index: true },
    context_type: { type: String, required: false, index: true },
    entity_type: { type: String, required: false },
    entity_id: { type: String, required: false, index: true },
    title: { type: String, required: false, maxlength: 300 },
    body: { type: String, required: false, maxlength: 2000 },
    payload: { type: Schema.Types.Mixed, required: false, default: {} },
  },
  {
    timestamps: false,
    collection: "commonWorkingNotifications",
    strict: true,
  }
);

CommonWorkingNotificationSchema.index({ user_id: 1, created_at: -1 });
CommonWorkingNotificationSchema.index({ user_id: 1, marked_read_at: 1 });

const CommonWorkingNotification: Model<ICommonWorkingNotification> =
  mongoose.models.CommonWorkingNotification ||
  mongoose.model<ICommonWorkingNotification>(
    "CommonWorkingNotification",
    CommonWorkingNotificationSchema
  );

export default CommonWorkingNotification;
