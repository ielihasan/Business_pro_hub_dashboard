"use client";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { updateThemeMode, updateThemePreset } from "@/lib/theme-utils";
import { setValueToCookie } from "@/server/server-actions";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import {
  THEME_PRESET_OPTIONS,
  type ThemePreset,
  type ThemeMode,
} from "@/types/preferences/theme";

export function LayoutControls() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const themePreset = usePreferencesStore((s) => s.themePreset);
  const setThemePreset = usePreferencesStore((s) => s.setThemePreset);

  const handleValueChange = async (key: string, value: any) => {
    if (key === "theme_mode") {
      updateThemeMode(value);
      setThemeMode(value as ThemeMode);
    }

    if (key === "theme_preset") {
      updateThemePreset(value);
      setThemePreset(value as ThemePreset);
    }

    await setValueToCookie(key, value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" title="Settings">
          <Settings />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="text-sm leading-none font-medium">
              BusinessHub pro Controls
            </h4>
            <p className="text-muted-foreground text-xs">
              Customize your theme preferences.
            </p>
          </div>

          <div className="space-y-3">
            {/* Theme Mode */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Theme Mode</Label>
              <ToggleGroup
                className="w-full"
                size="sm"
                variant="outline"
                type="single"
                value={themeMode}
                onValueChange={(value) =>
                  handleValueChange("theme_mode", value)
                }
              >
                <ToggleGroupItem className="text-xs" value="light">
                  Light
                </ToggleGroupItem>
                <ToggleGroupItem className="text-xs" value="dark">
                  Dark
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Theme Preset */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Theme Preset</Label>
              <Select
                value={themePreset}
                onValueChange={(value) =>
                  handleValueChange("theme_preset", value)
                }
              >
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_PRESET_OPTIONS.map((preset) => (
                    <SelectItem
                      key={preset.value}
                      value={preset.value}
                      className="text-xs flex items-center gap-2"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            themeMode === "dark"
                              ? preset.primary.dark
                              : preset.primary.light,
                        }}
                      />
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
