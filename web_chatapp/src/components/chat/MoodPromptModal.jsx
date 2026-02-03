import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOOD_OPTIONS, setMoodPromptShown } from "@/lib/mood";
import { useUpdateMoodMutation } from "../../services/userService";

export function MoodPromptModal({ open, onClose, onMoodSet, onSkip, userId }) {
  const { t } = useTranslation();
  const [updateMood, { isLoading }] = useUpdateMoodMutation();
  const closedByMoodRef = useRef(false);

  const handleSelect = async (mood) => {
    try {
      await updateMood({ mood }).unwrap();
      closedByMoodRef.current = true;
      if (userId) setMoodPromptShown(userId);
      onMoodSet?.();
      onClose?.();
    } catch {
      // Error toast can be added here if needed
    }
  };

  const handleSkip = () => {
    if (userId) setMoodPromptShown(userId);
    onSkip?.();
    onClose?.();
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      if (!closedByMoodRef.current) handleSkip();
      closedByMoodRef.current = false;
    }
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card dark:bg-card border-indigo-200 dark:border-white/30">
        <DialogHeader>
          <DialogTitle className="text-xl text-indigo-900 dark:text-foreground">
            {t('mood.title')}
          </DialogTitle>
          <DialogDescription className="text-indigo-600 dark:text-muted-foreground">
            {t('mood.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-2 py-2">
          {MOOD_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleSelect(opt.key)}
              className="h-auto py-4 flex flex-col gap-1 border-indigo-200 dark:border-white/30 text-indigo-800 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent hover:border-indigo-300"
            >
              <span className="text-2xl leading-none">{opt.emoji}</span>
              <span className="text-xs capitalize leading-none">{t(opt.labelKey)}</span>
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-indigo-600 dark:text-muted-foreground"
          onClick={handleSkip}
          disabled={isLoading}
        >
          {t('common.skip')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
