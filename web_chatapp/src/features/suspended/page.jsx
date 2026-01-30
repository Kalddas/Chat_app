import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Loader2, LogOut, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";

export default function SuspendedPage() {
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Get user from localStorage if not in context
  const localUser = localStorage.getItem("user");
  const currentUser = user || (localUser ? JSON.parse(localUser) : null);

  useEffect(() => {
    // Check if user is actually suspended, if not redirect
    if (currentUser?.profile?.status !== 'Suspended') {
      // If user is not suspended, redirect to chat or admin
      const redirectTo = currentUser?.role === 'admin' ? '/admin' : '/chat';
      navigate(redirectTo, { replace: true });
      return;
    }

    loadUserMessages();
  }, [token, currentUser, navigate]);

  const loadUserMessages = async () => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;
    
    setIsLoadingMessages(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/suspended-messages", {
        headers: {
          Authorization: `Bearer ${authToken}`,
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSendingMessage(true);

    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      toast.error("You must be logged in to send a message");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/suspended-messages",
        { message: messageText },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Your message has been sent to the admin successfully!");
        setMessageText("");
        loadUserMessages(); // Reload messages
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to send message. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSendingMessage(false);
    }
  };


  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl bg-white dark:bg-card dark:border-border">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-3xl text-gray-900 dark:text-foreground">Account Suspended</CardTitle>
          <CardDescription className="text-gray-600 dark:text-muted-foreground mt-2 text-lg">
            Your account has been temporarily suspended
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Account Suspension Notice:</strong> Your account has been suspended by an administrator. 
              You can still login, but access to most features has been restricted until the suspension is reviewed.
            </AlertDescription>
          </Alert>

          {/* Single Message Writing Area - Combined Message and Appeal */}
          <div className="bg-indigo-50 dark:bg-card border border-indigo-200 dark:border-border rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-indigo-900 dark:text-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contact Admin
            </h3>
            <p className="text-indigo-800 dark:text-muted-foreground text-sm mb-4">
              Send a message to the admin team or submit an appeal. They will review your message and respond as soon as possible.
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
                  className="border-indigo-300 dark:border-border dark:bg-card dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500"
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
            <div className="bg-gray-50 dark:bg-card border border-gray-200 dark:border-border rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Your Previous Messages
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {userMessages.map((msg) => (
                  <div key={msg.id} className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded p-3">
                    <p className="text-sm text-gray-700 dark:text-foreground whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2">
                      {new Date(msg.created_at).toLocaleString()}
                      {msg.is_read && (
                        <span className="ml-2 text-green-600 dark:text-green-400">✓ Read</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t dark:border-border">
            <div className="text-center space-y-4">
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

          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

