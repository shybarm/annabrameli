import { useState, useEffect } from "react";
import { Accessibility, Plus, Minus, Moon, Sun, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reduceMotion: boolean;
  darkMode: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  reduceMotion: false,
  darkMode: false,
};

export function AccessibilityMenu() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem("accessibilitySettings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("accessibilitySettings", JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (s: AccessibilitySettings) => {
    // Font size
    document.documentElement.style.fontSize = `${s.fontSize}%`;

    // High contrast
    if (s.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    // Reduce motion
    if (s.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    // Dark mode
    if (s.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const increaseFontSize = () => {
    setSettings((prev) => ({
      ...prev,
      fontSize: Math.min(prev.fontSize + 10, 150),
    }));
  };

  const decreaseFontSize = () => {
    setSettings((prev) => ({
      ...prev,
      fontSize: Math.max(prev.fontSize - 10, 80),
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-2 sm:right-4 z-50 h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="תפריט נגישות"
        >
          <Accessibility className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-4" side="top">
        <DropdownMenuLabel className="text-center text-lg font-bold">
          נגישות
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Font Size */}
        <div className="py-3">
          <Label className="text-sm font-medium mb-2 block">גודל טקסט</Label>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={decreaseFontSize}
              disabled={settings.fontSize <= 80}
              aria-label="הקטן טקסט"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {settings.fontSize}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={increaseFontSize}
              disabled={settings.fontSize >= 150}
              aria-label="הגדל טקסט"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* High Contrast */}
        <div className="flex items-center justify-between py-3">
          <Label htmlFor="high-contrast" className="text-sm font-medium cursor-pointer">
            ניגודיות גבוהה
          </Label>
          <Switch
            id="high-contrast"
            checked={settings.highContrast}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, highContrast: checked }))
            }
          />
        </div>

        <DropdownMenuSeparator />

        {/* Reduce Motion */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            {settings.reduceMotion ? (
              <Pause className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Play className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="reduce-motion" className="text-sm font-medium cursor-pointer">
              הפחת אנימציות
            </Label>
          </div>
          <Switch
            id="reduce-motion"
            checked={settings.reduceMotion}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, reduceMotion: checked }))
            }
          />
        </div>

        <DropdownMenuSeparator />

        {/* Dark Mode */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            {settings.darkMode ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="dark-mode" className="text-sm font-medium cursor-pointer">
              מצב כהה
            </Label>
          </div>
          <Switch
            id="dark-mode"
            checked={settings.darkMode}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, darkMode: checked }))
            }
          />
        </div>

        <DropdownMenuSeparator />

        {/* Reset */}
        <Button
          variant="ghost"
          className="w-full mt-2"
          onClick={resetSettings}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          איפוס הגדרות
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
