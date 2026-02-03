import { useState } from "react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { useDeleteAccountMutation } from "../services/authService";

export default function DeleteAccountDialog({ open, onOpenChange }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {
      await deleteAccount({ password }).unwrap();
      
      // Account deleted successfully - the mutation will handle logout
      onOpenChange(false);
      
      // Redirect to home/login after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      setError(err?.data?.message || "Failed to delete account");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md bg-white dark:bg-card dark:border-white/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Delete Your Account
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left dark:text-muted-foreground">
            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deletePassword" className="dark:text-foreground">Enter your password to confirm</Label>
            <Input
              id="deletePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              className="dark:bg-card dark:text-foreground dark:border-white/20"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
              <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-1">Warning:</p>
            <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
              <li>All your conversations will be deleted</li>
              <li>All your messages will be permanently removed</li>
              <li>Your profile and data will be deleted</li>
              <li>This action is irreversible</li>
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setPassword(""); setError("");}} disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

