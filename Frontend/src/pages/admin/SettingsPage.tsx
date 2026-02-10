/**
 * Settings Page
 * Includes Profile update, Password change, and Notification Control Panel (admin).
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Settings, User, Bell, Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import {
  notificationsService,
  type NotificationSettingsItem,
} from "@/services/notifications.service";

const EVENT_TYPE_LABELS: Record<string, string> = {
  complaint_created: "New complaint created",
  officer_assigned: "Officer assigned",
  officer_reassigned: "Officer reassigned",
  officer_unassigned: "Officer unassigned",
  extension_requested: "Extension requested",
  extension_approved: "Extension approved",
  extension_rejected: "Extension rejected",
  complaint_closed: "Complaint closed",
  note_added: "Admin note added",
  document_added: "Admin document added",
  officer_note_added: "Officer note added",
  officer_document_added: "Officer document added",
};

const PASSWORD_MIN_LENGTH = 6;

const SettingsPage: React.FC = () => {
  const { user, isAdmin, getMe } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState<
    NotificationSettingsItem[]
  >([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Profile form
  const [name, setName] = useState(user?.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  const passwordConfirmMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    if (!isAdmin) {
      setSettingsLoading(false);
      return;
    }
    let cancelled = false;
    notificationsService
      .getNotificationSettings()
      .then((settings) => {
        if (!cancelled) setNotificationSettings(settings);
      })
      .catch((e) => console.error("Failed to load notification settings", e))
      .finally(() => {
        if (!cancelled) setSettingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Settings
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProfileSaving(true);
                try {
                  await authService.updateProfile(name);
                  await getMe();
                  toast.success("Profile updated successfully.");
                } catch (err: any) {
                  toast.error(err?.message ?? "Failed to update profile.");
                } finally {
                  setProfileSaving(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  disabled={profileSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                />
              </div>
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Change your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newPassword.length < PASSWORD_MIN_LENGTH) {
                  toast.error(`New password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error("New password and confirm password do not match.");
                  return;
                }
                setCurrentPasswordError(null);
                setPasswordSaving(true);
                try {
                  await authService.changePassword(currentPassword, newPassword);
                  toast.success("Password updated successfully.");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                } catch (err: any) {
                  const backendMessage = err?.response?.data?.error?.message;
                  const isWrongCurrentPassword =
                    err?.response?.status === 401 &&
                    (backendMessage?.toLowerCase().includes("current password") ?? false);
                  const message =
                    backendMessage ??
                    err?.message ??
                    "Failed to update password.";
                  toast.error(
                    isWrongCurrentPassword
                      ? "Your current password is incorrect. Please try again."
                      : message
                  );
                  if (isWrongCurrentPassword) {
                    setCurrentPasswordError("Your current password is incorrect. Please try again.");
                  }
                } finally {
                  setPasswordSaving(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (currentPasswordError) setCurrentPasswordError(null);
                    }}
                    placeholder="Enter current password"
                    required
                    disabled={passwordSaving}
                    autoComplete="current-password"
                    className={`pr-10 ${currentPasswordError ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowCurrentPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground disabled:opacity-50"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    disabled={passwordSaving}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {currentPasswordError && (
                  <p className="text-sm text-destructive font-medium">
                    {currentPasswordError}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    disabled={passwordSaving}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground disabled:opacity-50"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    disabled={passwordSaving}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={passwordSaving}
                    autoComplete="new-password"
                    className={`pr-10 ${passwordConfirmMismatch ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground disabled:opacity-50"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    disabled={passwordSaving}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordConfirmMismatch && (
                  <p className="text-sm text-destructive">
                    New password and confirm password must be equal.
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={passwordSaving || passwordConfirmMismatch}
              >
                {passwordSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Control Panel (admin only) */}
        {isAdmin && (
          <Card className="border-orange-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification control
              </CardTitle>
              <CardDescription>
                Turn on/off which events trigger in-app notifications for admins
                and officers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {notificationSettings.map((s) => (
                    <div
                      key={s.event_type}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <Label
                        htmlFor={`notif-${s.event_type}`}
                        className="flex-1 cursor-pointer"
                      >
                        {EVENT_TYPE_LABELS[s.event_type] ?? s.event_type}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {s.enabled ? "On" : "Off"}
                        </span>
                        <button
                          id={`notif-${s.event_type}`}
                          type="button"
                          role="switch"
                          aria-checked={s.enabled}
                          disabled={savingId === s.event_type}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                            s.enabled ? "bg-primary" : "bg-muted"
                          }`}
                          onClick={async () => {
                            setSavingId(s.event_type);
                            try {
                              const updated =
                                await notificationsService.updateNotificationSettings(
                                  [
                                    {
                                      event_type: s.event_type,
                                      enabled: !s.enabled,
                                    },
                                  ]
                                );
                              setNotificationSettings((prev) =>
                                prev.map((x) =>
                                  x.event_type === s.event_type
                                    ? {
                                        ...x,
                                        enabled:
                                          updated[0]?.enabled ?? !s.enabled,
                                      }
                                    : x
                                )
                              );
                            } catch (e) {
                              console.error("Failed to update setting", e);
                            } finally {
                              setSavingId(null);
                            }
                          }}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                              s.enabled ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Settings */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              System Settings
            </CardTitle>
            <CardDescription>Configure system-wide settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <select className="w-full p-2 border rounded-md">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <select className="w-full p-2 border rounded-md">
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
              </select>
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
