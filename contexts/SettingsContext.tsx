import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  APP_FONTS_BY_ID,
  APP_THEMES_BY_ID,
  DEFAULT_APP_SETTINGS,
  TEXT_SIZE_MULTIPLIER,
  normalizeAppSettings,
  type AppFontOption,
  type AppSettings,
  type AppThemePalette,
} from "@/constants/settings";

const STORAGE_KEY = "scotty_app_settings_v1";

export interface SettingsContextValue {
  settings: AppSettings;
  hydrated: boolean;
  theme: AppThemePalette;
  font: AppFontOption;
  textScale: number;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  applySettings: (next: AppSettings) => void;
  resetSettings: () => void;
}

const DEFAULT_CONTEXT_VALUE: SettingsContextValue = {
  settings: DEFAULT_APP_SETTINGS,
  hydrated: false,
  theme: APP_THEMES_BY_ID[DEFAULT_APP_SETTINGS.themeId],
  font: APP_FONTS_BY_ID[DEFAULT_APP_SETTINGS.fontId],
  textScale:
    APP_FONTS_BY_ID[DEFAULT_APP_SETTINGS.fontId].baseScale *
    TEXT_SIZE_MULTIPLIER[DEFAULT_APP_SETTINGS.textSize],
  updateSetting: () => {},
  applySettings: () => {},
  resetSettings: () => {},
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          setSettings(normalizeAppSettings(JSON.parse(raw)));
        } catch {
          // Ignore malformed persisted settings and fall back to defaults.
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, hydrated]);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
    },
    [],
  );

  const applySettings = useCallback((next: AppSettings) => {
    setSettings(normalizeAppSettings(next));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_APP_SETTINGS });
  }, []);

  const value = useMemo<SettingsContextValue>(() => {
    const theme = APP_THEMES_BY_ID[settings.themeId];
    const font = APP_FONTS_BY_ID[settings.fontId];
    const textScale = font.baseScale * TEXT_SIZE_MULTIPLIER[settings.textSize];
    return {
      settings,
      hydrated,
      theme,
      font,
      textScale,
      updateSetting,
      applySettings,
      resetSettings,
    };
  }, [settings, hydrated, updateSetting, applySettings, resetSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings requires SettingsProvider");
  return ctx;
}

export function useOptionalSettings(): SettingsContextValue {
  return useContext(SettingsContext) ?? DEFAULT_CONTEXT_VALUE;
}
