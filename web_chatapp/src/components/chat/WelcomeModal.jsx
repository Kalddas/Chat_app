import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useSendChatRequestMutation } from "../../services/chatService";
import { toast } from "react-toastify";

const USERS_PER_PAGE = 3;

export function WelcomeModal({ isOpen, onClose, recommendedUsers = [] }) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [sendChatRequest, { isLoading }] = useSendChatRequestMutation();

  const totalPages = Math.ceil(recommendedUsers.length / USERS_PER_PAGE);
  const startIndex = currentPage * USERS_PER_PAGE;
  const currentUsers = recommendedUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

  const resolveAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://127.0.0.1:8000/${url.replace(/^\/+/, "")}`;
  };

  const handleConnect = async (userId) => {
    try {
      await sendChatRequest({ receiver_id: userId }).unwrap();
      setSentRequests(prev => new Set([...prev, userId]));
      toast.success(t("discovery.requestSent"));
    } catch (err) {
      console.error("Failed to send request:", err);
      toast.error(err?.data?.message || t("discovery.requestFailed"));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleStartChatting = () => {
    // Mark as seen so it doesn't show again
    localStorage.setItem("welcome_modal_seen", "true");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-card border-none shadow-2xl">
        <div className="flex flex-col items-center py-6 px-4">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-2">
            {t("welcome.title", "Welcome to the Community!")}
          </h2>
          <p className="text-gray-500 dark:text-muted-foreground mb-8">
            {t("welcome.subtitle", "Your account has been successfully verified!")}
          </p>

          {/* Recommended Users Section */}
          {recommendedUsers.length > 0 && (
            <>
              <p className="text-gray-700 dark:text-foreground mb-6 text-center">
                {t("welcome.connectPrompt", "People you might want to connect with:")}
              </p>

              <div className="w-full space-y-3 mb-6">
                {currentUsers.map((user) => {
                  const isRequested = sentRequests.has(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-card/50 border border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-card transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={resolveAvatarUrl(user.profile_picture_url)}
                            alt={user.first_name}
                          />
                          <AvatarFallback className="bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">
                            {user.first_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-foreground">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-muted-foreground">
                            {t("welcome.matchScore", "Match score:")} {user.match_score}%
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleConnect(user.id)}
                        disabled={isRequested || isLoading}
                        variant={isRequested ? "outline" : "default"}
                        className={
                          isRequested
                            ? "gap-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                            : "gap-2 bg-primary hover:bg-primary/90"
                        }
                      >
                        <UserPlus className="h-4 w-4" />
                        {isRequested ? t("welcome.requested", "Requested") : t("welcome.connect", "Connect")}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="border-gray-300 dark:border-white/30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">
                    {t("welcome.page", "Page")} {currentPage + 1} {t("common.of", "of")} {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    className="border-gray-300 dark:border-white/30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Start Chatting Button */}
          <Button
            onClick={handleStartChatting}
            className="w-full max-w-md bg-primary hover:bg-primary/90 text-white py-6 text-lg font-semibold rounded-xl"
          >
            {t("welcome.startChatting", "Start Chatting")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
