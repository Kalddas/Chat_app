import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export function ThemeToggle({ className = "", size = "sm", variant = "ghost" }) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, [theme]);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`text-indigo-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-white/10 ${className}`}
      onClick={toggleTheme}
      title={isDark ? t("settings.light") : t("settings.dark")}
      aria-label={isDark ? t("settings.light") : t("settings.dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
