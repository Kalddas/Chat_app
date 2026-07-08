/** Simple Online / Offline label from API is_online flag */
export function formatOnlineStatus(isOnline, t) {
  return isOnline ? t("common.online") : t("common.offline");
}
