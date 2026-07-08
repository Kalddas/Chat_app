import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { useChangePasswordMutation } from "../services/authService";
import { useTranslation } from "react-i18next";

export default function ChangePasswordDialog({ open, onOpenChange, onPasswordChanged }) {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  // Calculate password strength
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (newPassword.length >= 8) strength += 1;
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[a-z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;

    setPasswordStrength(strength);
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t("auth.fillRequiredFields"));
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(t("errors.passwordTooWeak"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        password_confirmation: confirmPassword,
      }).unwrap();
      
      // Clear form and close
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      
      // Notify parent that password was changed
      if (onPasswordChanged) {
        onPasswordChanged();
      }
      
      onOpenChange(false);
    } catch (err) {
      const errors = err?.data?.errors;
      const firstFieldError = errors && typeof errors === "object"
        ? Object.values(errors).flat()[0]
        : null;
      setError(firstFieldError || err?.data?.message || t("errors.failedToUpdate"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-card dark:border-white/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-foreground">
            <Lock className="h-5 w-5" />
            Change Your Password
          </DialogTitle>
          <DialogDescription className="dark:text-muted-foreground">
            Your account requires a password change. Please enter a new password to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword" className="dark:text-foreground">Current Password / Temporary Password</Label>
            <Input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              placeholder="Enter current password"
              className="dark:bg-card dark:text-foreground dark:border-white/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="dark:text-foreground">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
              className="dark:bg-card dark:text-foreground dark:border-white/30"
            />
            {newPassword && (
              <div className="space-y-2">
                <div className="text-xs space-y-1">
                  <p className={newPassword.length >= 8 ? "text-green-600" : "text-amber-600"}>
                    • At least 8 characters
                  </p>
                  <p className={/[A-Z]/.test(newPassword) ? "text-green-600" : "text-amber-600"}>
                    • One uppercase letter
                  </p>
                  <p className={/[a-z]/.test(newPassword) ? "text-green-600" : "text-amber-600"}>
                    • One lowercase letter
                  </p>
                  <p className={/\d/.test(newPassword) ? "text-green-600" : "text-amber-600"}>
                    • One number
                  </p>
                  <p className={/[@$!%*?&#]/.test(newPassword) ? "text-green-600" : "text-amber-600"}>
                    • One special character (@$!%*?&#)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="dark:text-foreground">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              className="dark:bg-card dark:text-foreground dark:border-white/30"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

