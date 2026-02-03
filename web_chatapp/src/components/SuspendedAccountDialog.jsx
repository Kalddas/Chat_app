import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, AlertCircle, Send, MessageSquare, Mail, Reply } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

export default function SuspendedAccountDialog({ open, onOpenChange, token }) {
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!token) {
      toast.error("You must be logged in to send a message");
      return;
    }

    setIsSendingMessage(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/suspended-messages",
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Your message has been sent to the admin successfully!");
        setMessageText("");
        loadUserMessages(); // Reload messages after sending
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to send message. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const loadUserMessages = async () => {
    if (!token) return;
    
    setIsLoadingMessages(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/suspended-messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        setUserMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (open && token) {
      loadUserMessages();
    }
  }, [open, token]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-card dark:border-white/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center dark:text-foreground">
            Account Suspended
          </DialogTitle>
          <DialogDescription className="text-center dark:text-muted-foreground">
            Your account has been temporarily suspended
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Account Suspension Notice:</strong> Your account has been suspended by an administrator. 
              You can still login, but access to most features has been restricted until the suspension is reviewed.
              <br /><br />
              <strong>Need help?</strong> Please send a message below to contact the admin team for assistance.
            </AlertDescription>
          </Alert>

          {/* Message Form */}
          <div className="bg-indigo-50 dark:bg-card border border-indigo-200 dark:border-white/20 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 dark:text-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Message to Admin
            </h3>
            <p className="text-indigo-800 dark:text-muted-foreground text-sm mb-4">
              <strong>Send a message for help:</strong> Use the form below to contact the admin team or submit an appeal. 
              They will review your message and respond as soon as possible.
            </p>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-text" className="text-indigo-900 dark:text-foreground">
                  Your Message:
                </Label>
                <Textarea
                  id="message-text"
                  placeholder="Type your message to the admin or explain why you believe your account should be reinstated..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required
                  minLength={1}
                  maxLength={5000}
                  rows={6}
                  className="border-indigo-300 dark:border-white/20 dark:bg-card dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500"
                />
                <p className="text-xs text-indigo-700 dark:text-muted-foreground">
                  Maximum 5000 characters. ({messageText.length}/5000)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isSendingMessage || !messageText.trim()}
              >
                {isSendingMessage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message to Admin
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Previous Messages Section */}
          {userMessages.length > 0 && (
            <div className="bg-gray-50 dark:bg-card border border-gray-200 dark:border-white/20 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Your Messages & Responses
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {userMessages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    {/* User's Message */}
                    <div className="bg-white dark:bg-background border border-gray-200 dark:border-white/20 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-foreground">
                          Your Message:
                        </p>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground ml-auto">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-foreground whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      {msg.is_read && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          ✓ Read by admin
                        </p>
                      )}
                    </div>

                    {/* Admin Response */}
                    {msg.admin_response && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 ml-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Reply className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-xs font-semibold text-green-800 dark:text-green-200">
                            Admin Response:
                          </p>
                          {msg.responded_at && (
                            <p className="text-xs text-green-600 dark:text-green-400 ml-auto">
                              {new Date(msg.responded_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap">
                          {msg.admin_response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoadingMessages && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-primary" />
            </div>
          )}

          <div className="pt-4 border-t dark:border-white/20">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                While your account is suspended, you can:
              </p>
              <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                <li>• View your account status</li>
                <li>• Send messages to admin</li>
                <li>• View your message history</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-4">
                All other features are temporarily unavailable.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

