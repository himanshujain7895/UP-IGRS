import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * PASSWORD RESET OTP MODEL
 * Stores email-based OTP for forgot-password flow (admin/officer only).
 * Separate from phone OTP to keep concerns isolated.
 *
 * Resend: Multiple OTPs per email are supported. Each "request" or "resend" creates
 * a new document; previous unused OTPs for that email are invalidated (used_at set).
 * Verification always uses the most recent valid OTP (sort by created_at: -1).
 * Rate limits (per email and per IP) are enforced in the service layer.
 */

export interface IPasswordResetOTP extends Document {
  id: string;
  email: string;
  otp: string;
  expires_at: Date;
  attempts: number;
  max_attempts: number;
  used_at?: Date;
  created_at: Date;
}

const PasswordResetOTPSchema = new Schema<IPasswordResetOTP>(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
      minlength: [6, 'OTP must be 6 digits'],
      maxlength: [6, 'OTP must be 6 digits'],
      match: [/^\d{6}$/, 'OTP must be 6 digits'],
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    max_attempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    used_at: Date,
    created_at: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'password_reset_otps',
  }
);

PasswordResetOTPSchema.index({ email: 1, created_at: -1 });
PasswordResetOTPSchema.index({ email: 1, expires_at: 1 });
// TTL to auto-delete expired records (optional; we also check expiry in code)
PasswordResetOTPSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetOTP: Model<IPasswordResetOTP> = mongoose.model<IPasswordResetOTP>(
  'PasswordResetOTP',
  PasswordResetOTPSchema
);
