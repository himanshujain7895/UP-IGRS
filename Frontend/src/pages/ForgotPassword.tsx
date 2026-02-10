/**
 * Forgot Password Page
 * Step 1: Enter email → request OTP
 * Step 2: Enter OTP (with resend) → continue
 * Step 3: New password + confirm → reset
 * Tied to user by email (kept in state across steps); reset API uses email + otp + newPassword.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, KeyRound, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;
const PASSWORD_MIN = 6;
const RESEND_COOLDOWN_SEC = 60;

type Step = 1 | 2 | 3;

function validateEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "Email is required";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address";
  return null;
}

function validateOTP(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== OTP_LENGTH) return `Enter ${OTP_LENGTH} digit code`;
  return null;
}

function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  return null;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailError = step === 1 ? validateEmail(email) : null;
  const otpError = step === 2 ? validateOTP(otp) : null;
  const passwordError = newPassword ? validatePassword(newPassword) : null;
  const confirmError =
    confirmPassword.length > 0 && newPassword !== confirmPassword
      ? "Passwords do not match"
      : null;

  const runResendCooldown = useCallback(() => {
    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
      resendIntervalRef.current = null;
    }
    setResendCooldown(RESEND_COOLDOWN_SEC);
    resendIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendIntervalRef.current) {
            clearInterval(resendIntervalRef.current);
            resendIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
    };
  }, []);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      toast.error(err);
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const res = await authService.forgotPassword(normalizedEmail);
      setEmail(normalizedEmail);
      toast.success(res.message || "If an account exists, you will receive a code shortly.");
      setStep(2);
      runResendCooldown();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || (e instanceof Error ? e.message : "Request failed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const err = validateEmail(email);
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      const res = await authService.resendPasswordOTP(email);
      toast.success(res.message || "A new code has been sent.");
      runResendCooldown();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || (e instanceof Error ? e.message : "Resend failed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateOTP(otp);
    if (err) {
      toast.error(err);
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email) || validateOTP(otp) || validatePassword(newPassword)) {
      toast.error("Please fix the errors below.");
      return;
    }
    if (newPassword !== confirmPassword || confirmPassword.length === 0) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.resetPassword(email, otp, newPassword);
      toast.success(res.message || "Password reset successfully. You can sign in now.");
      navigate("/login", { replace: true });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || (e instanceof Error ? e.message : "Reset failed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(v);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
          <CardDescription>
            {step === 1 && "Enter your portal email to receive a verification code."}
            {step === 2 && "Enter the 6-digit code sent to your email."}
            {step === 3 && "Choose a new password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  step >= s ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="block text-sm font-medium mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="forgot-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className={`pl-10 ${emailError ? "border-destructive" : ""}`}
                    disabled={loading}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "forgot-email-err" : undefined}
                  />
                </div>
                {emailError && (
                  <p id="forgot-email-err" className="text-sm text-destructive">
                    {emailError}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send verification code"
                )}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleContinueToPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Code sent to <strong>{email}</strong>
              </p>
              <div className="space-y-2">
                <label htmlFor="forgot-otp" className="block text-sm font-medium mb-2">
                  Verification code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="forgot-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={handleOTPChange}
                    placeholder="000000"
                    maxLength={OTP_LENGTH}
                    className={`pl-10 font-mono text-lg tracking-widest ${otpError ? "border-destructive" : ""}`}
                    disabled={loading}
                    aria-invalid={!!otpError}
                  />
                </div>
                {otpError && (
                  <p className="text-sm text-destructive">{otpError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading || resendCooldown > 0}
                  onClick={handleResend}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || otp.length !== OTP_LENGTH}>
                  Continue
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="forgot-new-password" className="block text-sm font-medium mb-2">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <Input
                    id="forgot-new-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`pl-10 pr-10 ${passwordError ? "border-destructive" : ""}`}
                    disabled={loading}
                    minLength={PASSWORD_MIN}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive mt-1">{passwordError}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="forgot-confirm-password" className="block text-sm font-medium mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <Input
                    id="forgot-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={`pl-10 pr-10 ${confirmError ? "border-destructive" : ""}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmError && (
                  <p className="text-sm text-destructive mt-1">{confirmError}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  !!passwordError ||
                  !!confirmError ||
                  newPassword !== confirmPassword ||
                  newPassword.length < PASSWORD_MIN ||
                  confirmPassword.length === 0
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
