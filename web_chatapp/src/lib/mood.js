export const MOOD_KEYS = /** @type {const} */ ([
  "happy",
  "sad",
  "exhausted",
  "anxious",
  "calm",
  "energetic",
  "stressed",
]);

export const MOOD_META = {
  happy: { emoji: "😊", labelKey: "mood.happy", sentenceKey: "mood.sentence.happy" },
  sad: { emoji: "😔", labelKey: "mood.sad", sentenceKey: "mood.sentence.sad" },
  exhausted: { emoji: "😴", labelKey: "mood.exhausted", sentenceKey: "mood.sentence.exhausted" },
  anxious: { emoji: "😰", labelKey: "mood.anxious", sentenceKey: "mood.sentence.anxious" },
  calm: { emoji: "😌", labelKey: "mood.calm", sentenceKey: "mood.sentence.calm" },
  energetic: { emoji: "⚡", labelKey: "mood.energetic", sentenceKey: "mood.sentence.energetic" },
  stressed: { emoji: "😵‍💫", labelKey: "mood.stressed", sentenceKey: "mood.sentence.stressed" },
};

export const MOOD_OPTIONS = MOOD_KEYS.map((key) => ({
  key,
  emoji: MOOD_META[key].emoji,
  labelKey: MOOD_META[key].labelKey,
  sentenceKey: MOOD_META[key].sentenceKey,
}));

/**
 * Get the translation key for mood sentence
 * @param {string} moodKey - The mood key (happy, sad, etc.)
 * @returns {string|null} Translation key for the sentence
 */
export function getMoodSentenceKey(moodKey) {
  const meta = moodKey ? MOOD_META[moodKey] : undefined;
  if (!meta) return null;
  return meta.sentenceKey;
}

/**
 * Get the translation key for mood label
 * @param {string} moodKey - The mood key (happy, sad, etc.)
 * @returns {string|null} Translation key for the label
 */
export function getMoodLabelKey(moodKey) {
  const meta = moodKey ? MOOD_META[moodKey] : undefined;
  if (!meta) return null;
  return meta.labelKey;
}

export function getMoodEmoji(moodKey) {
  const meta = moodKey ? MOOD_META[moodKey] : undefined;
  return meta?.emoji ?? null;
}

/**
 * Get formatted mood sentence with emoji (requires t function from useTranslation)
 * @param {string} moodKey - The mood key
 * @param {Function} t - Translation function from useTranslation()
 * @returns {string|null} Formatted mood sentence with emoji
 */
export function getFormattedMoodSentence(moodKey, t) {
  const meta = moodKey ? MOOD_META[moodKey] : undefined;
  if (!meta || !t) return null;
  return `${meta.emoji} ${t(meta.sentenceKey)}`;
}

export function isMoodFresh(moodUpdatedAt) {
  if (!moodUpdatedAt) return false;
  const ts = new Date(moodUpdatedAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= 24 * 60 * 60 * 1000;
}

export function getVisibleMood(moodKey, moodUpdatedAt) {
  if (!moodKey || !isMoodFresh(moodUpdatedAt)) return null;
  return { mood: moodKey, updatedAt: moodUpdatedAt };
}

/** localStorage key for \"last time mood prompt was shown\" (per user: mood_prompt_last_shown_at_{userId}) */
export const MOOD_PROMPT_LAST_SHOWN_KEY_PREFIX = "mood_prompt_last_shown_at_";

export function getMoodPromptLastShownKey(userId) {
  return userId ? `${MOOD_PROMPT_LAST_SHOWN_KEY_PREFIX}${userId}` : null;
}

export function getMoodPromptLastShownAt(userId) {
  const key = getMoodPromptLastShownKey(userId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Date(raw) : null;
  } catch {
    return null;
  }
}

export function setMoodPromptShown(userId) {
  const key = getMoodPromptLastShownKey(userId);
  if (key) localStorage.setItem(key, new Date().toISOString());
}

/** True if the prompt was shown within the last 24 hours */
export function isPromptFresh(lastShownAt) {
  if (!lastShownAt) return false;
  const ts = new Date(lastShownAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= 24 * 60 * 60 * 1000;
}

/**
 * Whether to show the \"How do you feel today?\" prompt.
 *
 * We now only depend on \"last time the prompt was shown\" so that:
 * - After login, if it has been more than 24 hours since the last prompt,
 *   we show it again.
 * - Skipping or selecting a mood both count as \"shown\".
 */
export function shouldShowMoodPrompt(userId) {
  const lastShown = getMoodPromptLastShownAt(userId);
  return !isPromptFresh(lastShown);
}

