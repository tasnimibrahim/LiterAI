import { Button } from "@/components/ui/button";
import { Settings, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { User } from "@shared/types";

interface ChatHeaderProps {
  user: User | null;
  onLogout: () => void;
  onSettings: () => void;
}

export default function ChatHeader({ user, onLogout, onSettings }: ChatHeaderProps) {
  const { theme, setTheme: setThemeContext } = useTheme();
  const setTheme = setThemeContext || (() => {});

  return (
    <header className="border-b border-border bg-background p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-primary">LiterAI</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (theme === "light") setTheme("dark");
              else if (theme === "dark") setTheme("system");
              else setTheme("light");
            }}
            title={`Theme: ${theme}`}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : theme === "system" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* User Menu */}
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
